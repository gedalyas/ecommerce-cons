import type { Request } from "express";
import type { z } from "zod";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { currentDay } from "@/shared/config/clock";
import { coerceQuery } from "./coerceQuery";
import { parseOrThrow } from "./validate";

type Query = Record<string, unknown>;

export function periodOf(req: Request): PeriodSearch {
  return parsePeriodSearch(req.query as Partial<PeriodSearch>, currentDay());
}

export function screenQuery<T extends z.ZodRawShape>(
  req: Request,
  schema: z.ZodObject<T>,
): PeriodSearch & z.infer<z.ZodObject<T>> {
  const query = req.query as Query;
  return { ...periodOf(req), ...parseOrThrow(schema, coerceQuery(schema, query)) };
}
