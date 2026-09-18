export type ShellStatus = {
  maturity: { achieved: number; total: number };
  connectionsAlert: boolean;
  hasSource: boolean;
};

export type ShellStore = { id: string; name: string; isArchived: boolean };

import type { AreaAccess } from "@ecommerce/contracts/auth";

export type ShellAccount = {
  name: string;
  role: "ADMIN" | "CONSULTANT" | "CLIENT";
  access: AreaAccess;
  onSignOut: () => void;
  store: ShellStore | null;
  stores: ShellStore[];
  onSelectStore: (id: string) => void;
};
