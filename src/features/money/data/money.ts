import type { Section } from "@/design-system/patterns/SectionPage";

export const moneySection: Section = {
  title: "Dinheiro",
  subtitle: "Margem, custos e previsibilidade de caixa",
  pillars: [
    {
      title: "Organização",
      status: "in-progress",
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
        {
          text: "Fechar conciliação do adquirente de julho",
          dueDate: "até 02/09",
          owner: "Consultoria",
        },
        {
          text: "Criar rotina semanal de fluxo de caixa projetado",
          dueDate: "até 10/09",
          owner: "Davi (Sócio)",
        },
      ],
      dataPending: "Falta o extrato do adquirente de agosto para fechar a conciliação do mês.",
    },
    {
      title: "Custos e taxas",
      status: "done",
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
        {
          text: "Renegociar tabela do adquirente usando o volume dos últimos 6 meses",
          dueDate: "até 20/09",
          owner: "Davi (Sócio)",
        },
      ],
    },
  ],
};
