import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { Store } from "@ecommerce/contracts/store";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { layout } from "@/shared/styles/spacing";
import { cn } from "@/shared/utils/cn";
import { StoreForm } from "./StoreForm";
import { updateStoreFn } from "./storeController";

export function StoreSettings({ store }: { store: Store }) {
  const update = useServerFn(updateStoreFn);
  const router = useRouter();
  return (
    <div className={layout.page}>
      <PageHeader title="Loja" subtitle="Dados da operação que contextualizam os indicadores" />
      <div className={cn(layout.headerGap, layout.blockStack)}>
        <SectionBlock
          title={store.name}
          description={`Identificador: ${store.slug}`}
          bodyClassName={layout.cardPadding}
        >
          <StoreForm
            profile={store}
            submitLabel="Salvar"
            onSubmit={async (input) => {
              const result = await update({ data: input });
              if (!result.ok) return result.message;
              await router.invalidate();
              return null;
            }}
          />
        </SectionBlock>
      </div>
    </div>
  );
}
