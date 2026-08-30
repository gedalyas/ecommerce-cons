import type { Section } from "@/design-system/patterns/SectionPage";

export const logisticsSection: Section = {
  title: "Logística",
  subtitle: "Estoque, entrega e experiência pós-venda",
  pillars: [
    {
      title: "Estoque e fulfillment",
      status: "not-started",
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
        {
          text: "Definir estoque mínimo dos 20 SKUs de maior giro",
          dueDate: "até 12/09",
          owner: "Bruno (Operações)",
        },
      ],
      dataPending: "Inventário físico desatualizado há 3 meses.",
    },
    {
      title: "Frete e entrega",
      status: "not-started",
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
        {
          text: "Cotar segunda transportadora para o Nordeste",
          dueDate: "até 22/09",
          owner: "Bruno (Operações)",
        },
      ],
    },
    {
      title: "SAC e pós-venda",
      status: "not-started",
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
        {
          text: "Padronizar motivos de devolução no atendimento",
          dueDate: "até 30/09",
          owner: "Bruno (Operações)",
        },
      ],
      dataPending: "Ferramenta de atendimento não integrada.",
    },
  ],
};
