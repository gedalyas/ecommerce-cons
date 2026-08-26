import { Link, useRouterState } from "@tanstack/react-router";
import {
  Banknote,
  LayoutDashboard,
  Megaphone,
  Plug,
  Truck,
  Building2,
} from "lucide-react";
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
      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
      active
        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
    );

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="border-b border-sidebar-border px-4 py-4">
        <div className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          Nome Provisório
        </div>
        <div className="mt-2 rounded-md border border-sidebar-border bg-card px-2.5 py-1.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Cliente</div>
          <div className="text-sm font-medium text-foreground">Loja Aurora</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Áreas
        </div>
        <ul className="space-y-0.5">
          {mainItems.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className={linkClass(pathname === item.to)}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="my-3 border-t border-sidebar-border" />

        <div className="rounded-md bg-card/70 p-1">
          <div className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Infraestrutura
          </div>
          <Link to="/conexoes" className={linkClass(pathname === "/conexoes")}>
            <Plug className="h-4 w-4" />
            <span className="flex-1">Conexões</span>
            <span className="h-2 w-2 rounded-full bg-warning" aria-label="Há problema nas conexões" />
          </Link>
        </div>
      </nav>

      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-baseline justify-between text-xs">
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
