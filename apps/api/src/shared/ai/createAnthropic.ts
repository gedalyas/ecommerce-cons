import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "@/shared/config/env";

export type AnthropicClient = Anthropic;

export function createAnthropic(env: Env): AnthropicClient | null {
  if (!env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    authToken: null,
    logLevel: "off",
    baseURL: env.ANTHROPIC_BASE_URL,
    timeout: 30_000,
    maxRetries: 1,
  });
}
