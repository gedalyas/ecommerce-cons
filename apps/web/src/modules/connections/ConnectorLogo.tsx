import { FileSpreadsheet } from "lucide-react";
import { connectorOf, familyOf, type ConnectorKey } from "@ecommerce/contracts/connectors";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { connectorLogoPath, monogramOf } from "./connectorLogos";

type Props = { connectorKey: ConnectorKey; label: string; className?: string };

export function ConnectorLogo({ connectorKey, label, className }: Props) {
  const family = familyOf(connectorKey);
  const path = connectorLogoPath[family];
  const monogram = monogramOf(family === connectorKey ? label : connectorOf(family).label);
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-card text-foreground",
        radiusClass.control,
        className,
      )}
    >
      {connectorKey === "manual_csv" ? (
        <FileSpreadsheet className="h-5 w-5" />
      ) : path ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d={path} />
        </svg>
      ) : (
        <span className={cn(textClass.meta, "font-semibold")}>{monogram}</span>
      )}
    </span>
  );
}
