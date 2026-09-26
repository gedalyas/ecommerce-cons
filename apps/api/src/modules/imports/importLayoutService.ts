import { createHash } from "node:crypto";
import {
  columnMappingSchema,
  layoutKeyOf,
  mappingProblems,
  type ColumnMapping,
  type ImportKind,
} from "@ecommerce/contracts/imports";
import { prismaClient } from "@ecommerce/database/client";

type Layout = { clientId: string; kind: ImportKind; header: string[] };

const hashedKeyOf = (header: string[]) =>
  createHash("sha256").update(layoutKeyOf(header)).digest("hex");

export async function rememberedMapping({
  clientId,
  kind,
  header,
}: Layout): Promise<ColumnMapping | null> {
  const row = await prismaClient.importLayout.findUnique({
    where: { clientId_kind_layoutKey: { clientId, kind, layoutKey: hashedKeyOf(header) } },
    select: { mapping: true },
  });
  const parsed = columnMappingSchema.safeParse(row?.mapping);
  if (!parsed.success) return null;
  return mappingProblems(kind, header, parsed.data).length === 0 ? parsed.data : null;
}

export async function rememberLayout(
  { clientId, kind, header }: Layout,
  mapping: ColumnMapping,
): Promise<void> {
  const layoutKey = hashedKeyOf(header);
  try {
    await prismaClient.importLayout.upsert({
      where: { clientId_kind_layoutKey: { clientId, kind, layoutKey } },
      create: { clientId, kind, layoutKey, mapping },
      update: { mapping },
    });
  } catch (error) {
    console.error(error);
  }
}
