export const clientMemberships = ["OWNER", "MEMBER"] as const;
export type ClientMembership = (typeof clientMemberships)[number];

export const clientMembershipLabel: Record<ClientMembership, string> = {
  OWNER: "Dono",
  MEMBER: "Membro da equipe",
};

export const accessAreas = ["MONEY", "MARKETING", "LOGISTICS", "MANAGEMENT", "DATA"] as const;
export type AccessArea = (typeof accessAreas)[number];

export const accessAreaLabel: Record<AccessArea, string> = {
  MONEY: "Dinheiro",
  MARKETING: "Marketing",
  LOGISTICS: "Logística",
  MANAGEMENT: "Gestão",
  DATA: "Dados",
};

export const accessAreaHint: Record<AccessArea, string> = {
  MONEY: "DRE, custos e margem",
  MARKETING: "Campanhas, ROAS, influenciadores, importação de mídia e tráfego",
  LOGISTICS: "Estoque, frete e atendimento",
  MANAGEMENT: "Pilares de gestão e metas",
  DATA: "Pedidos, produtos, clientes, métricas e importação de pedidos",
};

export const accessLevels = ["view", "edit"] as const;
export type AccessLevel = (typeof accessLevels)[number];

export const accessLevelLabel: Record<AccessLevel, string> = {
  view: "Ver",
  edit: "Editar",
};

export type AreaGrant = { area: AccessArea; level: AccessLevel };
