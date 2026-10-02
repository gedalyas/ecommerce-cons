import { Link } from "@tanstack/react-router";
import { Button } from "@/shared/ui/Button";

export function ProductsSheetLink() {
  return (
    <Button asChild size="sm" variant="outline">
      <Link to="/integracoes" search={{ aba: "planilhas" }}>
        Importar planilha de produtos
      </Link>
    </Button>
  );
}
