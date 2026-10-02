import { Search } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import {
  connectorKindLabel,
  searchSuggestions,
  type StoreConnector,
} from "@ecommerce/contracts/connectors";
import { Input } from "@/shared/ui/Input";
import { radiusClass } from "@/shared/styles/radius";
import { shadowClass } from "@/shared/styles/shadows";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { ConnectorLogo } from "./ConnectorLogo";
import { nextActive } from "./integrationRules";

const SUGGESTION_LIMIT = 6;
const LIST_ID = "integracoes-sugestoes";

type Props = {
  connectors: StoreConnector[];
  query: string;
  onQuery: (query: string) => void;
  onOpen: (connector: StoreConnector) => void;
};

export function IntegrationSearch({ connectors, query, onQuery, onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const matches = searchSuggestions(connectors, query, SUGGESTION_LIMIT);
  const suggestions = open ? matches : [];
  const showPanel = open && query.trim().length > 0;
  const optionId = (index: number) => `${LIST_ID}-${index}`;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => nextActive(i, event.key === "ArrowDown" ? 1 : -1, matches.length));
    } else if (event.key === "Enter") {
      const chosen = suggestions[active];
      if (chosen) onOpen(chosen);
      setOpen(false);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <label className="relative block">
        <span className="sr-only">Buscar integração</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={LIST_ID}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && active >= 0 ? optionId(active) : undefined}
          value={query}
          onChange={(e) => {
            onQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder="Buscar por plataforma: Bling, Mercado Livre, Meta Ads…"
          className="h-11 pl-9"
        />
      </label>
      {showPanel && (
        <div
          className={cn(
            "absolute inset-x-0 top-full z-20 mt-1 border border-border bg-card",
            radiusClass.card,
            shadowClass.md,
          )}
        >
          <ul
            hidden={suggestions.length === 0}
            id={LIST_ID}
            role="listbox"
            aria-label="Sugestões de integração"
            className="py-1"
          >
            {suggestions.map((c, index) => (
              <li
                key={c.key}
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false);
                  onOpen(c);
                }}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-3 py-2",
                  index === active && "bg-muted",
                )}
              >
                <ConnectorLogo connectorKey={c.key} label={c.label} className="h-8 w-8" />
                <span className={cn(textClass.body, "min-w-0 flex-1 truncate text-foreground")}>
                  {c.label}
                </span>
                <span className={cn(textClass.meta, "shrink-0 text-muted-foreground")}>
                  Em {connectorKindLabel[c.kind]}
                </span>
              </li>
            ))}
          </ul>
          <p
            className={cn(textClass.meta, "border-t border-border px-3 py-2 text-muted-foreground")}
          >
            {suggestions.length === 0 ? "Nenhuma integração com esse nome. " : ""}
            Não encontrou o que procurava? Conte para sua consultoria qual plataforma você usa.
          </p>
        </div>
      )}
    </div>
  );
}
