export type Fidelity = "A" | "B" | "C";

export type Kpi = {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
  fidelity: Fidelity;
  fidelityNote: string;
};

export type Recommendation = {
  text: string;
  prazo: string;
  responsavel: string;
};

export type PillarStatus = "concluido" | "andamento" | "nao-iniciado" | "bloqueado";

export type Pillar = {
  title: string;
  status: PillarStatus;
  kpis: Kpi[];
  recommendations: Recommendation[];
  dataPending?: string;
  extra?: "presenca-criativos";
};

export const fidelityLabel: Record<Fidelity, string> = {
  A: "medido",
  B: "aproximado",
  C: "indicativo",
};

export const statusLabel: Record<PillarStatus, string> = {
  concluido: "Concluído",
  andamento: "Em andamento",
  "nao-iniciado": "Não iniciado",
  bloqueado: "Bloqueado",
};

export const dashboardKpis: Kpi[] = [
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

export const sections: Record<
  string,
  { title: string; subtitle: string; pillars: Pillar[] }
> = {
  dinheiro: {
    title: "Dinheiro",
    subtitle: "Margem, custos e previsibilidade de caixa",
    pillars: [
      {
        title: "Organização",
        status: "andamento",
        kpis: [
          {
            label: "Margem de contribuição",
            value: "19,2%",
            delta: "-3,4pp",
            deltaDirection: "down",
            fidelity: "B",
            fidelityNote: "Nível B — CMV médio por categoria, informado pelo cliente em março.",
          },
          {
            label: "Caixa livre",
            value: "R$ 214.000",
            delta: "+4%",
            deltaDirection: "up",
            fidelity: "A",
            fidelityNote: "Nível A — extrato bancário conciliado até 24/08.",
          },
          {
            label: "Ciclo de caixa",
            value: "38 dias",
            delta: "+6 dias",
            deltaDirection: "down",
            fidelity: "B",
            fidelityNote: "Nível B — prazo médio de recebimento estimado pelo mix de parcelamento.",
          },
          {
            label: "Despesa fixa / receita",
            value: "11,4%",
            delta: "-0,3pp",
            deltaDirection: "up",
            fidelity: "A",
            fidelityNote: "Nível A — plano de contas do ERP.",
          },
        ],
        recommendations: [
          { text: "Fechar conciliação do adquirente de julho", prazo: "até 02/09", responsavel: "Consultoria" },
          { text: "Criar rotina semanal de fluxo de caixa projetado", prazo: "até 10/09", responsavel: "Davi (Sócio)" },
        ],
        dataPending: "Falta o extrato do adquirente de agosto para fechar a conciliação do mês.",
      },
      {
        title: "Custos e taxas",
        status: "concluido",
        kpis: [
          {
            label: "Taxa média do adquirente",
            value: "2,84%",
            delta: "-0,11pp",
            deltaDirection: "up",
            fidelity: "A",
            fidelityNote: "Nível A — extrato do adquirente importado manualmente em 02/08.",
          },
          {
            label: "Custo de frete / pedido",
            value: "R$ 18,40",
            delta: "+2%",
            deltaDirection: "down",
            fidelity: "A",
            fidelityNote: "Nível A — faturas das transportadoras integradas ao ERP.",
          },
          {
            label: "CMV",
            value: "48,6%",
            delta: "+1,2pp",
            deltaDirection: "down",
            fidelity: "B",
            fidelityNote: "Nível B — custo médio ponderado por categoria, sem custo por lote.",
          },
        ],
        recommendations: [
          { text: "Renegociar tabela do adquirente usando o volume dos últimos 6 meses", prazo: "até 20/09", responsavel: "Davi (Sócio)" },
        ],
      },
    ],
  },
  marketing: {
    title: "Marketing",
    subtitle: "Aquisição, conversão e retenção de clientes",
    pillars: [
      {
        title: "Conversão",
        status: "concluido",
        kpis: [
          {
            label: "Taxa de conversão",
            value: "1,84%",
            delta: "+0,2pp",
            deltaDirection: "up",
            fidelity: "A",
            fidelityNote: "Nível A — sessões e pedidos do Google Analytics.",
          },
          {
            label: "Ticket médio",
            value: "R$ 268",
            delta: "+3%",
            deltaDirection: "up",
            fidelity: "A",
            fidelityNote: "Nível A — receita dividida por pedidos pagos.",
          },
          {
            label: "Abandono de carrinho",
            value: "71%",
            delta: "-2pp",
            deltaDirection: "up",
            fidelity: "B",
            fidelityNote: "Nível B — eventos de checkout com perda parcial de rastreio no mobile.",
          },
        ],
        recommendations: [
          { text: "Testar frete grátis acima de R$ 249 na página de produto", prazo: "até 08/09", responsavel: "Marina (Comercial)" },
        ],
      },
      {
        title: "Aquisição",
        status: "andamento",
        kpis: [
          {
            label: "CAC",
            value: "R$ 62",
            delta: "+21%",
            deltaDirection: "down",
            fidelity: "A",
            fidelityNote: "Nível A — investimento das plataformas dividido por novos clientes.",
          },
          {
            label: "ROAS geral",
            value: "3,1x",
            delta: "-0,6x",
            deltaDirection: "down",
            fidelity: "B",
            fidelityNote: "Nível B — Meta Ads sem sincronizar há 6 dias, valor projetado pela média.",
          },
          {
            label: "Investimento em mídia",
            value: "R$ 96.400",
            delta: "+14%",
            deltaDirection: "neutral",
            fidelity: "B",
            fidelityNote: "Nível B — inclui estimativa dos últimos 6 dias de Meta Ads.",
          },
          {
            label: "Participação do maior canal",
            value: "78%",
            delta: "+5pp",
            deltaDirection: "down",
            fidelity: "C",
            fidelityNote: "Nível C — atribuição de último clique, indicativo apenas de tendência.",
          },
        ],
        recommendations: [
          { text: "Pausar campanhas de Google Ads com CAC acima de R$ 70", prazo: "até 29/08", responsavel: "Rafael (Mídia)" },
          { text: "Redistribuir 20% da verba de prospecção para remarketing", prazo: "até 06/09", responsavel: "Rafael (Mídia)" },
        ],
        dataPending: "Meta Ads com erro de autenticação desde 20/08 — números dos últimos 6 dias são estimados.",
      },
      {
        title: "Presença e criativos",
        status: "andamento",
        extra: "presenca-criativos",
        kpis: [
          {
            label: "Alcance mensal",
            value: "184.200",
            delta: "+6%",
            deltaDirection: "up",
            fidelity: "B",
            fidelityNote: "Nível B — estimado a partir do relatório enviado manualmente em 02/08.",
          },
          {
            label: "Engajamento",
            value: "3,1%",
            delta: "-0,4pp",
            deltaDirection: "down",
            fidelity: "B",
            fidelityNote: "Nível B — média das interações informadas no relatório manual.",
          },
          {
            label: "Criativos ativos",
            value: "12",
            delta: "+3",
            deltaDirection: "up",
            fidelity: "A",
            fidelityNote: "Nível A — contagem das peças em veiculação nas plataformas de mídia.",
          },
          {
            label: "Consistência de marca",
            value: "68%",
            delta: "+12pp",
            deltaDirection: "up",
            fidelity: "C",
            fidelityNote: "Nível C — avaliação qualitativa da consultoria, indicativo apenas.",
          },
        ],
        recommendations: [
          { text: "Substituir o criativo 'Frete grátis' — CPA 90% acima da média", prazo: "até 03/09", responsavel: "Rafael (Mídia)" },
          { text: "Padronizar o uso do logo entre loja, Instagram e anúncios", prazo: "até 20/09", responsavel: "Marina (Comercial)" },
        ],
        dataPending: "Instagram não conectado — alcance e engajamento são estimados a partir do relatório enviado manualmente em 02/08.",
      },
      {
        title: "Retenção",
        status: "nao-iniciado",
        kpis: [
          {
            label: "Recompra 90 dias",
            value: "14%",
            delta: "+1pp",
            deltaDirection: "up",
            fidelity: "A",
            fidelityNote: "Nível A — base de pedidos por CPF.",
          },
          {
            label: "LTV 12 meses",
            value: "R$ 384",
            delta: "+2%",
            deltaDirection: "up",
            fidelity: "C",
            fidelityNote: "Nível C — projeção sobre coorte parcial, indicativo.",
          },
        ],
        recommendations: [
          { text: "Montar fluxo de pós-compra por e-mail em 3 disparos", prazo: "até 18/09", responsavel: "Marina (Comercial)" },
        ],
        dataPending: "Sem integração com a ferramenta de e-mail — recompra por campanha não é medida.",
      },
      {
        title: "Canais paralelos",
        status: "bloqueado",
        kpis: [],
        recommendations: [],
      },
    ],
  },
  logistica: {
    title: "Logística",
    subtitle: "Estoque, entrega e experiência pós-venda",
    pillars: [
      {
        title: "Estoque e fulfillment",
        status: "nao-iniciado",
        kpis: [
          {
            label: "Ruptura de estoque",
            value: "6,2%",
            delta: "+1,4pp",
            deltaDirection: "down",
            fidelity: "B",
            fidelityNote: "Nível B — saldo do ERP sem inventário físico desde maio.",
          },
          {
            label: "Cobertura de estoque",
            value: "41 dias",
            delta: "-5 dias",
            deltaDirection: "down",
            fidelity: "B",
            fidelityNote: "Nível B — média de saída dos últimos 60 dias.",
          },
          {
            label: "Pedidos expedidos no dia",
            value: "82%",
            delta: "+3pp",
            deltaDirection: "up",
            fidelity: "A",
            fidelityNote: "Nível A — data de faturamento e coleta registradas no ERP.",
          },
        ],
        recommendations: [
          { text: "Definir estoque mínimo dos 20 SKUs de maior giro", prazo: "até 12/09", responsavel: "Bruno (Operações)" },
        ],
        dataPending: "Inventário físico desatualizado há 3 meses.",
      },
      {
        title: "Frete e entrega",
        status: "nao-iniciado",
        kpis: [
          {
            label: "Prazo médio de entrega",
            value: "5,4 dias",
            delta: "+0,6 dia",
            deltaDirection: "down",
            fidelity: "A",
            fidelityNote: "Nível A — rastreios das transportadoras.",
          },
          {
            label: "Entregas no prazo",
            value: "88%",
            delta: "-2pp",
            deltaDirection: "down",
            fidelity: "A",
            fidelityNote: "Nível A — comparação entre prazo prometido e entrega efetiva.",
          },
          {
            label: "Frete subsidiado",
            value: "R$ 7,10",
            delta: "+9%",
            deltaDirection: "down",
            fidelity: "B",
            fidelityNote: "Nível B — diferença estimada entre frete cobrado e custo real.",
          },
        ],
        recommendations: [
          { text: "Cotar segunda transportadora para o Nordeste", prazo: "até 22/09", responsavel: "Bruno (Operações)" },
        ],
      },
      {
        title: "SAC e pós-venda",
        status: "nao-iniciado",
        kpis: [
          {
            label: "Tempo de primeira resposta",
            value: "7h20",
            delta: "-40min",
            deltaDirection: "up",
            fidelity: "C",
            fidelityNote: "Nível C — amostragem manual de tickets, indicativo.",
          },
          {
            label: "Taxa de troca e devolução",
            value: "4,1%",
            delta: "+0,5pp",
            deltaDirection: "down",
            fidelity: "B",
            fidelityNote: "Nível B — registros de logística reversa sem motivo padronizado.",
          },
        ],
        recommendations: [
          { text: "Padronizar motivos de devolução no atendimento", prazo: "até 30/09", responsavel: "Bruno (Operações)" },
        ],
        dataPending: "Ferramenta de atendimento não integrada.",
      },
    ],
  },
  gestao: {
    title: "Gestão",
    subtitle: "Estrutura, risco e autonomia da operação",
    pillars: [
      {
        title: "Blindagem",
        status: "nao-iniciado",
        kpis: [
          {
            label: "Concentração de receita",
            value: "78%",
            delta: "+5pp",
            deltaDirection: "down",
            fidelity: "B",
            fidelityNote: "Nível B — atribuição de último clique por canal.",
          },
          {
            label: "Meses de caixa",
            value: "3,1",
            delta: "+0,2",
            deltaDirection: "up",
            fidelity: "A",
            fidelityNote: "Nível A — caixa livre dividido pela despesa fixa mensal.",
          },
        ],
        recommendations: [
          { text: "Criar plano de contingência para queda de 30% em Meta Ads", prazo: "até 25/09", responsavel: "Davi (Sócio)" },
        ],
      },
      {
        title: "Delegação",
        status: "nao-iniciado",
        kpis: [
          {
            label: "Processos documentados",
            value: "6 de 18",
            delta: "+2",
            deltaDirection: "up",
            fidelity: "C",
            fidelityNote: "Nível C — contagem informada pela equipe na reunião de agosto.",
          },
          {
            label: "Decisões que passam pelo dono",
            value: "71%",
            delta: "-4pp",
            deltaDirection: "up",
            fidelity: "C",
            fidelityNote: "Nível C — estimativa a partir do diagnóstico de rotina.",
          },
        ],
        recommendations: [
          { text: "Documentar o processo de compra com fornecedores", prazo: "até 15/09", responsavel: "Davi (Sócio)" },
          { text: "Definir dono para os 4 processos críticos sem responsável", prazo: "até 28/09", responsavel: "Consultoria" },
        ],
        dataPending: "Mapeamento de processos preenchido apenas parcialmente pelo time.",
      },
      {
        title: "Tecnologia",
        status: "bloqueado",
        kpis: [],
        recommendations: [],
      },
    ],
  },
};

export const connections = [
  { name: "Bling", type: "ERP", status: "conectado", sync: "hoje às 03:12" },
  { name: "Loja", type: "Plataforma", status: "conectado", sync: "hoje às 03:14" },
  { name: "Meta Ads", type: "Mídia paga", status: "erro", sync: "há 6 dias" },
  { name: "Google Ads", type: "Mídia paga", status: "conectado", sync: "hoje às 03:20" },
  { name: "Google Analytics", type: "Analytics", status: "conectado", sync: "hoje às 03:20" },
  { name: "Instagram", type: "Social", status: "nao-conectado", sync: "—" },
  { name: "Extrato do adquirente", type: "Importação manual", status: "manual", sync: "enviado em 02/08" },
] as const;

export const suggestionsBySection: Record<string, string[]> = {
  "/": ["Por onde começar esta semana?", "O que mudou desde a última reunião?", "Por que a margem caiu?"],
  "/dinheiro": ["Por que a margem caiu 3,4pp?", "Quais SKUs estão no prejuízo?", "O que fazer primeiro?"],
  "/marketing": ["Por que meu CAC subiu?", "Qual canal está pior?", "O que fazer primeiro?"],
  "/logistica": ["Onde estou perdendo prazo?", "Quanto o frete custa por pedido?", "O que fazer primeiro?"],
  "/gestao": ["Qual meu maior risco hoje?", "O que só depende de mim?", "O que fazer primeiro?"],
  "/conexoes": ["O que quebra sem o Meta Ads?", "Quais dados estão estimados?", "Como reconecto o Meta Ads?"],
};

export const contextBySection: Record<string, string> = {
  "/": "Dashboard",
  "/dinheiro": "Organização",
  "/marketing": "Aquisição",
  "/logistica": "Estoque e fulfillment",
  "/gestao": "Blindagem",
  "/conexoes": "Conexões",
};
