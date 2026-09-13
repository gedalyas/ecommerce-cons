import { z, type ZodTypeAny } from "zod";

type Unwrapped = { base: ZodTypeAny; nullable: boolean };

function unwrap(schema: ZodTypeAny): Unwrapped {
  let current = schema;
  let nullable = false;
  for (;;) {
    if (current instanceof z.ZodNullable) {
      nullable = true;
      current = current._def.innerType as ZodTypeAny;
    } else if (
      current instanceof z.ZodCatch ||
      current instanceof z.ZodDefault ||
      current instanceof z.ZodOptional
    ) {
      current = current._def.innerType as ZodTypeAny;
    } else if (current instanceof z.ZodEffects) {
      current = current._def.schema as ZodTypeAny;
    } else {
      return { base: current, nullable };
    }
  }
}

function coerceScalar(base: ZodTypeAny, nullable: boolean, value: string): unknown {
  if (base instanceof z.ZodNumber) {
    if (value.trim() === "") return nullable ? null : undefined;
    return Number(value);
  }
  if (base instanceof z.ZodBoolean)
    return value === "true" ? true : value === "false" ? false : value;
  if (base instanceof z.ZodNull) return value === "null" ? null : value;
  if (base instanceof z.ZodUnion) {
    const options = base.options as ZodTypeAny[];
    const ordered = [...options.filter((o) => !(o instanceof z.ZodString)), ...options];
    for (const option of ordered) {
      const coerced = coerceValue(option, value);
      if (option.safeParse(coerced).success) return coerced;
    }
  }
  return value;
}

function coerceValue(schema: ZodTypeAny, value: unknown): unknown {
  const { base, nullable } = unwrap(schema);
  if (base instanceof z.ZodArray) {
    const items = Array.isArray(value) ? value : value === undefined ? [] : [value];
    return items.map((item) => coerceValue(base.element as ZodTypeAny, item));
  }
  if (base instanceof z.ZodObject && value !== null && typeof value === "object") {
    return coerceQuery(base, value as Record<string, unknown>);
  }
  return typeof value === "string" ? coerceScalar(base, nullable, value) : value;
}

export function coerceQuery(
  schema: z.ZodObject<z.ZodRawShape>,
  query: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...query };
  for (const [key, field] of Object.entries(schema.shape)) {
    if (key in query) result[key] = coerceValue(field as ZodTypeAny, query[key]);
  }
  return result;
}
