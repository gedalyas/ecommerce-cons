export type ShellStatus = {
  maturity: { achieved: number; total: number };
  connectionsAlert: boolean;
};

export type ShellStore = { id: string; name: string };

export type ShellAccount = {
  name: string;
  role: "ADMIN" | "CONSULTANT" | "CLIENT";
  onSignOut: () => void;
  store: ShellStore | null;
  stores: ShellStore[];
  onSelectStore: (id: string) => void;
};
