export const sectionKeys = ["money", "marketing", "logistics", "management"] as const;
export type SectionKey = (typeof sectionKeys)[number];

export const liveKpiKeys = [
  "contributionMarginRate",
  "cogsRate",
  "sellingCostRate",
  "shippingCostPerOrder",
  "conversionRate",
  "aov",
  "cartAbandonment",
  "cac",
  "roas",
  "adSpend",
  "topChannelShare",
  "followers",
  "socialReach",
  "socialEngagementRate",
  "repurchaseRate90",
  "ltv12Months",
  "stockOutRate",
  "coverageDays",
  "revenueConcentration",
] as const;
export type LiveKpiKey = (typeof liveKpiKeys)[number];

export type PillarKpiTemplate =
  | { key: string; label: string; source: "live"; live: LiveKpiKey; goodWhen: "up" | "down" }
  | { key: string; label: string; source: "manual"; hint: string };

export type PillarTemplate = {
  key: string;
  title: string;
  kpis: PillarKpiTemplate[];
  blockedByMilestone?: boolean;
};

export type AreaTemplate = {
  key: SectionKey;
  title: string;
  subtitle: string;
  pillars: PillarTemplate[];
};

const live = (key: LiveKpiKey, label: string, goodWhen: "up" | "down"): PillarKpiTemplate => ({
  key,
  label,
  source: "live",
  live: key,
  goodWhen,
});

const manual = (key: string, label: string, hint: string): PillarKpiTemplate => ({
  key,
  label,
  source: "manual",
  hint,
});

export const engagementTemplate: AreaTemplate[] = [
  {
    key: "money",
    title: "Dinheiro",
    subtitle: "Margem, custos e previsibilidade de caixa",
    pillars: [
      {
        key: "organization",
        title: "Organização",
        kpis: [
          live("contributionMarginRate", "Margem de contribuição", "up"),
          manual("freeCash", "Caixa livre", "Saldo em caixa descontadas as obrigações do mês"),
          manual(
            "cashCycle",
            "Ciclo de caixa",
            "Dias entre pagar o fornecedor e receber do cliente",
          ),
          manual(
            "fixedExpenseRatio",
            "Despesa fixa / receita",
            "Despesas fixas sobre a receita do mês",
          ),
        ],
      },
      {
        key: "costs",
        title: "Custos e taxas",
        kpis: [
          live("sellingCostRate", "Taxa média do adquirente", "down"),
          live("shippingCostPerOrder", "Custo de frete / pedido", "down"),
          live("cogsRate", "CMV", "down"),
        ],
      },
    ],
  },
  {
    key: "marketing",
    title: "Marketing",
    subtitle: "Aquisição, conversão e retenção de clientes",
    pillars: [
      {
        key: "conversion",
        title: "Conversão",
        kpis: [
          live("conversionRate", "Taxa de conversão", "up"),
          live("aov", "Ticket médio", "up"),
          live("cartAbandonment", "Abandono de carrinho", "down"),
        ],
      },
      {
        key: "acquisition",
        title: "Aquisição",
        kpis: [
          live("cac", "CAC", "down"),
          live("roas", "ROAS geral", "up"),
          live("adSpend", "Investimento em mídia", "down"),
          live("topChannelShare", "Participação do maior canal", "down"),
        ],
      },
      {
        key: "presence",
        title: "Presença e criativos",
        kpis: [
          live("followers", "Seguidores", "up"),
          live("socialReach", "Alcance", "up"),
          live("socialEngagementRate", "Taxa de engajamento", "up"),
        ],
      },
      {
        key: "retention",
        title: "Retenção",
        kpis: [
          live("repurchaseRate90", "Recompra 90 dias", "up"),
          live("ltv12Months", "LTV 12 meses", "up"),
        ],
      },
      { key: "parallelChannels", title: "Canais paralelos", blockedByMilestone: true, kpis: [] },
    ],
  },
  {
    key: "logistics",
    title: "Logística",
    subtitle: "Estoque, entrega e experiência pós-venda",
    pillars: [
      {
        key: "stock",
        title: "Estoque e fulfillment",
        kpis: [
          live("stockOutRate", "Ruptura de estoque", "down"),
          live("coverageDays", "Cobertura de estoque", "up"),
          manual(
            "shippedSameDay",
            "Pedidos expedidos no dia",
            "Pedidos enviados no dia do pagamento",
          ),
        ],
      },
      {
        key: "shipping",
        title: "Frete e entrega",
        kpis: [
          manual("deliveryTime", "Prazo médio de entrega", "Dias entre o envio e a entrega"),
          manual("onTimeDelivery", "Entregas no prazo", "Entregas dentro do prazo prometido"),
          manual("subsidizedShipping", "Frete subsidiado", "Frete pago pela loja sobre a receita"),
        ],
      },
      {
        key: "support",
        title: "SAC e pós-venda",
        kpis: [
          manual(
            "firstResponseTime",
            "Tempo de primeira resposta",
            "Horas até a primeira resposta",
          ),
          manual("returnRate", "Taxa de troca e devolução", "Pedidos com troca ou devolução"),
        ],
      },
    ],
  },
  {
    key: "management",
    title: "Gestão",
    subtitle: "Estrutura, risco e autonomia da operação",
    pillars: [
      {
        key: "shielding",
        title: "Blindagem",
        kpis: [
          live("revenueConcentration", "Concentração de receita", "down"),
          manual("cashMonths", "Meses de caixa", "Meses que o caixa cobre sem receita"),
        ],
      },
      {
        key: "delegation",
        title: "Delegação",
        kpis: [
          manual(
            "documentedProcesses",
            "Processos documentados",
            "Processos críticos com procedimento escrito",
          ),
          manual(
            "ownerDecisions",
            "Decisões que passam pelo dono",
            "Decisões do dia a dia que dependem do dono",
          ),
        ],
      },
      { key: "technology", title: "Tecnologia", blockedByMilestone: true, kpis: [] },
    ],
  },
];

export type MilestoneTemplate = { key: string; name: string; hint: string };

export const milestoneTemplate: MilestoneTemplate[] = [
  { key: "predictableMargin", name: "Margem previsível", hint: "3 meses seguidos acima da meta" },
  {
    key: "cacBelowLtv",
    name: "CAC por cliente menor que 1/3 do LTV",
    hint: "CAC por cliente ÷ LTV abaixo de 33%",
  },
  { key: "cashRunway", name: "Caixa de 90 dias", hint: "Caixa livre para 90 dias de operação" },
  {
    key: "ownerIndependent",
    name: "Empresa roda sem o dono",
    hint: "Processos documentados e delegados",
  },
];

export function areaTemplateOf(key: SectionKey): AreaTemplate {
  return engagementTemplate.find((a) => a.key === key)!;
}

export function pillarTemplateOf(pillarKey: string): PillarTemplate | undefined {
  return engagementTemplate.flatMap((a) => a.pillars).find((p) => p.key === pillarKey);
}

export function areaKeyOfPillar(pillarKey: string): SectionKey | undefined {
  return engagementTemplate.find((a) => a.pillars.some((p) => p.key === pillarKey))?.key;
}
