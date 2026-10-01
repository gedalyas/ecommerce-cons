import { Link, useRouterState } from "@tanstack/react-router";
import { EyeOff, Lock, LogOut, Plug, Settings } from "lucide-react";
import { UNDER_DEVELOPMENT_LABEL } from "@ecommerce/contracts/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { Sheet } from "@/shared/ui/Sheet";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { areaItems, dataItems, type NavLink } from "./navigation";
import {
  UNDER_DEVELOPMENT_PATH,
  isNavItemActive,
  navItems,
  underDevelopmentSlugOf,
  type NavItem,
} from "./screenAccess";
import type { ShellAccount, ShellStatus } from "./shellStatus.types";

const rowClass = (active: boolean) =>
  cn(
    "flex min-h-12 items-center gap-3 px-4 text-[15px] transition-colors duration-150",
    active ? "bg-accent font-semibold text-primary" : "text-foreground hover:bg-muted",
  );

function SheetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-2">
      <div className={cn(textClass.label, "px-4 pb-1 pt-2 text-muted-foreground")}>{title}</div>
      <ul>{children}</ul>
    </div>
  );
}

function SheetLink({
  item,
  location,
  onNavigate,
}: {
  item: NavItem<NavLink>;
  location: { pathname: string; tela: string | undefined };
  onNavigate: () => void;
}) {
  const active = isNavItemActive(item, location);
  if (item.locked) {
    return (
      <li>
        <Link
          to={UNDER_DEVELOPMENT_PATH}
          search={{ tela: underDevelopmentSlugOf(item.to) }}
          className={cn(rowClass(active), !active && "text-muted-foreground")}
          onClick={onNavigate}
          aria-label={`${item.label} (${UNDER_DEVELOPMENT_LABEL})`}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </Link>
      </li>
    );
  }
  return (
    <li>
      <Link to={item.to} className={rowClass(active)} onClick={onNavigate}>
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.hiddenFromClient && (
          <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </Link>
    </li>
  );
}

export function MoreSheet({
  open,
  onOpenChange,
  account,
  status,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: ShellAccount;
  status: ShellStatus;
}) {
  const location = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      tela: (s.location.search as { tela?: string }).tela,
    }),
  });
  const releasedScreens = account.store?.releasedScreens ?? [];
  const areaLinks = navItems(areaItems, account.access, account.release, releasedScreens);
  const dataLinks = navItems(dataItems, account.access, account.release, releasedScreens);
  const isOwner = account.access === null;
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Mais" description={account.name}>
      {account.stores.length > 1 && (
        <div className="border-b border-border px-4 py-3">
          <Select value={account.store?.id ?? ""} onValueChange={account.onSelectStore}>
            <SelectTrigger className="h-10" aria-label="Trocar de loja">
              <SelectValue placeholder="Escolha a loja" />
            </SelectTrigger>
            <SelectContent>
              {account.stores.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                  {s.isArchived ? " (arquivada)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <SheetGroup title="Áreas">
        {areaLinks.map((item) => (
          <SheetLink key={item.to} item={item} location={location} onNavigate={close} />
        ))}
      </SheetGroup>
      {dataLinks.length > 0 && (
        <SheetGroup title="Dados">
          {dataLinks.map((item) => (
            <SheetLink key={item.to} item={item} location={location} onNavigate={close} />
          ))}
        </SheetGroup>
      )}
      <SheetGroup title="Infraestrutura">
        <li>
          <Link
            to="/integracoes"
            className={rowClass(location.pathname.startsWith("/integracoes"))}
            onClick={close}
          >
            <Plug className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">Integrações</span>
            {status.connectionsAlert && (
              <span
                className="h-2 w-2 shrink-0 rounded-sm bg-warning"
                aria-label="Há problema nas integrações"
              />
            )}
          </Link>
        </li>
        {isOwner && (
          <li>
            <Link to="/loja" className={rowClass(location.pathname === "/loja")} onClick={close}>
              <Settings className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">Loja</span>
            </Link>
          </li>
        )}
      </SheetGroup>
      <div className="py-2">
        <button type="button" onClick={account.onSignOut} className={cn(rowClass(false), "w-full")}>
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">Sair</span>
        </button>
      </div>
    </Sheet>
  );
}
