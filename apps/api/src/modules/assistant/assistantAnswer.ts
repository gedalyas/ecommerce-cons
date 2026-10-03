import { z } from "zod";
import type { AssistantReply } from "@ecommerce/contracts/assistant";
import {
  areaKeyOfPillar,
  engagementTemplate,
  pillarTemplateOf,
  sectionKeys,
  type SectionKey,
} from "@ecommerce/contracts/consulting";

const answerAreas = [
  "overview",
  "orders",
  "products",
  "customers",
  "goals",
  ...sectionKeys,
] as const;
type AnswerArea = (typeof answerAreas)[number];

const dataAreaLabel: Record<Exclude<AnswerArea, SectionKey>, string> = {
  overview: "Visão geral",
  orders: "Pedidos",
  products: "Produtos",
  customers: "Clientes",
  goals: "Metas",
};

const MAX_CAVEATS = 3;
const MAX_TEXT = 4000;
const pillarKeys = engagementTemplate.flatMap((area) => area.pillars.map((p) => p.key));

export const answerFormat = {
  type: "json_schema" as const,
  schema: {
    type: "object",
    properties: {
      area: { type: "string", enum: [...answerAreas] },
      pillar: { anyOf: [{ type: "string", enum: pillarKeys }, { type: "null" }] },
      text: { type: "string" },
      caveats: { type: "array", items: { type: "string" } },
    },
    required: ["area", "pillar", "text", "caveats"],
    additionalProperties: false,
  },
};

const answerSchema = z.object({
  area: z.enum(answerAreas),
  pillar: z.string().nullable(),
  text: z.string().trim().min(1),
  caveats: z.array(z.string()),
});

const isSectionKey = (area: AnswerArea): area is SectionKey =>
  sectionKeys.some((key) => key === area);

function originLabel(area: AnswerArea, pillar: string | null): string {
  if (!isSectionKey(area)) return dataAreaLabel[area];
  const title = engagementTemplate.find((a) => a.key === area)?.title ?? "";
  const pillarTitle =
    pillar && areaKeyOfPillar(pillar) === area ? pillarTemplateOf(pillar)?.title : null;
  return pillarTitle ? `${title} · ${pillarTitle}` : title;
}

export function replyOfAnswer(raw: string): AssistantReply | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = answerSchema.safeParse(json);
  if (!parsed.success) return null;
  const { area, pillar, text, caveats } = parsed.data;
  return {
    text: text.slice(0, MAX_TEXT),
    origin: originLabel(area, pillar),
    caveats: caveats
      .map((caveat) => caveat.trim())
      .filter((caveat) => caveat !== "")
      .slice(0, MAX_CAVEATS),
  };
}
