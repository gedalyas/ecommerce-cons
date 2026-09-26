import { importTemplates } from "./importTemplates";
import {
  IMPORT_MAPPING_SAMPLE_ROWS,
  IMPORT_MAX_COLUMNS,
  IMPORT_MAX_HEADER_LENGTH,
  type ColumnMapping,
  type ImportKind,
} from "./imports.types";
import { normalizeHeader } from "./importValues";

const headerSynonyms: Record<string, readonly string[]> = {
  numero: ["numero_do_pedido", "pedido", "n_pedido", "no_pedido", "id_pedido", "order_id", "name"],
  data: ["data_do_pedido", "data_da_compra", "data_da_venda", "dia", "date", "created_at"],
  status: ["situacao", "status_do_pedido", "status_do_pagamento", "financial_status"],
  cliente_email: ["email", "e_mail", "email_do_cliente", "customer_email"],
  cliente_nome: ["cliente", "nome", "nome_do_cliente", "comprador", "billing_name"],
  cidade: ["municipio", "city"],
  uf: ["estado", "state", "province"],
  cupons: ["cupom", "cupom_de_desconto", "discount_code"],
  frete: ["valor_do_frete", "custo_do_frete", "shipping"],
  desconto: ["descontos", "valor_do_desconto", "discount"],
  sku: ["codigo", "codigo_do_produto", "referencia", "lineitem_sku"],
  produto: ["nome_do_produto", "descricao", "titulo", "item", "lineitem_name", "product_name"],
  categoria: ["category"],
  quantidade: ["qtd", "qtde", "quant", "quantity", "lineitem_quantity"],
  preco_unitario: ["preco", "valor_unitario", "preco_de_venda", "unit_price", "lineitem_price"],
  custo_unitario: ["custo", "custo_do_produto", "unit_cost"],
  investimento: ["valor_gasto", "gasto", "valor_investido", "spend", "amount_spent"],
  campanha: ["nome_da_campanha", "campaign", "campaign_name"],
  impressoes: ["impressions"],
  cliques: ["cliques_no_link", "clicks"],
  conversoes: ["compras", "resultados", "conversions"],
  receita_atribuida: ["valor_de_conversao", "receita", "conversion_value"],
  origem: ["fonte", "source"],
  meio: ["medium"],
  sessoes: ["visitas", "sessions"],
  usuarios: ["users"],
};

export function layoutKeyOf(header: string[]): string {
  return header
    .map(normalizeHeader)
    .filter((name) => name !== "")
    .sort()
    .join("|");
}

export function isTemplateLayout(kind: ImportKind, header: string[]): boolean {
  const present = new Set(header.map(normalizeHeader));
  return importTemplates[kind].columns.every((c) => !c.required || present.has(c.header));
}

export function headerProblem(header: string[]): string | null {
  if (header.length > IMPORT_MAX_COLUMNS) {
    return `A planilha tem mais de ${IMPORT_MAX_COLUMNS} colunas.`;
  }
  if (header.some((name) => name.length > IMPORT_MAX_HEADER_LENGTH)) {
    return `Um nome de coluna passa de ${IMPORT_MAX_HEADER_LENGTH} caracteres.`;
  }
  return null;
}

export function mappingSampleOf(rows: string[][]): string[][] {
  return rows
    .slice(0, IMPORT_MAPPING_SAMPLE_ROWS)
    .map((cells) => cells.map((cell) => cell.slice(0, IMPORT_MAX_HEADER_LENGTH)));
}

function headerIndexOf(header: string[]): Map<string, number> {
  const index = new Map<string, number>();
  header.forEach((name, position) => {
    const normalized = normalizeHeader(name);
    if (normalized !== "" && !index.has(normalized)) index.set(normalized, position);
  });
  return index;
}

const positionOf = (index: Map<string, number>, source: string | undefined): number =>
  source === undefined ? -1 : (index.get(normalizeHeader(source)) ?? -1);

export function suggestMapping(kind: ImportKind, header: string[]): ColumnMapping {
  const normalized = header.map(normalizeHeader);
  const used = new Set<number>();
  const mapping: ColumnMapping = {};
  const claim = (key: string, names: readonly string[]) => {
    const position = normalized.findIndex((name, i) => !used.has(i) && names.includes(name));
    if (position < 0 || mapping[key]) return;
    used.add(position);
    mapping[key] = header[position] ?? "";
  };
  const columns = importTemplates[kind].columns;
  for (const column of columns) claim(column.key, [column.header]);
  for (const column of columns) claim(column.key, headerSynonyms[column.header] ?? []);
  return mapping;
}

export function mappingProblems(
  kind: ImportKind,
  header: string[],
  mapping: ColumnMapping,
): string[] {
  const columns = importTemplates[kind].columns;
  const known = new Set(columns.map((c) => c.key));
  const unknown = Object.keys(mapping)
    .filter((key) => !known.has(key))
    .map((key) => `Campo desconhecido: ${key}.`);
  const index = headerIndexOf(header);
  const absent = Object.values(mapping)
    .filter((source) => positionOf(index, source) < 0)
    .map((source) => `A coluna "${source}" não está na planilha.`);
  const missing = columns
    .filter((c) => c.required && !mapping[c.key])
    .map((c) => `Escolha a coluna de "${c.header}".`);
  return [...unknown, ...absent, ...missing];
}

export function remapTable(
  kind: ImportKind,
  header: string[],
  rows: string[][],
  mapping: ColumnMapping,
): { header: string[]; rows: string[][] } {
  const index = headerIndexOf(header);
  const picked = importTemplates[kind].columns
    .map((column) => ({ header: column.header, position: positionOf(index, mapping[column.key]) }))
    .filter((column) => column.position >= 0);
  return {
    header: picked.map((column) => column.header),
    rows: rows.map((cells) => picked.map((column) => cells[column.position] ?? "")),
  };
}
