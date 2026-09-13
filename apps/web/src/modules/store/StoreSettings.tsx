import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { ActivityPage } from "@ecommerce/contracts/audit";
import type { Store } from "@ecommerce/contracts/store";
import { ActivityTable } from "@/modules/activity/contract";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { layout } from "@/shared/styles/spacing";
import { cn } from "@/shared/utils/cn";
import { StoreForm } from "./StoreForm";
import { updateStoreFn } from "./storeController";

export function StoreSettings({
  store,
  activity,
  onActivityPage,
}: {
  store: Store;
  activity: ActivityPage;
  onActivityPage: (page: number) => void;
}) {
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
        <SectionBlock
          title="Atividade"
          description="Quem fez o quê nesta loja: convites, importações, edições do acompanhamento."
        >
          <ActivityTable activity={activity} withStore={false} onPage={onActivityPage} />
        </SectionBlock>
      </div>
    </div>
  );
}
