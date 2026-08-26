import { Link, useRouterState } from "@tanstack/react-router";
import {
  Banknote,
  Building2,
  LayoutDashboard,
  Megaphone,
  MoreHorizontal,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Dinheiro", to: "/dinheiro", icon: Banknote },
  { label: "Marketing", to: "/marketing", icon: Megaphone },
  { label: "Logística", to: "/logistica", icon: Truck },
  { label: "Gestão", to: "/gestao", icon: Building2 },
  { label: "Mais", to: "/conexoes", icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-sidebar-border bg-sidebar md:hidden">
      {items.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px]",
              active ? "font-medium text-primary" : "text-sidebar-foreground/70",
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="w-full truncate text-center">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
