import type { ConnectorStatusOption, StatusMappingTarget } from "@ecommerce/contracts/connectors";
import type { FinancialStatus, ProcessingMethod } from "@ecommerce/database/enums";
import type { OrderInput } from "@/modules/imports/contract";

export type BlingOrderSummary = {
  id: number | string;
  numero?: number | string | null;
  data?: string | null;
  dataSaida?: string | null;
  total?: number | string | null;
  totalProdutos?: number | string | null;
  desconto?: { valor?: number | string | null; unidade?: string | null } | number | string | null;
  transporte?: { frete?: number | string | null } | null;
  situacao?: { id?: number | string | null; valor?: number | string | null } | null;
  loja?: { id?: number | string | null } | null;
  contato?: {
    id?: number | string | null;
    nome?: string | null;
    tipoPessoa?: string | null;
  } | null;
};

export type BlingOrder = BlingOrderSummary & {
  itens?: {
    codigo?: string | null;
    descricao?: string | null;
    quantidade?: number | string | null;
    valor?: number | string | null;
    produto?: { id?: number | string | null } | null;
  }[];
  parcelas?: { formaPagamento?: { id?: number | string | null } | null }[] | null;
  transporte?: {
    frete?: number | string | null;
    etiqueta?: { municipio?: string | null; uf?: string | null } | null;
  } | null;
};

export type BlingContact = {
  id: number | string;
  nome?: string | null;
  email?: string | null;
  endereco?: { geral?: { municipio?: string | null; uf?: string | null } | null } | null;
};

export const BLING_CHANNEL = "Bling";
const DEFAULT_CATEGORY = "Sem categoria";
const UNKNOWN_PROVINCE = "ND";

const num = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const targetToStatus: Record<Exclude<StatusMappingTarget, "IGNORE">, FinancialStatus> = {
  PAID: "PAID",
  PENDING: "PENDING",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
};

const stripAccents = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "");

export function guessStatusTarget(label: string): StatusMappingTarget {
  const name = stripAccents(label).toLowerCase();
  if (/cancel/.test(name)) return "CANCELLED";
  if (/devol|estorn|reembols/.test(name)) return "REFUNDED";
  if (/atendid|aprovad|pago|faturad|enviad|entreg|conclu|verificad/.test(name)) return "PAID";
  if (/aberto|pendent|andament|aguard/.test(name)) return "PENDING";
  return "PENDING";
}

export function defaultStatusMap(
  statuses: ConnectorStatusOption[],
): Record<string, StatusMappingTarget> {
  return Object.fromEntries(statuses.map((s) => [s.id, guessStatusTarget(s.label)]));
}

export function discountOf(order: BlingOrderSummary): number {
  const raw = order.desconto;
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "object") {
    const value = num(raw.valor);
    return raw.unidade?.toUpperCase() === "PERCENTUAL"
      ? (num(order.totalProdutos) * value) / 100
      : value;
  }
  return num(raw);
}

export function blingItemsOf(order: BlingOrder): OrderInput["items"] {
  return (order.itens ?? []).map((i) => ({
    sku: (i.codigo?.trim() || `BL-${i.produto?.id ?? "0"}`).slice(0, 80),
    productName: i.descricao?.trim() || "Produto",
    category: DEFAULT_CATEGORY,
    quantity: Math.max(1, Math.round(num(i.quantidade) || 1)),
    unitPrice: num(i.valor),
    unitCost: null,
  }));
}

export function blingOrderInputOf(
  order: BlingOrder,
  contact: BlingContact | null,
  statusMap: Record<string, StatusMappingTarget>,
  channelNames: Record<string, string>,
): OrderInput | null {
  const situacaoId = String(order.situacao?.id ?? "");
  const target = statusMap[situacaoId] ?? "PENDING";
  if (target === "IGNORE") return null;
  const email = contact?.email?.trim().toLowerCase();
  if (!email || !order.data) return null;
  const items = blingItemsOf(order);
  if (items.length === 0) return null;
  const productRevenue = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const shipping = num(order.transporte?.frete);
  const discount = discountOf(order);
  const uf = order.transporte?.etiqueta?.uf ?? contact?.endereco?.geral?.uf ?? null;
  return {
    number: `#${order.numero ?? order.id}`,
    placedAt: order.data.slice(0, 10),
    status: targetToStatus[target],
    email,
    customerName: contact?.nome?.trim() || order.contato?.nome?.trim() || email,
    city:
      order.transporte?.etiqueta?.municipio?.trim() ??
      contact?.endereco?.geral?.municipio?.trim() ??
      "",
    province: uf ? uf.trim().toUpperCase().slice(0, 2) : UNKNOWN_PROVINCE,
    salesPlatform: order.loja?.id ? "MARKETPLACE" : "ECOMMERCE",
    channel: channelNames[String(order.loja?.id ?? "")] ?? BLING_CHANNEL,
    gateway: "Não informado",
    processingMethod: "CREDIT_CARD" satisfies ProcessingMethod,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    coupons: [],
    shipping,
    discount,
    rows: [],
    items,
    productRevenue,
    totalPrice:
      order.total !== null && order.total !== undefined
        ? num(order.total)
        : Math.max(0, productRevenue + shipping - discount),
  };
}
