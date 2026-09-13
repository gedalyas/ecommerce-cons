import type { ConnectionSeed } from "./fixture.types";

export const connections: ConnectionSeed[] = [
  { name: "Bling", kind: "ERP", status: "CONNECTED", lastSyncedAt: "2026-09-10T03:12:00Z" },
  { name: "Loja", kind: "Plataforma", status: "CONNECTED", lastSyncedAt: "2026-09-10T03:14:00Z" },
  { name: "Meta Ads", kind: "Mídia paga", status: "ERROR", lastSyncedAt: "2026-09-04T03:15:00Z" },
  {
    name: "Google Ads",
    kind: "Mídia paga",
    status: "CONNECTED",
    lastSyncedAt: "2026-09-10T03:20:00Z",
  },
  {
    name: "Google Analytics",
    kind: "Analytics",
    status: "CONNECTED",
    lastSyncedAt: "2026-09-10T03:20:00Z",
  },
  { name: "Instagram", kind: "Social", status: "NOT_CONNECTED", lastSyncedAt: null },
  {
    name: "Extrato do adquirente",
    kind: "Importação manual",
    status: "MANUAL",
    lastSyncedAt: "2026-08-02T12:00:00Z",
  },
];
