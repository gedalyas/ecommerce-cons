import { createContext, useContext } from "react";
import type { StoreScreen } from "@ecommerce/contracts/auth";
import type { AssistantTurn } from "./assistantConversation";

type AssistantState = {
  turns: AssistantTurn[];
  pending: boolean;
  screen: StoreScreen | null;
  send: (text: string) => void;
  clear: () => void;
};

export const AssistantContext = createContext<AssistantState | null>(null);

export function useAssistant(): AssistantState {
  const state = useContext(AssistantContext);
  if (!state) throw new Error("useAssistant needs an AssistantProvider");
  return state;
}
