import { useServerFn } from "@tanstack/react-start";
import { AuthCard } from "@/modules/auth/contract";
import { StoreForm } from "./StoreForm";
import { createStoreFn } from "./storeController";

export function StoreOnboarding() {
  const create = useServerFn(createStoreFn);
  return (
    <AuthCard
      title="Configure sua loja"
      description="Conte o básico da operação. Você pode ajustar depois em Loja."
    >
      <StoreForm
        profile={null}
        submitLabel="Criar minha loja"
        onSubmit={async (input) => {
          const result = await create({ data: input });
          if (!result.ok) return result.message;
          window.location.assign("/");
          return null;
        }}
      />
    </AuthCard>
  );
}
