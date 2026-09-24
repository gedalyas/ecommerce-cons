import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { funnelStages, type CampaignTagRow } from "@ecommerce/contracts/marketing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { saveCampaignTagFn } from "./marketingController";

type Option = { key: string; label: string };

type Props = {
  row: CampaignTagRow;
  field: "stage" | "channel";
  options: readonly Option[];
  label: string;
  onError: (message: string | null) => void;
};

export function CampaignTagSelect({ row, field, options, label, onError }: Props) {
  const save = useServerFn(saveCampaignTagFn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const value = row[field] ?? "none";
  const change = async (next: string) => {
    setBusy(true);
    const result = await save({
      data: {
        platform: row.platform,
        campaignId: row.campaignId,
        stage:
          field === "stage" ? (funnelStages.find((stage) => stage === next) ?? null) : row.stage,
        channel: field === "channel" ? next : row.channel,
      },
    });
    setBusy(false);
    onError(result.ok ? null : result.message);
    if (result.ok) await router.invalidate();
  };
  return (
    <Select value={value} onValueChange={(next) => void change(next)} disabled={busy}>
      <SelectTrigger className="h-8 w-40" aria-label={`${label} de ${row.campaignName}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.key} value={o.key}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
