import type { AdminStore } from "@ecommerce/contracts/admin";
import type { ActivityPage } from "@ecommerce/contracts/audit";
import { ActivityTable } from "@/modules/activity/contract";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";

const ALL_STORES = "__all__";

export function AdminActivity({
  stores,
  activity,
  storeId,
  onChange,
}: {
  stores: AdminStore[];
  activity: ActivityPage;
  storeId: string;
  onChange: (next: { loja?: string; pagina?: number }) => void;
}) {
  return (
    <SectionBlock
      title="Atividade"
      description="Quem fez o quê nas lojas que você acompanha."
      meta={
        <Select
          value={storeId || ALL_STORES}
          onValueChange={(v) => onChange({ loja: v === ALL_STORES ? "" : v, pagina: 1 })}
        >
          <SelectTrigger className="w-52" aria-label="Filtrar por loja">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STORES}>Todas as lojas</SelectItem>
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <ActivityTable
        activity={activity}
        withStore={!storeId}
        onPage={(pagina) => onChange({ pagina })}
      />
    </SectionBlock>
  );
}
