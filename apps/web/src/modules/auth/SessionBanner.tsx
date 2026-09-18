import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { leaveImpersonationFn } from "./authController";

const ADMIN_PATH = "/admin";
const ACCESS_PATH = "/admin/acesso";

const barClass =
  "flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-2 md:px-6";

export function SessionBanner({
  userName,
  impersonatedBy,
}: {
  userName: string;
  impersonatedBy: string | null;
}) {
  const leave = useServerFn(leaveImpersonationFn);
  const [isLeaving, setIsLeaving] = useState(false);

  if (impersonatedBy) {
    const back = async () => {
      setIsLeaving(true);
      await leave();
      window.location.assign(ACCESS_PATH);
    };
    return (
      <div role="status" className={cn(barClass, "bg-warning-soft")}>
        <UserRound className="h-4 w-4 shrink-0 text-warning" />
        <span className={cn(textClass.meta, "min-w-0 flex-1 text-foreground")}>
          Você está acessando como <span className="font-semibold">{userName}</span>. Tudo o que
          fizer aqui será registrado em nome dessa pessoa.
        </span>
        <Button size="sm" variant="outline" onClick={() => void back()} disabled={isLeaving}>
          Voltar à administração
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(barClass, "bg-muted/40")}>
      <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
      <span className={cn(textClass.meta, "min-w-0 flex-1 text-muted-foreground")}>
        Painel da loja visto pela consultoria.
      </span>
      <Button asChild size="sm" variant="ghost">
        <Link to={ADMIN_PATH}>Voltar à administração</Link>
      </Button>
    </div>
  );
}
