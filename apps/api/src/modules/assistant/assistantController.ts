import type { Request, Response } from "express";
import { assistantRequestSchema } from "@ecommerce/contracts/assistant";
import type { AnthropicClient } from "@/shared/ai/createAnthropic";
import { authOf } from "@/shared/http/authOf";
import { HttpError } from "@/shared/http/httpError";
import { parseOrThrow } from "@/shared/http/validate";
import { askAssistant } from "./assistantService";

export type AssistantDependencies = { anthropic: AnthropicClient | null };

export function assistantController({ anthropic }: AssistantDependencies) {
  return {
    async ask(req: Request, res: Response) {
      if (!anthropic) throw new HttpError(503, "O assistente não está disponível agora.");
      const request = parseOrThrow(assistantRequestSchema, req.body ?? {});
      res.json(await askAssistant(authOf(req), request, anthropic));
    },
  };
}
