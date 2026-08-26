import type { Section } from "@/design-system/patterns/SectionPage";

export const gestaoSection: Section = {
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
};
