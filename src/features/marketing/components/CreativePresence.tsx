import { Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FidelityBadge } from "@/design-system/patterns/FidelityBadge";
import type { Fidelity } from "@/design-system/patterns/FidelityBadge";

const palette = ["#1B4332", "#2D6A4F", "#D8F3DC", "#FFB703", "#212529"];

const consistencyChecks: { text: string; ok: boolean }[] = [
  { text: "Loja e anúncios usam a mesma paleta", ok: true },
  { text: "Instagram usa tipografia diferente da loja", ok: false },
  { text: "Logo aparece em 3 versões distintas entre canais", ok: false },
];

const feed = [
  { tone: "#1B4332", reach: "12,4k", engagement: "2,8%", top: true },
  { tone: "#2D6A4F", reach: "9,1k", engagement: "2,1%", top: false },
  { tone: "#D8F3DC", reach: "7,8k", engagement: "1,7%", top: false },
  { tone: "#212529", reach: "15,2k", engagement: "3,4%", top: true },
  { tone: "#2D6A4F", reach: "6,4k", engagement: "1,2%", top: false },
  { tone: "#FFB703", reach: "8,9k", engagement: "2,0%", top: false },
  { tone: "#D8F3DC", reach: "5,7k", engagement: "1,1%", top: false },
  { tone: "#1B4332", reach: "10,3k", engagement: "2,4%", top: false },
  { tone: "#212529", reach: "4,9k", engagement: "0,9%", top: false },
];

// Display labels double as status values on purpose: they are what the badge renders.
type CreativeStatus = "Escalando" | "Estável" | "Fadigando";

const creatives: {
  name: string;
  channel: string;
  ctr: string;
  cpa: string;
  status: CreativeStatus;
  tone: string;
}[] = [
  {
    name: "Kit verão · carrossel",
    channel: "Meta Ads",
    ctr: "1,8%",
    cpa: "R$ 54",
    status: "Escalando",
    tone: "#D8F3DC",
  },
  {
    name: "Depoimento Marina · vídeo 15s",
    channel: "Meta Ads",
    ctr: "2,4%",
    cpa: "R$ 41",
    status: "Escalando",
    tone: "#2D6A4F",
  },
  {
    name: "Frete grátis · estático",
    channel: "Google Ads",
    ctr: "0,9%",
    cpa: "R$ 78",
    status: "Fadigando",
    tone: "#FFB703",
  },
  {
    name: "Coleção nova · carrossel",
    channel: "Meta Ads",
    ctr: "1,1%",
    cpa: "R$ 69",
    status: "Estável",
    tone: "#212529",
  },
];

const statusStyles: Record<CreativeStatus, string> = {
  Escalando: "border border-primary text-primary",
  Estável: "bg-muted text-muted-foreground",
  Fadigando: "border border-warning text-warning",
};

const landingPages: {
  name: string;
  visits: string;
  conversion: string;
  negative?: boolean;
  fidelity: Fidelity;
}[] = [
  { name: "Página inicial", visits: "42.800", conversion: "1,9%", fidelity: "A" },
  { name: "Kit verão", visits: "8.140", conversion: "3,2%", fidelity: "A" },
  { name: "Coleção nova", visits: "5.610", conversion: "0,7%", negative: true, fidelity: "B" },
];

function seal(fidelity: Fidelity, note: string) {
  return <FidelityBadge fidelity={fidelity} note={note} />;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 border-t border-border pt-8 first:border-t-0 first:pt-0">
      <div className="t-label mb-4 text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

export function CreativePresence() {
  return (
    <div className="space-y-8">
      <Block title="Identidade da marca">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="min-w-0">
            <div className="t-meta mb-3 text-muted-foreground">Paleta</div>
            <div className="flex flex-wrap gap-3">
              {palette.map((hex) => (
                <div key={hex} className="min-w-0">
                  <div
                    className="h-12 w-12 rounded-md border border-border"
                    style={{ backgroundColor: hex }}
                  />
                  <div className="num mt-1 text-[11px] text-muted-foreground">{hex}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <div className="t-meta mb-3 text-muted-foreground">Tipografia</div>
            <div className="space-y-3">
              <div className="text-[24px] font-semibold leading-tight text-foreground">
                Playfair Display · títulos
              </div>
              <div className="text-[15px] text-foreground">Inter · corpo</div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="t-meta mb-3 text-muted-foreground">Consistência</div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-sm border border-warning px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-warning">
                Inconsistente
              </span>
              <span className="num text-[17px] font-semibold text-foreground">68%</span>
              {seal("C", "Nível C — avaliação qualitativa da consultoria, indicativo apenas.")}
            </div>
            <ul className="mt-4 space-y-2">
              {consistencyChecks.map((item) => (
                <li key={item.text} className="flex items-start gap-2 text-[13px] text-foreground">
                  {item.ok ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  )}
                  <span className="min-w-0">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Block>

      <Block title="Feed do Instagram">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-12 w-12 shrink-0 rounded-full border border-border bg-muted" />
            <span className="truncate text-[15px] font-semibold text-foreground">@lojaaurora</span>
          </div>
          <div className="flex items-start gap-6 sm:gap-8">
            <div className="min-w-0">
              <div className="num text-[17px] font-semibold text-foreground">18.470</div>
              <div className="t-label mt-1 text-muted-foreground">Seguidores</div>
              <div className="num mt-1 text-[11px] text-primary">+4,2% no mês</div>
            </div>
            <div className="min-w-0">
              <div className="num text-[17px] font-semibold text-foreground">284</div>
              <div className="t-label mt-1 text-muted-foreground">Publicações</div>
            </div>
            <div className="min-w-0">
              <div className="num text-[17px] font-semibold text-foreground">3,1%</div>
              <div className="t-label mt-1 text-muted-foreground">Engajamento</div>
            </div>
            <div className="pt-1">
              {seal(
                "B",
                "Nível B — importado do relatório manual de 02/08. Conecte o Instagram para atualização diária.",
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {feed.map((item, i) => (
            <div key={i} className="min-w-0">
              <div
                className={cn(
                  "aspect-square w-full rounded-md border",
                  item.top ? "border-primary" : "border-border",
                )}
                style={{ backgroundColor: item.tone }}
              />
              <div className="num mt-1 truncate text-[11px] text-muted-foreground">
                {item.reach} · {item.engagement}
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Criativos em veiculação">
        <ul className="space-y-3 md:space-y-0 md:divide-y md:divide-border md:rounded-lg md:border md:border-border">
          {creatives.map((c) => (
            <li
              key={c.name}
              className={cn(
                "rounded-lg border border-border p-4 md:rounded-none md:border-0",
                "flex flex-col gap-3 md:flex-row md:items-center md:gap-4",
              )}
              style={c.status === "Fadigando" ? { backgroundColor: "#FFFBF5" } : undefined}
            >
              <div
                className="h-16 w-16 shrink-0 rounded-md border border-border"
                style={{ backgroundColor: c.tone }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] text-foreground">{c.name}</div>
                <div className="t-meta text-muted-foreground">{c.channel}</div>
              </div>
              <div className="flex flex-wrap items-center gap-4 md:justify-end">
                <div className="min-w-0">
                  <div className="t-label text-muted-foreground">CTR</div>
                  <div className="num text-[15px] text-foreground">{c.ctr}</div>
                </div>
                <div className="min-w-0">
                  <div className="t-label text-muted-foreground">CPA</div>
                  <div className="num text-[15px] text-foreground">{c.cpa}</div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]",
                    statusStyles[c.status],
                  )}
                >
                  {c.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Landing pages">
        <div className="hidden md:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="t-label pb-2 text-muted-foreground">Página</th>
                <th className="t-label pb-2 text-right text-muted-foreground">Visitas</th>
                <th className="t-label pb-2 text-right text-muted-foreground">Conversão</th>
                <th className="t-label pb-2 text-right text-muted-foreground">Fidelidade</th>
              </tr>
            </thead>
            <tbody>
              {landingPages.map((p) => (
                <tr key={p.name} className="border-b border-border last:border-0">
                  <td className="py-3 text-[15px] text-foreground">{p.name}</td>
                  <td className="num py-3 text-right text-[15px] text-foreground">{p.visits}</td>
                  <td
                    className={cn(
                      "num py-3 text-right text-[15px]",
                      p.negative ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {p.conversion}
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end">
                      {seal(p.fidelity, `Nível ${p.fidelity} — dados de sessões da landing page.`)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="space-y-3 md:hidden">
          {landingPages.map((p) => (
            <li key={p.name} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 text-[15px] text-foreground">{p.name}</span>
                {seal(p.fidelity, `Nível ${p.fidelity} — dados de sessões da landing page.`)}
              </div>
              <div className="mt-3 flex items-center gap-6">
                <div>
                  <div className="t-label text-muted-foreground">Visitas</div>
                  <div className="num text-[15px] text-foreground">{p.visits}</div>
                </div>
                <div>
                  <div className="t-label text-muted-foreground">Conversão</div>
                  <div
                    className={cn(
                      "num text-[15px]",
                      p.negative ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {p.conversion}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
}
