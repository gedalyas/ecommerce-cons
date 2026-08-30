export const suggestionsBySection: Record<string, string[]> = {
  "/": [
    "Por onde começar esta semana?",
    "O que mudou desde a última reunião?",
    "Por que a margem caiu?",
  ],
  "/dinheiro": [
    "Por que a margem caiu 3,4pp?",
    "Quais SKUs estão no prejuízo?",
    "O que fazer primeiro?",
  ],
  "/marketing": ["Por que meu CAC subiu?", "Qual canal está pior?", "O que fazer primeiro?"],
  "/logistica": [
    "Onde estou perdendo prazo?",
    "Quanto o frete custa por pedido?",
    "O que fazer primeiro?",
  ],
  "/gestao": ["Qual meu maior risco hoje?", "O que só depende de mim?", "O que fazer primeiro?"],
  "/conexoes": [
    "O que quebra sem o Meta Ads?",
    "Quais dados estão estimados?",
    "Como reconecto o Meta Ads?",
  ],
};

export const contextBySection: Record<string, string> = {
  "/": "Dashboard",
  "/dinheiro": "Organização",
  "/marketing": "Aquisição",
  "/logistica": "Estoque e fulfillment",
  "/gestao": "Blindagem",
  "/conexoes": "Conexões",
};
