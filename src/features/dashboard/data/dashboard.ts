import type { Metric } from "@/design-system/patterns/MetricTile";
import type { Recommendation } from "@/design-system/patterns/RecommendationList";

export const dashboardKpis: Metric[] = [
  {
    label: "Faturamento",
    value: "R$ 487.300",
    delta: "+8%",
    deltaDirection: "up",
    fidelity: "A",
    fidelityNote: "Nível A — somatório de pedidos pagos no Bling, sincronizado hoje às 03:12.",
  },
  {
    label: "Margem de contribuição",
    value: "19,2%",
    delta: "-3,4pp",
    deltaDirection: "down",
    fidelity: "B",
    fidelityNote: "Nível B — CMV médio por categoria, informado pelo cliente em março.",
  },
  {
    label: "CAC",
    value: "R$ 62",
    delta: "+21%",
    deltaDirection: "down",
    fidelity: "A",
    fidelityNote: "Nível A — investimento das plataformas de mídia dividido por novos clientes.",
  },
  {
    label: "Recompra 90 dias",
    value: "14%",
    delta: "+1pp",
    deltaDirection: "up",
    fidelity: "A",
    fidelityNote: "Nível A — base de pedidos por CPF, janela móvel de 90 dias.",
  },
];

export const alerts = [
  {
    icon: "trending-down",
    title: "Margem do SKU AUR-114 ficou negativa",
    detail: "Custo do fornecedor subiu 12% e o preço de venda não foi reajustado.",
    origin: "Dinheiro",
    to: "/dinheiro",
  },
  {
    icon: "megaphone",
    title: "CAC do Google Ads acima do limite há 12 dias",
    detail: "R$ 78 por cliente, contra a meta de R$ 41 definida no marco de maturidade.",
    origin: "Marketing",
    to: "/marketing",
  },
  {
    icon: "pie-chart",
    title: "78% da receita vem de um único canal",
    detail: "Dependência de Meta Ads deixa o faturamento exposto a mudanças de leilão.",
    origin: "Gestão",
    to: "/gestao",
  },
] as const;

export const milestoneCriteria = [
  {
    name: "Margem previsível",
    progress: 100,
    achieved: true,
    note: "3 meses consecutivos acima de 18%",
  },
  {
    name: "CAC menor que 1/3 do LTV",
    progress: 45,
    achieved: false,
    note: "CAC R$ 62 · meta R$ 41",
  },
  { name: "Caixa de 90 dias", progress: 100, achieved: true, note: "R$ 214.000 em caixa livre" },
  {
    name: "Empresa roda sem o dono",
    progress: 30,
    achieved: false,
    note: "4 processos críticos sem dono definido",
  },
];

export const openRecommendations: Recommendation[] = [
  {
    text: "Reajustar preço dos 9 SKUs com margem abaixo de 10%",
    dueDate: "até 05/09",
    owner: "Marina (Comercial)",
  },
  {
    text: "Pausar campanhas de Google Ads com CAC acima de R$ 70",
    dueDate: "até 29/08",
    owner: "Rafael (Mídia)",
  },
  { text: "Fechar conciliação do adquirente de julho", dueDate: "até 02/09", owner: "Consultoria" },
  {
    text: "Documentar o processo de compra com fornecedores",
    dueDate: "até 15/09",
    owner: "Davi (Sócio)",
  },
];

export const monthlySeries = [
  { month: "set/25", revenue: 341000, margin: 21.4 },
  { month: "out/25", revenue: 368000, margin: 21.9 },
  { month: "nov/25", revenue: 452000, margin: 22.6 },
  { month: "dez/25", revenue: 528000, margin: 23.1 },
  { month: "jan/26", revenue: 389000, margin: 22.4 },
  { month: "fev/26", revenue: 402000, margin: 22.8 },
  { month: "mar/26", revenue: 421000, margin: 23.0 },
  { month: "abr/26", revenue: 436000, margin: 22.7 },
  { month: "mai/26", revenue: 448000, margin: 22.9 },
  { month: "jun/26", revenue: 462000, margin: 22.1 },
  { month: "jul/26", revenue: 451000, margin: 20.6 },
  { month: "ago/26", revenue: 487300, margin: 19.2 },
];
