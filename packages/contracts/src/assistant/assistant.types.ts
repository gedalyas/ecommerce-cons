export const assistantRoles = ["user", "assistant"] as const;
type AssistantRole = (typeof assistantRoles)[number];

export type AssistantMessage = { role: AssistantRole; text: string };

export const ASSISTANT_UNAVAILABLE_MESSAGE =
  "O assistente não conseguiu responder agora. Tente de novo em instantes.";

export type AssistantReply = { text: string; origin: string; caveats: string[] };
