import {
  connectorCategories,
  connectorCategoryLabel,
  type ConnectorCategory,
} from "@ecommerce/contracts/connectors";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

type Props = {
  value: ConnectorCategory;
  dimmed: boolean;
  onChange: (category: ConnectorCategory) => void;
};

export function CategoryMenu({ value, dimmed, onChange }: Props) {
  return (
    <nav aria-label="Categorias de integração">
      <div className={cn(textClass.label, "mb-2 hidden text-muted-foreground @3xl:block")}>
        Categorias
      </div>
      <ul className="flex gap-2 overflow-x-auto pb-1 @3xl:flex-col @3xl:gap-1 @3xl:overflow-visible @3xl:pb-0">
        {connectorCategories.map((category) => {
          const active = !dimmed && category === value;
          return (
            <li key={category} className="shrink-0">
              <button
                type="button"
                aria-current={active ? "true" : undefined}
                onClick={() => onChange(category)}
                className={cn(
                  textClass.body,
                  radiusClass.control,
                  "w-full whitespace-nowrap border px-3 py-2 text-left transition-colors duration-150 @3xl:border-transparent",
                  active
                    ? "border-primary bg-success-soft font-semibold text-primary"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {connectorCategoryLabel[category]}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
