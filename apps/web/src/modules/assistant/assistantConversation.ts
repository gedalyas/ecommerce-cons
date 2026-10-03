import { z } from "zod";
import {
  ASSISTANT_MAX_MESSAGES,
  ASSISTANT_MAX_TEXT,
  assistantRequestSchema,
  type AssistantMessage,
  type AssistantReply,
} from "@ecommerce/contracts/assistant";
import { storeScreenLabel, type StoreScreen } from "@ecommerce/contracts/auth";

export type AssistantTurn =
  | { role: "user"; text: string }
  | ({ role: "assistant" } & AssistantReply)
  | { role: "notice"; text: string };

const turnSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("user"), text: z.string() }),
  z.object({
    role: z.literal("assistant"),
    text: z.string(),
    origin: z.string(),
    caveats: z.array(z.string()),
  }),
  z.object({ role: z.literal("notice"), text: z.string() }),
]);

export function requestMessagesOf(
  turns: readonly AssistantTurn[],
  question: string,
): AssistantMessage[] {
  const said = turns.flatMap((turn): AssistantMessage[] =>
    turn.role === "notice" ? [] : [{ role: turn.role, text: turn.text }],
  );
  const recent = [...said, { role: "user" as const, text: question }]
    .slice(-ASSISTANT_MAX_MESSAGES)
    .map((message) => ({ ...message, text: message.text.slice(0, ASSISTANT_MAX_TEXT) }));
  return recent.slice(recent.findIndex((message) => message.role === "user"));
}

export function assistantStorageKey(userId: string, storeId: string): string {
  return `assistente:${userId}:${storeId}`;
}

export function requestProblemOf(request: unknown): string | null {
  const parsed = assistantRequestSchema.safeParse(request);
  return parsed.success ? null : (parsed.error.issues[0]?.message ?? "Pergunta inválida.");
}

export function turnsOfStorage(raw: string | null): AssistantTurn[] {
  if (!raw) return [];
  try {
    const parsed = z.array(turnSchema).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function questionScreenOf(screen: StoreScreen | null): StoreScreen | null {
  return screen === "ASSISTANT" ? null : screen;
}

export function assistantContextLabel(screen: StoreScreen | null): string {
  return screen ? storeScreenLabel[screen] : "Dashboard";
}

const overviewSuggestions = [
  "Como foram minhas vendas no período?",
  "O que mais pesou no meu resultado?",
  "Tem algum alerta que eu deva olhar agora?",
];

const suggestionsByScreen: Partial<Record<StoreScreen, readonly string[]>> = {
  MONEY: [
    "Quanto sobrou de lucro no período?",
    "Por que minha margem de contribuição mudou?",
    "Quais custos mais pesam na receita?",
  ],
  MARKETING: [
    "Qual canal trouxe mais receita?",
    "Meu ROAS melhorou em relação ao período anterior?",
    "Onde o investimento rendeu menos?",
  ],
  PRODUCTS: [
    "Quais produtos mais venderam?",
    "Tenho produtos em risco de ruptura?",
    "Quais produtos estão sem custo cadastrado?",
  ],
  CUSTOMERS: [
    "Quantos clientes novos tive no período?",
    "Como está minha taxa de recompra?",
    "Qual o valor de um cliente em 12 meses?",
  ],
  GOALS: [
    "Vou bater a meta de vendas?",
    "Qual meta está mais atrasada?",
    "Quanto falta para a meta de faturamento?",
  ],
};

export function assistantSuggestions(screen: StoreScreen | null): readonly string[] {
  return (screen && suggestionsByScreen[screen]) ?? overviewSuggestions;
}
