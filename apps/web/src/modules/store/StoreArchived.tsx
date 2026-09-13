import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AuthCard, logoutFn } from "@/modules/auth/contract";
import { Button } from "@/shared/ui/Button";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

export function StoreArchived({ storeName }: { storeName: string }) {
  const logout = useServerFn(logoutFn);
  const router = useRouter();
  const signOut = async () => {
    await logout();
    await router.invalidate();
    window.location.assign("/entrar");
  };
  return (
    <AuthCard title="Loja arquivada" description={`${storeName} foi arquivada pela consultoria.`}>
      <p className={cn(textClass.body, "text-foreground")}>
        Os dados continuam guardados. Para reativar o acompanhamento, fale com sua consultoria.
      </p>
      <Button variant="outline" className="mt-5 w-full" onClick={() => void signOut()}>
        Sair
      </Button>
    </AuthCard>
  );
}
