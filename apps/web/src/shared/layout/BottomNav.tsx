import { Link, useRouterState } from "@tanstack/react-router";
import {
  Banknote,
  Building2,
  LayoutDashboard,
  Lock,
  Megaphone,
  MoreHorizontal,
  Truck,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  UNDER_DEVELOPMENT_PATH,
  isNavItemActive,
  navItems,
  underDevelopmentSlugOf,
} from "./screenAccess";
import type { ShellAccount } from "./shellStatus.types";

const items = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Dinheiro", to: "/dinheiro", icon: Banknote },
  { label: "Marketing", to: "/marketing", icon: Megaphone },
  { label: "Logística", to: "/logistica", icon: Truck },
  { label: "Gestão", to: "/gestao", icon: Building2 },
  { label: "Mais", to: "/conexoes", icon: MoreHorizontal },
];

export function BottomNav({ account }: { account: ShellAccount }) {
  const location = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      tela: (s.location.search as { tela?: string }).tela,
    }),
  });
  const releasedScreens = account.store?.releasedScreens ?? [];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid auto-cols-fr grid-flow-col border-t border-sidebar-border bg-sidebar md:hidden">
      {navItems(items, account.access, account.release, releasedScreens).map((item) => {
        const active = isNavItemActive(item, location);
        const className = cn(
          "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] transition-colors duration-150",
          active ? "bg-accent font-semibold text-primary" : "text-muted-foreground",
        );
        const label = <span className="w-full truncate text-center">{item.label}</span>;
        if (item.locked) {
          return (
            <Link
              key={item.to}
              to={UNDER_DEVELOPMENT_PATH}
              search={{ tela: underDevelopmentSlugOf(item.to) }}
              className={className}
            >
              <Lock className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        }
        return (
          <Link key={item.to} to={item.to} className={className}>
            <item.icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
