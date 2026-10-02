import type { ImportKind } from "./imports.types";

export const importColumnTypes = ["text", "number", "integer", "date", "enum"] as const;
export type ImportColumnType = (typeof importColumnTypes)[number];

export type ImportColumn = {
  key: string;
  header: string;
  required: boolean;
  type: ImportColumnType;
  example: string;
  options?: readonly string[];
};

export type ImportTemplate = { kind: ImportKind; description: string; columns: ImportColumn[] };

export const orderStatusOptions = [
  "pago",
  "pendente",
  "autorizado",
  "cancelado",
  "estornado",
] as const;
export const salesPlatformOptions = ["ecommerce", "marketplace"] as const;
export const processingMethodOptions = ["cartao", "pix", "boleto"] as const;
export const adPlatformOptions = ["meta", "google", "tiktok"] as const;

export const importTemplates: Record<ImportKind, ImportTemplate> = {
  ORDERS: {
    kind: "ORDERS",
    description:
      "Uma linha por item de pedido. Linhas com o mesmo número formam um pedido; o pedido é substituído se já existir.",
    columns: [
      { key: "number", header: "numero", required: true, type: "text", example: "#10432" },
      { key: "placedAt", header: "data", required: true, type: "date", example: "05/09/2026" },
      {
        key: "status",
        header: "status",
        required: true,
        type: "enum",
        example: "pago",
        options: orderStatusOptions,
      },
      {
        key: "email",
        header: "cliente_email",
        required: true,
        type: "text",
        example: "ana@email.com",
      },
      {
        key: "customerName",
        header: "cliente_nome",
        required: true,
        type: "text",
        example: "Ana Souza",
      },
      { key: "city", header: "cidade", required: false, type: "text", example: "São Paulo" },
      { key: "province", header: "uf", required: false, type: "text", example: "SP" },
      {
        key: "salesPlatform",
        header: "plataforma",
        required: false,
        type: "enum",
        example: "ecommerce",
        options: salesPlatformOptions,
      },
      { key: "channel", header: "canal", required: false, type: "text", example: "Loja virtual" },
      { key: "gateway", header: "gateway", required: false, type: "text", example: "Pagar.me" },
      {
        key: "processingMethod",
        header: "pagamento",
        required: false,
        type: "enum",
        example: "pix",
        options: processingMethodOptions,
      },
      { key: "utmSource", header: "utm_source", required: false, type: "text", example: "meta" },
      {
        key: "utmMedium",
        header: "utm_medium",
        required: false,
        type: "text",
        example: "paid-social",
      },
      {
        key: "utmCampaign",
        header: "utm_campaign",
        required: false,
        type: "text",
        example: "inverno",
      },
      { key: "coupons", header: "cupons", required: false, type: "text", example: "INSTA10" },
      { key: "shipping", header: "frete", required: false, type: "number", example: "19,90" },
      { key: "discount", header: "desconto", required: false, type: "number", example: "10,00" },
      { key: "sku", header: "sku", required: true, type: "text", example: "AUR-114-AZ-M" },
      {
        key: "productName",
        header: "produto",
        required: true,
        type: "text",
        example: "Manta de tricô",
      },
      { key: "category", header: "categoria", required: false, type: "text", example: "Decoração" },
      { key: "quantity", header: "quantidade", required: true, type: "integer", example: "2" },
      {
        key: "unitPrice",
        header: "preco_unitario",
        required: true,
        type: "number",
        example: "129,90",
      },
      {
        key: "unitCost",
        header: "custo_unitario",
        required: false,
        type: "number",
        example: "61,00",
      },
    ],
  },
  AD_SPEND: {
    kind: "AD_SPEND",
    description:
      "Uma linha por anúncio e dia. Os dias presentes no arquivo substituem o que já existia para a mesma plataforma.",
    columns: [
      { key: "date", header: "data", required: true, type: "date", example: "05/09/2026" },
      {
        key: "platform",
        header: "plataforma",
        required: true,
        type: "enum",
        example: "meta",
        options: adPlatformOptions,
      },
      {
        key: "campaignId",
        header: "campanha_id",
        required: false,
        type: "text",
        example: "120001",
      },
      {
        key: "campaignName",
        header: "campanha",
        required: true,
        type: "text",
        example: "Inverno · Conversão",
      },
      { key: "adsetId", header: "conjunto_id", required: false, type: "text", example: "230001" },
      {
        key: "adsetName",
        header: "conjunto",
        required: false,
        type: "text",
        example: "Lookalike 1%",
      },
      { key: "adId", header: "anuncio_id", required: false, type: "text", example: "340001" },
      { key: "adName", header: "anuncio", required: false, type: "text", example: "Vídeo manta" },
      { key: "spend", header: "investimento", required: true, type: "number", example: "150,00" },
      { key: "platformFee", header: "taxa", required: false, type: "number", example: "2,25" },
      {
        key: "impressions",
        header: "impressoes",
        required: false,
        type: "integer",
        example: "12000",
      },
      { key: "clicks", header: "cliques", required: false, type: "integer", example: "340" },
      { key: "conversions", header: "conversoes", required: false, type: "integer", example: "12" },
      {
        key: "attributedRevenue",
        header: "receita_atribuida",
        required: false,
        type: "number",
        example: "980,00",
      },
    ],
  },
  TRAFFIC: {
    kind: "TRAFFIC",
    description: "Uma linha por origem/meio e dia, como o relatório de aquisição do GA4.",
    columns: [
      { key: "date", header: "data", required: true, type: "date", example: "05/09/2026" },
      { key: "source", header: "origem", required: true, type: "text", example: "google" },
      { key: "medium", header: "meio", required: true, type: "text", example: "cpc" },
      { key: "sessions", header: "sessoes", required: true, type: "integer", example: "420" },
      { key: "users", header: "usuarios", required: false, type: "integer", example: "380" },
      {
        key: "newUsers",
        header: "novos_usuarios",
        required: false,
        type: "integer",
        example: "300",
      },
      { key: "viewItem", header: "view_item", required: false, type: "integer", example: "260" },
      { key: "addToCart", header: "add_to_cart", required: false, type: "integer", example: "48" },
      {
        key: "beginCheckout",
        header: "begin_checkout",
        required: false,
        type: "integer",
        example: "20",
      },
    ],
  },
  PRODUCTS: {
    kind: "PRODUCTS",
    description:
      "Uma linha por SKU. Custo, estoque e categoria substituem o que o produto já tinha; o custo novo também vale para os pedidos que estavam sem custo.",
    columns: [
      { key: "sku", header: "sku", required: true, type: "text", example: "MANTA-AZUL-M" },
      { key: "name", header: "produto", required: false, type: "text", example: "Manta tricô" },
      { key: "cost", header: "custo", required: false, type: "number", example: "48,90" },
      { key: "stock", header: "estoque", required: false, type: "integer", example: "32" },
      { key: "category", header: "categoria", required: false, type: "text", example: "Mantas" },
    ],
  },
};

export function requiredHeaders(kind: ImportKind): string[] {
  return importTemplates[kind].columns.filter((c) => c.required).map((c) => c.header);
}

export function templateRows(kind: ImportKind): string[][] {
  const columns = importTemplates[kind].columns;
  return [columns.map((c) => c.header), columns.map((c) => c.example)];
}
