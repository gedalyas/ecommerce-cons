import { Link, useRouterState } from "@tanstack/react-router";
import {
  Banknote,
  LayoutDashboard,
  Megaphone,
  Plug,
  Truck,
  Building2,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const mainItems = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Dinheiro", to: "/dinheiro", icon: Banknote },
  { label: "Marketing", to: "/marketing", icon: Megaphone },
  { label: "Logística", to: "/logistica", icon: Truck },
  { label: "Gestão", to: "/gestao", icon: Building2 },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const linkClass = (active: boolean) =>
    cn(
      "flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
      "justify-center xl:justify-start",
      active
        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
    );

  return (
    <aside className="sticky top-0 hidden h-screen w-18 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex xl:w-60">
      <div className="border-b border-sidebar-border px-2 py-4 xl:px-4">
        <div className="truncate text-center text-sm font-semibold tracking-tight text-sidebar-foreground xl:text-left">
          <span className="xl:hidden">NP</span>
          <span className="hidden xl:inline">Nome Provisório</span>
        </div>
        <div className="mt-2 hidden rounded-md border border-sidebar-border bg-card px-2.5 py-1.5 xl:block">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Cliente</div>
          <div className="truncate text-sm font-medium text-foreground">Loja Aurora</div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="hidden px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground xl:block">
          Áreas
        </div>
        <ul className="space-y-0.5">
          {mainItems.map((item) => (
            <li key={item.to}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to={item.to} className={linkClass(pathname === item.to)}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="hidden truncate xl:inline">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="xl:hidden">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>

        <div className="my-3 border-t border-sidebar-border" />

        <div className="rounded-md bg-card/70 p-1">
          <div className="hidden px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground xl:block">
            Infraestrutura
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/conexoes" className={cn(linkClass(pathname === "/conexoes"), "relative")}>
                <Plug className="h-4 w-4 shrink-0" />
                <span className="hidden flex-1 truncate xl:inline">Conexões</span>
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-warning xl:static xl:right-auto xl:top-auto"
                  aria-label="Há problema nas conexões"
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="xl:hidden">
              Conexões
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>

      <div className="border-t border-sidebar-border px-2 py-4 xl:px-4">
        <div className="hidden items-baseline justify-between text-xs xl:flex">
          <span className="font-medium text-sidebar-foreground">Maturidade</span>
          <span className="num text-muted-foreground">2 de 4 critérios</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full w-1/2 rounded-full bg-primary" />
        </div>
      </div>
    </aside>
  );
}
