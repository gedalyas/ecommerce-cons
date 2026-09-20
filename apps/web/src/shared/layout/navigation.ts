import {
  Activity,
  Banknote,
  Building2,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Package,
  ShoppingBag,
  Sparkles,
  Target,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavLink = { label: string; to: string; icon: LucideIcon };

export const areaItems: readonly NavLink[] = [
  { label: "Assistente", to: "/assistente", icon: MessageSquare },
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Dinheiro", to: "/dinheiro", icon: Banknote },
  { label: "Marketing", to: "/marketing", icon: Megaphone },
  { label: "Logística", to: "/logistica", icon: Truck },
  { label: "Gestão", to: "/gestao", icon: Building2 },
];

export const dataItems: readonly NavLink[] = [
  { label: "Pedidos", to: "/pedidos", icon: ShoppingBag },
  { label: "Produtos", to: "/produtos", icon: Package },
  { label: "Clientes", to: "/clientes", icon: Users },
  { label: "Metas", to: "/metas", icon: Target },
  { label: "Métricas", to: "/metricas", icon: Activity },
  { label: "Influenciadores", to: "/influenciadores", icon: Sparkles },
];

export const bottomItems: readonly NavLink[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Marketing", to: "/marketing", icon: Megaphone },
  { label: "Pedidos", to: "/pedidos", icon: ShoppingBag },
  { label: "Dinheiro", to: "/dinheiro", icon: Banknote },
];
