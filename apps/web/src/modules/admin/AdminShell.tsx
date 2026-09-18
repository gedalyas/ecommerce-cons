import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { KeyRound, LayoutDashboard, LogOut, ShieldCheck, Users } from "lucide-react";
import { TooltipProvider } from "@/shared/ui/Tooltip";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

export type AdminShellAccount = {
  name: string;
  isAdmin: boolean;
  hasStore: boolean;
  onSignOut: () => void;
};

const items = [
  { label: "Visão geral", to: "/admin", icon: ShieldCheck, adminOnly: false },
  { label: "Usuários", to: "/admin/usuarios", icon: Users, adminOnly: true },
  { label: "Acesso a usuários", to: "/admin/acesso", icon: KeyRound, adminOnly: true },
] as const;

const linkClass = (active: boolean) =>
  cn(
    "flex min-h-11 items-center gap-3 border-l-2 px-3 py-2 text-[15px] transition-colors duration-150",
    "max-md:min-h-9 max-md:shrink-0 max-md:border-l-0 max-md:border-b-2 max-md:px-2",
    active
      ? "border-primary bg-accent font-semibold text-primary max-md:bg-transparent"
      : "border-transparent text-foreground hover:bg-muted",
  );

const signOutButtonClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground";

export function AdminShell({ account }: { account: AdminShellAccount }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visible = items.filter((item) => account.isAdmin || !item.adminOnly);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-dvh w-full flex-col bg-background md:flex-row">
        <aside className="flex shrink-0 flex-col border-b border-sidebar-border bg-sidebar md:sticky md:top-0 md:h-dvh md:w-60 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-2 border-b border-sidebar-border px-4 py-4">
            <div className="min-w-0">
              <div className="t-card-title truncate text-foreground">E-commerce Insights</div>
              <div className={cn(textClass.label, "mt-0.5 text-muted-foreground")}>
                Administração
              </div>
            </div>
            <button
              type="button"
              onClick={account.onSignOut}
              aria-label="Sair"
              className={cn(signOutButtonClass, "md:hidden")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex overflow-x-auto md:min-h-0 md:flex-1 md:flex-col md:overflow-y-auto md:py-2">
            <ul className="flex md:block">
              {visible.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={linkClass(pathname === item.to)}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              ))}
              {account.hasStore && (
                <li>
                  <Link to="/" className={linkClass(false)}>
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    <span className="truncate">Abrir o painel</span>
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <div className="hidden border-t border-sidebar-border px-4 py-3 md:block">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-[13px] font-semibold text-foreground">
                {account.name}
              </span>
              <button
                type="button"
                onClick={account.onSignOut}
                aria-label="Sair"
                className={signOutButtonClass}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
}
