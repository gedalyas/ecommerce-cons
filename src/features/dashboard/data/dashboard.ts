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
  { name: "Margem previsível", progress: 100, achieved: true, note: "3 meses consecutivos acima de 18%" },
  { name: "CAC menor que 1/3 do LTV", progress: 45, achieved: false, note: "CAC R$ 62 · meta R$ 41" },
  { name: "Caixa de 90 dias", progress: 100, achieved: true, note: "R$ 214.000 em caixa livre" },
  { name: "Empresa roda sem o dono", progress: 30, achieved: false, note: "4 processos críticos sem dono definido" },
];

export const openRecommendations: Recommendation[] = [
  { text: "Reajustar preço dos 9 SKUs com margem abaixo de 10%", prazo: "até 05/09", responsavel: "Marina (Comercial)" },
  { text: "Pausar campanhas de Google Ads com CAC acima de R$ 70", prazo: "até 29/08", responsavel: "Rafael (Mídia)" },
  { text: "Fechar conciliação do adquirente de julho", prazo: "até 02/09", responsavel: "Consultoria" },
  { text: "Documentar o processo de compra com fornecedores", prazo: "até 15/09", responsavel: "Davi (Sócio)" },
];

export const monthlySeries = [
  { mes: "set/25", faturamento: 341000, margem: 21.4 },
  { mes: "out/25", faturamento: 368000, margem: 21.9 },
  { mes: "nov/25", faturamento: 452000, margem: 22.6 },
  { mes: "dez/25", faturamento: 528000, margem: 23.1 },
  { mes: "jan/26", faturamento: 389000, margem: 22.4 },
  { mes: "fev/26", faturamento: 402000, margem: 22.8 },
  { mes: "mar/26", faturamento: 421000, margem: 23.0 },
  { mes: "abr/26", faturamento: 436000, margem: 22.7 },
  { mes: "mai/26", faturamento: 448000, margem: 22.9 },
  { mes: "jun/26", faturamento: 462000, margem: 22.1 },
  { mes: "jul/26", faturamento: 451000, margem: 20.6 },
  { mes: "ago/26", faturamento: 487300, margem: 19.2 },
];
