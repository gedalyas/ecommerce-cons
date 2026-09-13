export type ShellStatus = {
  maturity: { achieved: number; total: number };
  connectionsAlert: boolean;
};

export type ShellAccount = { name: string; onSignOut: () => void };
