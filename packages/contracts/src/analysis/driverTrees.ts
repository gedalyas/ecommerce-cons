import { cacPercent } from "../marketing/contract";
import type {
  AnalysisFacts,
  AnalysisMetricKey,
  AnalysisValues,
  DriverDefinition,
  DriverKey,
  MetricDefinition,
} from "./analysis.types";

const ratio = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : null;
const percent = (numerator: number, denominator: number) =>
  denominator > 0 ? (numerator / denominator) * 100 : null;

export function computeValues(f: AnalysisFacts): AnalysisValues {
  const adSpend = f.adSpend + f.adPlatformFee;
  const totalMarketing = adSpend + f.salesMarketingCosts;
  return {
    totalSold: f.revenue,
    orders: f.orders,
    sessions: f.sessions,
    conversionRate: percent(f.orders, f.sessions),
    averageTicket: ratio(f.revenue, f.orders),
    repurchaseRate: percent(f.repeatOrders, f.orders),
    discountRate: percent(f.discounts, f.productRevenue),
    cancellationRate: percent(f.capturedOrders - f.orders, f.capturedOrders),
    roas: ratio(f.revenue, adSpend),
    roi: totalMarketing > 0 ? ((f.revenue - totalMarketing) / totalMarketing) * 100 : null,
    cpa: ratio(totalMarketing, f.orders),
    cac: cacPercent(totalMarketing, f.revenue),
    costPerSession: ratio(totalMarketing, f.sessions),
    cpc: ratio(adSpend, f.clicks),
    adSpend,
    totalMarketing,
    clicks: f.clicks,
    ctr: percent(f.clicks, f.impressions),
    newUsersShare: percent(f.newUsers, f.users),
    itemsPerOrder: ratio(f.items, f.orders),
    discounts: f.discounts,
    capturedOrders: f.capturedOrders,
    repeatOrders: f.repeatOrders,
    newCustomers: f.newCustomers,
    customers: f.customers,
  };
}

export const driverDefinitions: Record<DriverKey, Omit<DriverDefinition, "key">> = {
  totalSold: { label: "Total vendido", unit: "currency", goodWhen: "up" },
  orders: { label: "Pedidos", unit: "count", goodWhen: "up" },
  sessions: { label: "Sessões", unit: "count", goodWhen: "up" },
  conversionRate: { label: "Conversão", unit: "percent", goodWhen: "up" },
  averageTicket: { label: "Ticket médio do pedido", unit: "currency", goodWhen: "up" },
  repurchaseRate: { label: "Taxa de recompra", unit: "percent", goodWhen: "up" },
  discountRate: { label: "Taxa de desconto", unit: "percent", goodWhen: "down" },
  cancellationRate: {
    label: "Taxa de cancelamento e reembolso",
    unit: "percent",
    goodWhen: "down",
  },
  roas: { label: "ROAS", unit: "multiplier", goodWhen: "up" },
  roi: { label: "ROI", unit: "percent", goodWhen: "up" },
  cpa: { label: "CPA", unit: "currency", goodWhen: "down" },
  cac: { label: "CAC", unit: "percent", goodWhen: "down" },
  costPerSession: { label: "CPS (custo por sessão)", unit: "currency", goodWhen: "down" },
  cpc: { label: "CPC (custo por clique)", unit: "currency", goodWhen: "down" },
  adSpend: { label: "Investimento em anúncios", unit: "currency", goodWhen: "down" },
  totalMarketing: { label: "Investimento total em marketing", unit: "currency", goodWhen: "down" },
  clicks: { label: "Cliques", unit: "count", goodWhen: "up" },
  ctr: { label: "CTR", unit: "percent", goodWhen: "up" },
  newUsersShare: { label: "Proporção de novas sessões", unit: "percent", goodWhen: "up" },
  itemsPerOrder: { label: "Itens por pedido", unit: "count", goodWhen: "up" },
  discounts: { label: "Descontos concedidos", unit: "currency", goodWhen: "down" },
  capturedOrders: { label: "Pedidos captados", unit: "count", goodWhen: "up" },
  repeatOrders: { label: "Clientes recorrentes", unit: "count", goodWhen: "up" },
  newCustomers: { label: "Novos clientes", unit: "count", goodWhen: "up" },
  customers: { label: "Clientes compradores", unit: "count", goodWhen: "up" },
};

const tree = (
  key: AnalysisMetricKey,
  section: MetricDefinition["section"],
  drivers: DriverKey[],
  levers: string[],
): MetricDefinition => ({ key, ...driverDefinitions[key], section, drivers, levers });

export const metricDefinitions: Record<AnalysisMetricKey, MetricDefinition> = {
  totalSold: tree(
    "totalSold",
    "drove",
    ["sessions", "conversionRate", "averageTicket", "discountRate"],
    [
      "ampliar o tráfego qualificado nos canais com melhor conversão",
      "reduzir o atrito do checkout (frete, parcelamento, formas de pagamento)",
      "montar bundles e kits para elevar o ticket sem depender de desconto",
    ],
  ),
  orders: tree(
    "orders",
    "drove",
    ["sessions", "conversionRate", "repurchaseRate", "newCustomers"],
    [
      "distribuir a verba para os canais que trazem pedidos, não só sessões",
      "recuperar carrinhos abandonados por e-mail e WhatsApp",
      "ativar a base com fluxos de recompra",
    ],
  ),
  sessions: tree(
    "sessions",
    "drove",
    ["adSpend", "clicks", "cpc", "newUsersShare"],
    [
      "revisar criativos e públicos das campanhas com CTR em queda",
      "reforçar SEO e conteúdo nas categorias com mais busca orgânica",
      "manter e-mail e social ativos para tráfego que não depende de mídia",
    ],
  ),
  conversionRate: tree(
    "conversionRate",
    "signals",
    ["orders", "sessions", "newUsersShare", "discountRate", "averageTicket"],
    [
      "melhorar velocidade de página e a clareza da página de produto",
      "simplificar o checkout e expor prazo e custo de frete cedo",
      "qualificar o tráfego: sessões novas convertem menos que recorrentes",
    ],
  ),
  averageTicket: tree(
    "averageTicket",
    "signals",
    ["itemsPerOrder", "discountRate", "orders"],
    [
      "sugerir produtos complementares no carrinho (compre junto)",
      "definir frete grátis a partir de um valor acima do ticket atual",
      "reduzir cupons genéricos e usar descontos por volume",
    ],
  ),
  repurchaseRate: tree(
    "repurchaseRate",
    "signals",
    ["repeatOrders", "newCustomers", "customers"],
    [
      "fluxos de e-mail pós-venda com o intervalo típico entre compras",
      "programa de fidelidade ou assinatura para os produtos de reposição",
      "cupom de segunda compra para quem comprou uma vez",
    ],
  ),
  discountRate: tree(
    "discountRate",
    "signals",
    ["discounts", "totalSold", "orders", "averageTicket"],
    [
      "limitar cupons a primeira compra e recuperação de carrinho",
      "trocar desconto percentual por benefício de frete",
      "medir a margem dos pedidos com cupom antes de ampliar campanhas",
    ],
  ),
  cancellationRate: tree(
    "cancellationRate",
    "signals",
    ["capturedOrders", "orders", "averageTicket"],
    [
      "revisar a aprovação de pagamento (boleto e Pix expirados)",
      "reduzir prazo de entrega prometido onde o cancelamento se concentra",
      "confirmar estoque antes de aceitar o pedido",
    ],
  ),
  roas: tree(
    "roas",
    "signals",
    ["adSpend", "totalSold", "conversionRate", "averageTicket"],
    [
      "realocar orçamento das campanhas com ROAS baixo para as de ROAS alto",
      "testar landing pages por campanha em vez da home",
      "excluir públicos que já compraram das campanhas de prospecção",
    ],
  ),
  roi: tree(
    "roi",
    "signals",
    ["totalMarketing", "totalSold", "cpa"],
    [
      "revisar custos fixos de marketing (agência, ferramentas) contra o retorno",
      "concentrar a mídia nos produtos de maior margem",
      "acompanhar o ROI por canal, não só o total",
    ],
  ),
  cpa: tree(
    "cpa",
    "signals",
    ["totalMarketing", "orders", "conversionRate", "cpc"],
    [
      "melhorar a conversão antes de aumentar o investimento",
      "pausar campanhas cujo CPA supera a margem do pedido",
      "usar remarketing para converter quem já visitou",
    ],
  ),
  cac: tree(
    "cac",
    "signals",
    ["totalMarketing", "totalSold", "roas", "cpa"],
    [
      "comparar o CAC com a margem de contribuição antes de escalar o investimento",
      "cortar as campanhas que investem sem trazer vendas no período",
      "aumentar a recompra, que vende sem custo de aquisição",
    ],
  ),
  costPerSession: tree(
    "costPerSession",
    "signals",
    ["totalMarketing", "sessions", "cpc"],
    [
      "aumentar as fontes de tráfego sem custo por sessão (orgânico, e-mail)",
      "negociar CPM e revisar segmentação nas campanhas de alcance",
      "medir a receita por sessão junto com o custo",
    ],
  ),
  cpc: tree(
    "cpc",
    "signals",
    ["adSpend", "clicks", "ctr"],
    [
      "renovar criativos com CTR em queda para baixar o leilão",
      "revisar palavras-chave e termos negativos nas campanhas de busca",
      "testar formatos com CPC menor (vídeo, catálogo)",
    ],
  ),
};
