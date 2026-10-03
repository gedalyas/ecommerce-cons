export const assistantRoles = ["user", "assistant"] as const;
type AssistantRole = (typeof assistantRoles)[number];

export type AssistantMessage = { role: AssistantRole; text: string };

export type AssistantReply = { text: string; origin: string; caveats: string[] };
