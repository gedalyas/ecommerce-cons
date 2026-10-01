import { Link } from "@tanstack/react-router";
import { AlertBanner } from "@/shared/ui/AlertBanner";
import { Button } from "@/shared/ui/Button";

export function DataReadinessBanner() {
  return (
    <div className="px-4 pt-4 md:px-6">
      <AlertBanner
        action={
          <Button asChild size="sm" variant="outline">
            <Link to="/integracoes">Ver integrações</Link>
          </Button>
        }
      >
        <span className="font-semibold text-foreground">Conecte uma fonte de dados da loja.</span>{" "}
        <span className="text-muted-foreground">
          Os painéis ficam vazios até a plataforma, o ERP ou uma planilha alimentar os pedidos.
        </span>
      </AlertBanner>
    </div>
  );
}
