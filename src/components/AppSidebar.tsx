import { Link, useRouterState } from "@tanstack/react-router";
import { Banknote, LayoutDashboard, Megaphone, Plug, Truck, Building2 } from "lucide-react";
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
      "flex min-h-11 items-center gap-3 border-l-2 px-3 py-2 text-[15px] transition-colors duration-150",
      "justify-center xl:justify-start",
      active
        ? "border-l-primary bg-accent font-semibold text-primary"
        : "border-l-transparent text-foreground hover:bg-muted",
    );

  return (
    <aside className="sticky top-0 hidden h-dvh w-18 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex xl:w-60">
      <div className="border-b border-sidebar-border px-3 py-4 xl:px-4">
        <div className="t-card-title truncate text-foreground">
          <span className="xl:hidden">NP</span>
          <span className="hidden xl:inline">Nome Provisório</span>
        </div>
        <div className="mt-3 hidden xl:block">
          <div className="t-label text-muted-foreground">Cliente</div>
          <div className="mt-1 truncate text-[15px] font-semibold text-foreground">Loja Aurora</div>
        </div>
      </div>

      <nav ref={ref} className="relative min-h-0 flex-1 overflow-y-auto py-2">
        <ScrollShadows top={top} bottom={bottom} />
        <div className="t-label hidden px-3 pb-2 pt-2 text-muted-foreground xl:block">Áreas</div>
        <ul>
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

        <div className="t-label hidden px-3 pb-2 text-muted-foreground xl:block">Infraestrutura</div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/conexoes" className={cn(linkClass(pathname === "/conexoes"), "relative")}>
              <Plug className="h-4 w-4 shrink-0" />
              <span className="hidden flex-1 truncate xl:inline">Conexões</span>
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-sm bg-warning xl:static xl:right-auto xl:top-auto"
                aria-label="Há problema nas conexões"
              />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="xl:hidden">
            Conexões
          </TooltipContent>
        </Tooltip>
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4 xl:px-4">
        <div className="hidden items-baseline justify-between xl:flex">
          <span className="t-meta font-semibold text-foreground">Maturidade</span>
          <span className="num t-meta text-muted-foreground">2 de 4 critérios</span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-sm bg-muted">
          <div className="h-full w-1/2 rounded-sm bg-primary" />
        </div>
      </div>
    </aside>
  );
}
