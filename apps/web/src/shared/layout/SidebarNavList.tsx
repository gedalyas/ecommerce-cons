import { Link, useRouterState } from "@tanstack/react-router";
import { EyeOff, Lock, type LucideIcon } from "lucide-react";
import { UNDER_DEVELOPMENT_LABEL } from "@ecommerce/contracts/auth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/Tooltip";
import { cn } from "@/shared/utils/cn";
import {
  UNDER_DEVELOPMENT_PATH,
  isNavItemActive,
  underDevelopmentSlugOf,
  type NavItem,
} from "./screenAccess";

type SidebarItem = NavItem<{ label: string; to: string; icon: LucideIcon }>;

const HIDDEN_FROM_CLIENT_LABEL = "Não liberada para o cliente";

export function SidebarNavList({
  items,
  linkClass,
}: {
  items: readonly SidebarItem[];
  linkClass: (active: boolean) => string;
}) {
  const location = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      tela: (s.location.search as { tela?: string }).tela,
    }),
  });

  return (
    <ul>
      {items.map((item) => {
        const active = isNavItemActive(item, location);
        const hint = item.locked
          ? UNDER_DEVELOPMENT_LABEL
          : item.hiddenFromClient
            ? HIDDEN_FROM_CLIENT_LABEL
            : null;
        const link = item.locked ? (
          <Link
            to={UNDER_DEVELOPMENT_PATH}
            search={{ tela: underDevelopmentSlugOf(item.to) }}
            className={cn(linkClass(active), !active && "text-muted-foreground")}
            aria-label={`${item.label} (${UNDER_DEVELOPMENT_LABEL})`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="hidden flex-1 truncate xl:inline">{item.label}</span>
            <Lock className="hidden h-3.5 w-3.5 shrink-0 xl:inline" aria-hidden />
          </Link>
        ) : (
          <Link
            to={item.to}
            className={linkClass(active)}
            aria-label={item.hiddenFromClient ? `${item.label} (${hint})` : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="hidden flex-1 truncate xl:inline">{item.label}</span>
            {item.hiddenFromClient && (
              <EyeOff
                className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground xl:inline"
                aria-hidden
              />
            )}
          </Link>
        );
        return (
          <li key={item.to}>
            <Tooltip>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right" className={hint ? undefined : "xl:hidden"}>
                {hint ? `${item.label} · ${hint}` : item.label}
              </TooltipContent>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}
