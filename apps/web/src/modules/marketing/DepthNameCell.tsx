import { ImageOff } from "lucide-react";
import type { AdDepthRow, AdLevel } from "@ecommerce/contracts/marketing";
import { radiusClass } from "@/shared/styles/radius";

function Thumbnail({ url }: { url: string | null }) {
  return (
    <span
      className={`flex size-10 shrink-0 items-center justify-center overflow-hidden border border-border bg-muted ${radiusClass.badge}`}
    >
      {url ? (
        <img src={url} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        <ImageOff className="size-4 text-muted-foreground" aria-hidden />
      )}
    </span>
  );
}

export function DepthNameCell({
  row,
  level,
  onDrill,
}: {
  row: AdDepthRow;
  level: AdLevel;
  onDrill: (row: AdDepthRow) => void;
}) {
  if (level === "anuncio") {
    return (
      <span className="flex items-center gap-3">
        <Thumbnail url={row.thumbnailUrl} />
        {row.name}
      </span>
    );
  }
  return (
    <button
      type="button"
      className="text-left font-semibold text-primary underline-offset-2 hover:underline"
      onClick={() => onDrill(row)}
    >
      {row.name}
    </button>
  );
}
