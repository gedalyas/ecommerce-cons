import { isRedirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  ASSISTANT_UNAVAILABLE_MESSAGE,
  assistantRequestSchema,
  type AssistantReply,
  type AssistantRequest,
} from "@ecommerce/contracts/assistant";
import { ApiRequestError, apiFetch, type AttemptResult } from "@/shared/dependencies/apiClient";

const UNAVAILABLE_STATUS = 503;

async function askApi(data: AssistantRequest): Promise<AttemptResult<AssistantReply>> {
  try {
    const value = await apiFetch<AssistantReply>("/assistant/messages", {
      method: "POST",
      body: data,
    });
    return { ok: true, value };
  } catch (error) {
    if (isRedirect(error)) throw error;
    const answered =
      error instanceof ApiRequestError &&
      (error.status < 500 || error.status === UNAVAILABLE_STATUS);
    const message: unknown = answered ? error.body?.message : null;
    if (typeof message === "string") return { ok: false, message };
    console.error(error);
    return { ok: false, message: ASSISTANT_UNAVAILABLE_MESSAGE };
  }
}

export const askAssistantFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => assistantRequestSchema.parse(input))
  .handler(({ data }) => askApi(data));
