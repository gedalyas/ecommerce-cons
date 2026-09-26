import Anthropic from "@anthropic-ai/sdk";
import { importKindLabel, type ImportMappingSuggestion } from "@ecommerce/contracts/imports";
import { recordActivity } from "@/modules/audit/contract";
import type { AnthropicClient } from "@/shared/ai/createAnthropic";
import type { AuthContext } from "@/shared/http/auth.types";
import { HttpError } from "@/shared/http/httpError";
import { readTable, type ImportRequest } from "./importsService";
import {
  SUGGESTION_SYSTEM,
  mappingOfSuggestion,
  suggestionColumns,
  suggestionFormat,
  suggestionPrompt,
} from "./mappingSuggestion";
import { looksLikeData, maskedSample } from "./sampleMask";

const SUGGESTION_MODEL = "claude-haiku-4-5";
const SAMPLE_ROWS = 10;
const SAMPLE_BUDGET = 30_000;
const UNAVAILABLE = "A IA não respondeu agora. Escolha as colunas à mão ou tente de novo.";

async function askForMapping(
  anthropic: AnthropicClient,
  request: ImportRequest,
  header: string[],
  rows: string[][],
) {
  const columns = suggestionColumns(header);
  const response = await anthropic.messages.create({
    model: SUGGESTION_MODEL,
    max_tokens: 2048,
    system: SUGGESTION_SYSTEM,
    output_config: { format: suggestionFormat(request.kind, columns) },
    messages: [
      {
        role: "user",
        content: suggestionPrompt(
          request.kind,
          columns,
          maskedSample(rows, header.length, SAMPLE_ROWS, SAMPLE_BUDGET),
        ),
      },
    ],
  });
  const text = response.content.find((block) => block.type === "text");
  if (response.stop_reason !== "end_turn" || !text || text.type !== "text") return null;
  try {
    return JSON.parse(text.text) as unknown;
  } catch {
    return null;
  }
}

export async function suggestMappingWithAi(
  auth: AuthContext,
  request: ImportRequest,
  anthropic: AnthropicClient,
): Promise<ImportMappingSuggestion> {
  const { header, rows } = await readTable(request.file);
  if (header.some(looksLikeData)) {
    throw new HttpError(
      422,
      "A primeira linha parece ser de dados, não de nomes de coluna. Escolha as colunas à mão.",
    );
  }
  let answer: unknown;
  try {
    answer = await askForMapping(anthropic, request, header, rows);
  } catch (error) {
    if (!(error instanceof Anthropic.APIError)) throw error;
    console.error("anthropic", error.status, error.requestID);
    throw new HttpError(502, UNAVAILABLE);
  }
  if (answer === null) throw new HttpError(502, UNAVAILABLE);
  const mapping = mappingOfSuggestion(request.kind, header, answer);
  await recordActivity(auth, auth.clientId, {
    action: "IMPORT_MAPPING_SUGGESTED",
    kind: importKindLabel[request.kind],
    fileName: request.file.name,
    fields: Object.keys(mapping).length,
  });
  return { mapping };
}
