import { useEffect, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ASSISTANT_UNAVAILABLE_MESSAGE } from "@ecommerce/contracts/assistant";
import type { StoreScreen } from "@ecommerce/contracts/auth";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { askAssistantFn } from "./assistantController";
import {
  assistantStorageKey,
  questionScreenOf,
  requestMessagesOf,
  requestProblemOf,
  turnsOfStorage,
  type AssistantTurn,
} from "./assistantConversation";
import { AssistantContext } from "./useAssistant";

function readTurns(key: string | null): AssistantTurn[] {
  if (!key) return [];
  try {
    return turnsOfStorage(window.sessionStorage.getItem(key));
  } catch {
    return [];
  }
}

function writeTurns(key: string | null, turns: AssistantTurn[]) {
  if (!key) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(turns));
  } catch {
    return;
  }
}

export function AssistantProvider({
  userId,
  storeId,
  screen,
  children,
}: {
  userId: string;
  storeId: string | null;
  screen: StoreScreen | null;
  children: ReactNode;
}) {
  const { period } = usePeriod();
  const ask = useServerFn(askAssistantFn);
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [pending, setPending] = useState(false);
  const key = storeId ? assistantStorageKey(userId, storeId) : null;
  const currentKey = useRef(key);
  const questionScreen = questionScreenOf(screen);

  useEffect(() => {
    currentKey.current = key;
    setTurns(readTurns(key));
    setPending(false);
  }, [key]);

  const update = (next: (prev: AssistantTurn[]) => AssistantTurn[], forKey: string | null) => {
    if (currentKey.current !== forKey) return;
    setTurns((prev) => {
      const turns = next(prev);
      writeTurns(forKey, turns);
      return turns;
    });
  };

  const send = (text: string) => {
    const question = text.trim();
    if (!question || pending) return;
    const forKey = key;
    const { inicio, fim, canal } = period;
    const request = {
      messages: requestMessagesOf(turns, question),
      inicio,
      fim,
      canal,
      screen: questionScreen,
    };
    update((prev) => [...prev, { role: "user", text: question }], forKey);
    const problem = requestProblemOf(request);
    if (problem) {
      update((prev) => [...prev, { role: "notice", text: problem }], forKey);
      return;
    }
    setPending(true);
    void ask({ data: request })
      .then((result) =>
        result.ok
          ? ({ role: "assistant", ...result.value } as const)
          : ({ role: "notice", text: result.message } as const),
      )
      .catch(() => ({ role: "notice" as const, text: ASSISTANT_UNAVAILABLE_MESSAGE }))
      .then((turn) => update((prev) => [...prev, turn], forKey))
      .finally(() => {
        if (currentKey.current === forKey) setPending(false);
      });
  };

  const clear = () => update(() => [], key);

  return (
    <AssistantContext.Provider value={{ turns, pending, screen: questionScreen, send, clear }}>
      {children}
    </AssistantContext.Provider>
  );
}
