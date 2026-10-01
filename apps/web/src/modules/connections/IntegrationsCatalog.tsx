import { Search } from "lucide-react";
import {
  connectorCategories,
  connectorCategoryHint,
  connectorCategoryLabel,
  connectorKindGuide,
  connectorKindLabel,
  connectorsOfCategory,
  isRecommendedConnector,
  recommendedConnectors,
  searchConnectors,
  type CategoryGroup,
  type ConnectorCategory,
  type StoreConnector,
} from "@ecommerce/contracts/connectors";
import { Input } from "@/shared/ui/Input";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { SideTabs } from "./SideTabs";
import { ConnectorCard } from "./ConnectorCard";

type Open = (connector: StoreConnector) => void;

const categoryItems = connectorCategories.map((key) => ({
  key,
  label: connectorCategoryLabel[key],
}));

function CardGrid({ items, onOpen }: { items: StoreConnector[]; onOpen: Open }) {
  return (
    <ul className="grid gap-3 @lg:grid-cols-2 @2xl:grid-cols-3">
      {items.map((c) => (
        <li key={c.key} className="flex">
          <ConnectorCard
            connector={c}
            recommended={isRecommendedConnector(c.key)}
            onOpen={onOpen}
          />
        </li>
      ))}
    </ul>
  );
}

function GroupSections({ group, onOpen }: { group: CategoryGroup<StoreConnector>; onOpen: Open }) {
  return (
    <div className={layout.blockStack}>
      {group.sections.map((section) => (
        <section key={section.kind} className="flex flex-col gap-3">
          <div>
            <h3 className={cn(textClass.cardTitle, "text-foreground")}>
              {connectorKindLabel[section.kind]}
            </h3>
            <p className={cn(textClass.meta, "text-muted-foreground")}>
              {connectorKindGuide[section.kind].hint}
            </p>
          </div>
          <CardGrid items={section.items} onOpen={onOpen} />
        </section>
      ))}
    </div>
  );
}

function CategoryView({
  connectors,
  category,
  onOpen,
}: {
  connectors: StoreConnector[];
  category: ConnectorCategory;
  onOpen: Open;
}) {
  const recommended = recommendedConnectors[category].flatMap(
    (key) => connectors.find((c) => c.key === key) ?? [],
  );
  return (
    <div className={layout.blockStack}>
      <div>
        <h2 className={cn(textClass.sectionTitle, "text-foreground")}>
          {connectorCategoryLabel[category]}
        </h2>
        <p className={cn(textClass.body, "text-muted-foreground")}>
          {connectorCategoryHint[category]}
        </p>
      </div>
      {recommended.length > 0 && (
        <section className="flex flex-col gap-3 border-b border-border pb-6">
          <h3 className={cn(textClass.label, "text-primary")}>Recomendados</h3>
          <CardGrid items={recommended} onOpen={onOpen} />
        </section>
      )}
      <GroupSections group={connectorsOfCategory(connectors, category)} onOpen={onOpen} />
    </div>
  );
}

function SearchResults({
  connectors,
  query,
  onOpen,
}: {
  connectors: StoreConnector[];
  query: string;
  onOpen: Open;
}) {
  const groups = searchConnectors(connectors, query);
  if (groups.length === 0) {
    return (
      <p className={cn(textClass.body, "text-muted-foreground")}>
        Nenhuma integração encontrada para “{query.trim()}”. Não achou a sua plataforma? Fale com
        sua consultoria.
      </p>
    );
  }
  return (
    <div className={layout.blockStack}>
      {groups.map((group) => (
        <div key={group.category} className="flex flex-col gap-4">
          <h2 className={cn(textClass.sectionTitle, "text-foreground")}>
            {connectorCategoryLabel[group.category]}
          </h2>
          <GroupSections group={group} onOpen={onOpen} />
        </div>
      ))}
    </div>
  );
}

type Props = {
  connectors: StoreConnector[];
  category: ConnectorCategory;
  query: string;
  onCategory: (category: ConnectorCategory) => void;
  onQuery: (query: string) => void;
  onOpen: Open;
};

export function IntegrationsCatalog({
  connectors,
  category,
  query,
  onCategory,
  onQuery,
  onOpen,
}: Props) {
  const searching = query.trim().length > 0;
  return (
    <div className="@container flex flex-col gap-6">
      <label className="relative block">
        <span className="sr-only">Buscar integração</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Buscar por plataforma: Bling, Mercado Livre, Meta Ads…"
          className="h-11 pl-9"
        />
      </label>
      <div className="grid grid-cols-1 gap-6 @3xl:grid-cols-[200px_minmax(0,1fr)]">
        <SideTabs
          label="Categorias"
          items={categoryItems}
          value={searching ? null : category}
          onChange={onCategory}
        />
        <div className="@container min-w-0">
          {searching ? (
            <SearchResults connectors={connectors} query={query} onOpen={onOpen} />
          ) : (
            <CategoryView connectors={connectors} category={category} onOpen={onOpen} />
          )}
        </div>
      </div>
    </div>
  );
}
