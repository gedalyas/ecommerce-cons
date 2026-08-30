export const connections = [
  { name: "Bling", type: "ERP", status: "connected", sync: "hoje às 03:12" },
  { name: "Loja", type: "Plataforma", status: "connected", sync: "hoje às 03:14" },
  { name: "Meta Ads", type: "Mídia paga", status: "error", sync: "há 6 dias" },
  { name: "Google Ads", type: "Mídia paga", status: "connected", sync: "hoje às 03:20" },
  { name: "Google Analytics", type: "Analytics", status: "connected", sync: "hoje às 03:20" },
  { name: "Instagram", type: "Social", status: "not-connected", sync: "—" },
  {
    name: "Extrato do adquirente",
    type: "Importação manual",
    status: "manual",
    sync: "enviado em 02/08",
  },
] as const;
