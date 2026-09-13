/** Portuguese labels for the enum values stored on orders. */
export const financialStatusLabel: Record<string, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  AUTHORIZED: "Autorizado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const processingMethodLabel: Record<string, string> = {
  CREDIT_CARD: "Cartão de crédito",
  PIX: "Pix",
  BOLETO: "Boleto",
};

export const labelFor = (map: Record<string, string>, value: string) => map[value] ?? value;
