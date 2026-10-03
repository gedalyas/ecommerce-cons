import Anthropic from "@anthropic-ai/sdk";
import type {
  Message,
  MessageParam,
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import { prismaClient } from "@ecommerce/database/client";
import type { SalesPlatform } from "@ecommerce/database/enums";
import {
  ASSISTANT_UNAVAILABLE_MESSAGE,
  type AssistantReply,
  type AssistantRequest,
} from "@ecommerce/contracts/assistant";
import { defaultGoalsSearch } from "@ecommerce/contracts/goals";
import { defaultMarketingSearch } from "@ecommerce/contracts/marketing";
import type { Channel, PeriodSearch } from "@ecommerce/contracts/shared/period";
import { resolvePeriod } from "@ecommerce/contracts/shared/periodWindow";
import { recordActivity } from "@/modules/audit/contract";
import { dataSourcesFor } from "@/modules/connections/contract";
import { customersAggregate, retentionSummary } from "@/modules/customers/contract";
import { dashboardOverview } from "@/modules/dashboard/contract";
import { goalsScreen } from "@/modules/goals/contract";
import { marketingScreen } from "@/modules/marketing/contract";
import { marketingCostLines, moneyDre } from "@/modules/money/contract";
import { inventoryHealthFor, productSales } from "@/modules/products/contract";
import type { AnthropicClient } from "@/shared/ai/createAnthropic";
import { currentDay } from "@/shared/config/clock";
import type { AuthContext } from "@/shared/http/auth.types";
import { HttpError } from "@/shared/http/httpError";
import { answerFormat, replyOfAnswer } from "./assistantAnswer";
import {
  channelsFacts,
  customersFacts,
  goalsFacts,
  moneyFacts,
  overviewFacts,
  productsFacts,
  sourcesFacts,
} from "./assistantFacts";
import { assistantSystem, conversationOf } from "./assistantPrompt";
import {
  assistantToolLabel,
  canUseTool,
  isAssistantTool,
  toolCallKey,
  toolPeriodOf,
  toolSearchOf,
  toolsFor,
  type AssistantToolDefinition,
  type AssistantToolName,
} from "./assistantTools";

const ASSISTANT_MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 1024;
const MAX_TOOL_ROUNDS = 4;
const MAX_TOOL_CALLS = 8;
const QUESTION_DEADLINE_MS = 60_000;
const TOO_MANY_LOOKUPS =
  "Too many lookups for one question: answer with the data already gathered.";

const platformOfChannel: Record<Channel, SalesPlatform | null> = {
  todos: null,
  ecommerce: "ECOMMERCE",
  marketplace: "MARKETPLACE",
};

async function marketingChannels(clientId: string, search: PeriodSearch) {
  const custos = await marketingCostLines(clientId, search);
  const screen = await marketingScreen(clientId, {
    ...defaultMarketingSearch,
    ...search,
    aba: "canais",
    custos,
    canEdit: false,
  });
  const period = { inicio: search.inicio, fim: search.fim };
  return "salesChannels" in screen ? channelsFacts(period, screen.salesChannels) : null;
}

async function factsOf(auth: AuthContext, tool: AssistantToolName, search: PeriodSearch) {
  const { clientId } = auth;
  const period = { inicio: search.inicio, fim: search.fim };
  const window = resolvePeriod(search).current;
  const platform = platformOfChannel[search.canal];
  switch (tool) {
    case "store_overview":
      return overviewFacts(period, await dashboardOverview(auth, search));
    case "data_sources":
      return sourcesFacts(await dataSourcesFor(clientId));
    case "money_results":
      return moneyFacts(period, await moneyDre(clientId, search));
    case "products_sales": {
      const [sales, health] = await Promise.all([
        productSales(clientId, window, platform, null),
        inventoryHealthFor(clientId),
      ]);
      return productsFacts(period, sales, health);
    }
    case "marketing_channels":
      return marketingChannels(clientId, search);
    case "customers_retention": {
      const [aggregate, retention] = await Promise.all([
        customersAggregate(clientId, window, platform),
        retentionSummary(clientId),
      ]);
      return customersFacts(period, aggregate, retention);
    }
    case "goals_progress": {
      const screen = await goalsScreen(clientId, { ...search, ...defaultGoalsSearch });
      return screen.aba === "resumo" ? goalsFacts(screen.summary) : null;
    }
  }
}

type Lookups = { results: Map<string, string>; consulted: Set<AssistantToolName> };

const resultOf = (block: ToolUseBlock, content: string, isError = false): ToolResultBlockParam => ({
  type: "tool_result",
  tool_use_id: block.id,
  content,
  ...(isError ? { is_error: true } : {}),
});

async function toolResult(
  auth: AuthContext,
  request: AssistantRequest,
  lookups: Lookups,
  block: ToolUseBlock,
): Promise<ToolResultBlockParam> {
  if (!isAssistantTool(block.name)) return resultOf(block, "Unknown tool.", true);
  if (!canUseTool(block.name, auth.access, auth.release)) {
    return resultOf(block, "The user has no access to this area.", true);
  }
  const period = toolPeriodOf(block.input, request);
  if (!period.ok) return resultOf(block, period.message, true);
  const key = toolCallKey(block.name, period.period);
  const known = lookups.results.get(key);
  if (known !== undefined) return resultOf(block, known);
  if (lookups.results.size >= MAX_TOOL_CALLS) return resultOf(block, TOO_MANY_LOOKUPS, true);
  const facts = await factsOf(auth, block.name, toolSearchOf(period.period, request.canal));
  const content = JSON.stringify(facts);
  lookups.results.set(key, content);
  lookups.consulted.add(block.name);
  return resultOf(block, content);
}

async function resultsOf(
  auth: AuthContext,
  request: AssistantRequest,
  lookups: Lookups,
  uses: readonly ToolUseBlock[],
): Promise<ToolResultBlockParam[]> {
  const results: ToolResultBlockParam[] = [];
  for (const use of uses) results.push(await toolResult(auth, request, lookups, use));
  return results;
}

type Exchange = {
  system: string;
  tools: AssistantToolDefinition[];
  messages: MessageParam[];
  allowTools: boolean;
  signal: AbortSignal;
};

async function nextMessage(anthropic: AnthropicClient, exchange: Exchange): Promise<Message> {
  try {
    return await anthropic.messages.create(
      {
        model: ASSISTANT_MODEL,
        max_tokens: MAX_TOKENS,
        system: exchange.system,
        tools: exchange.tools,
        tool_choice: exchange.allowTools ? { type: "auto" } : { type: "none" },
        output_config: { format: answerFormat },
        messages: exchange.messages,
      },
      { signal: exchange.signal },
    );
  } catch (error) {
    if (!(error instanceof Anthropic.APIError)) throw error;
    console.error("anthropic", error.status, error.requestID);
    throw new HttpError(502, ASSISTANT_UNAVAILABLE_MESSAGE);
  }
}

function replyOf(message: Message): AssistantReply {
  const text = message.content.find((block) => block.type === "text");
  const reply =
    message.stop_reason === "end_turn" && text?.type === "text" ? replyOfAnswer(text.text) : null;
  if (!reply) throw new HttpError(502, ASSISTANT_UNAVAILABLE_MESSAGE);
  return reply;
}

async function systemFor(
  auth: AuthContext,
  request: AssistantRequest,
  tools: readonly AssistantToolDefinition[],
): Promise<string> {
  const store = await prismaClient.client.findUniqueOrThrow({
    where: { id: auth.clientId },
    select: { name: true },
  });
  return assistantSystem({
    storeName: store.name,
    today: currentDay(),
    period: { inicio: request.inicio, fim: request.fim },
    channel: request.canal,
    screen: request.screen,
    tools: tools.map((tool) => tool.name),
  });
}

export async function askAssistant(
  auth: AuthContext,
  request: AssistantRequest,
  anthropic: AnthropicClient,
): Promise<AssistantReply> {
  const tools = toolsFor(auth.access, auth.release);
  const system = await systemFor(auth, request, tools);
  const messages: MessageParam[] = conversationOf(request.messages);
  const lookups: Lookups = { results: new Map(), consulted: new Set() };
  const signal = AbortSignal.timeout(QUESTION_DEADLINE_MS);
  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const allowTools = round < MAX_TOOL_ROUNDS;
    const message = await nextMessage(anthropic, { system, tools, messages, allowTools, signal });
    const uses = message.content.filter((block) => block.type === "tool_use");
    if (message.stop_reason !== "tool_use" || uses.length === 0) {
      const reply = replyOf(message);
      await recordActivity(auth, auth.clientId, {
        action: "ASSISTANT_ASKED",
        consulted: [...lookups.consulted].map((tool) => assistantToolLabel[tool]),
      });
      return reply;
    }
    const results = await resultsOf(auth, request, lookups, uses);
    messages.push(
      { role: "assistant", content: message.content },
      { role: "user", content: results },
    );
  }
  throw new HttpError(502, ASSISTANT_UNAVAILABLE_MESSAGE);
}
