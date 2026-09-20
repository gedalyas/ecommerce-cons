import { Link, useRouterState } from "@tanstack/react-router";
import { Lock, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/utils/cn";
import { MoreSheet } from "./MoreSheet";
import { bottomItems } from "./navigation";
import {
  UNDER_DEVELOPMENT_PATH,
  isNavItemActive,
  navItems,
  underDevelopmentSlugOf,
} from "./screenAccess";
import type { ShellAccount, ShellStatus } from "./shellStatus.types";

const itemClass = (active: boolean) =>
  cn(
    "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] transition-colors duration-150",
    active ? "bg-accent font-semibold text-primary" : "text-muted-foreground",
  );

export function BottomNav({ account, status }: { account: ShellAccount; status: ShellStatus }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      tela: (s.location.search as { tela?: string }).tela,
    }),
  });
  const releasedScreens = account.store?.releasedScreens ?? [];
  const items = navItems(bottomItems, account.access, account.release, releasedScreens);
  const moreActive = !moreOpen && !items.some((item) => isNavItemActive(item, location));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid auto-cols-fr grid-flow-col border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
        {items.map((item) => {
          const active = isNavItemActive(item, location);
          const label = <span className="w-full truncate text-center">{item.label}</span>;
          if (item.locked) {
            return (
              <Link
                key={item.to}
                to={UNDER_DEVELOPMENT_PATH}
                search={{ tela: underDevelopmentSlugOf(item.to) }}
                className={itemClass(active)}
              >
                <Lock className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            );
          }
          return (
            <Link key={item.to} to={item.to} className={itemClass(active)}>
              <item.icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={itemClass(moreActive || moreOpen)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <MoreHorizontal className="h-5 w-5 shrink-0" />
          <span className="w-full truncate text-center">Mais</span>
        </button>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} account={account} status={status} />
    </>
  );
}
