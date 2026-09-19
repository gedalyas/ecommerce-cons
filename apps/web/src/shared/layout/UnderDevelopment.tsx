import { Link } from "@tanstack/react-router";
import { Hammer } from "lucide-react";
import { UNDER_DEVELOPMENT_LABEL, UNDER_DEVELOPMENT_MESSAGE } from "@ecommerce/contracts/auth";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { PageHeader } from "@/shared/ui/PageHeader";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

export function UnderDevelopment({ title }: { title: string }) {
  return (
    <div className={layout.page}>
      <PageHeader title={title} subtitle={UNDER_DEVELOPMENT_LABEL} />
      <Card className={cn(layout.headerGap, layout.cardPadding)}>
        <div className="flex max-w-xl flex-col items-start gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Hammer className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className={cn(textClass.cardTitle, "text-foreground")}>{title} está a caminho</h2>
            <p className={cn(textClass.body, "mt-1 text-muted-foreground")}>
              {UNDER_DEVELOPMENT_MESSAGE} Sua consultoria libera cada tela quando ela estiver pronta
              para a sua operação.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Voltar ao dashboard</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
