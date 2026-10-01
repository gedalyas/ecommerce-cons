import { connectorGuides, guideSteps, type StoreConnector } from "@ecommerce/contracts/connectors";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

export function HelpPanel({ connector }: { connector: StoreConnector }) {
  const guide = connectorGuides[connector.key];
  return (
    <div className="flex flex-col gap-4">
      <h3 className={cn(textClass.cardTitle, "text-foreground")}>Manual de integração</h3>
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        {guideSteps(connector).map((step) => (
          <li key={step} className={cn(textClass.body, "text-foreground")}>
            {step}
          </li>
        ))}
      </ol>
      {guide.modalities.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className={cn(textClass.label, "text-muted-foreground")}>Modalidades</p>
          <ul className="flex flex-col gap-2">
            {guide.modalities.map((m) => (
              <li key={m.key} className={cn(textClass.meta, "text-foreground")}>
                <span className="font-semibold">{m.label}:</span> {m.help}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
