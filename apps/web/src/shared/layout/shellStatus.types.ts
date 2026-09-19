import type { AreaAccess, ScreenRelease, StoreScreen } from "@ecommerce/contracts/auth";

export type ShellStatus = {
  maturity: { achieved: number; total: number };
  connectionsAlert: boolean;
  hasSource: boolean;
};

export type ShellStore = {
  id: string;
  name: string;
  isArchived: boolean;
  releasedScreens: readonly StoreScreen[];
};

export type ShellAccount = {
  name: string;
  access: AreaAccess;
  release: ScreenRelease;
  onSignOut: () => void;
  store: ShellStore | null;
  stores: ShellStore[];
  onSelectStore: (id: string) => void;
};
