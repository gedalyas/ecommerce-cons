import { Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FidelitySeal } from "@/components/KpiTile";
import type { Fidelity } from "@/lib/mock-data";

const paleta = ["#1B4332", "#2D6A4F", "#D8F3DC", "#FFB703", "#212529"];

const consistencia: { text: string; ok: boolean }[] = [
  { text: "Loja e anúncios usam a mesma paleta", ok: true },
  { text: "Instagram usa tipografia diferente da loja", ok: false },
  { text: "Logo aparece em 3 versões distintas entre canais", ok: false },
];

const feed = [
  { tone: "#1B4332", alcance: "12,4k", eng: "2,8%", top: true },
  { tone: "#2D6A4F", alcance: "9,1k", eng: "2,1%", top: false },
  { tone: "#D8F3DC", alcance: "7,8k", eng: "1,7%", top: false },
  { tone: "#212529", alcance: "15,2k", eng: "3,4%", top: true },
  { tone: "#2D6A4F", alcance: "6,4k", eng: "1,2%", top: false },
  { tone: "#FFB703", alcance: "8,9k", eng: "2,0%", top: false },
  { tone: "#D8F3DC", alcance: "5,7k", eng: "1,1%", top: false },
  { tone: "#1B4332", alcance: "10,3k", eng: "2,4%", top: false },
  { tone: "#212529", alcance: "4,9k", eng: "0,9%", top: false },
];

type CriativoStatus = "Escalando" | "Estável" | "Fadigando";

const criativos: {
  nome: string;
  canal: string;
  ctr: string;
  cpa: string;
  status: CriativoStatus;
  tone: string;
}[] = [
  { nome: "Kit verão · carrossel", canal: "Meta Ads", ctr: "1,8%", cpa: "R$ 54", status: "Escalando", tone: "#D8F3DC" },
  { nome: "Depoimento Marina · vídeo 15s", canal: "Meta Ads", ctr: "2,4%", cpa: "R$ 41", status: "Escalando", tone: "#2D6A4F" },
  { nome: "Frete grátis · estático", canal: "Google Ads", ctr: "0,9%", cpa: "R$ 78", status: "Fadigando", tone: "#FFB703" },
  { nome: "Coleção nova · carrossel", canal: "Meta Ads", ctr: "1,1%", cpa: "R$ 69", status: "Estável", tone: "#212529" },
];

const statusStyles: Record<CriativoStatus, string> = {
  Escalando: "border border-primary text-primary",
  "Estável": "bg-muted text-muted-foreground",
  Fadigando: "border border-warning text-warning",
};

const paginas: { nome: string; visitas: string; conv: string; negativa?: boolean; fidelity: Fidelity }[] = [
  { nome: "Página inicial", visitas: "42.800", conv: "1,9%", fidelity: "A" },
  { nome: "Kit verão", visitas: "8.140", conv: "3,2%", fidelity: "A" },
  { nome: "Coleção nova", visitas: "5.610", conv: "0,7%", negativa: true, fidelity: "B" },
];

function seal(fidelity: Fidelity, note: string) {
  return <FidelitySeal kpi={{ label: "", value: "", fidelity, fidelityNote: note }} />;
}

function Bloco({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 border-t border-border pt-8 first:border-t-0 first:pt-0">
      <div className="t-label mb-4 text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

export function PresencaCriativos() {
  return (
    <div className="space-y-8">
      <Bloco title="Identidade da marca">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="min-w-0">
            <div className="t-meta mb-3 text-muted-foreground">Paleta</div>
            <div className="flex flex-wrap gap-3">
              {paleta.map((hex) => (
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
            <span className="inline-flex items-center rounded-sm border border-warning px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-warning">
              Inconsistente
            </span>
            <ul className="mt-4 space-y-2">
              {consistencia.map((item) => (
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
      </Bloco>

      <Bloco title="Feed do Instagram">
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
                {item.alcance} · {item.eng}
              </div>
            </div>
          ))}
        </div>
      </Bloco>

      <Bloco title="Criativos em veiculação">
        <ul className="space-y-3 md:space-y-0 md:divide-y md:divide-border md:rounded-lg md:border md:border-border">
          {criativos.map((c) => (
            <li
              key={c.nome}
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
                <div className="text-[15px] text-foreground">{c.nome}</div>
                <div className="t-meta text-muted-foreground">{c.canal}</div>
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
      </Bloco>

      <Bloco title="Landing pages">
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
              {paginas.map((p) => (
                <tr key={p.nome} className="border-b border-border last:border-0">
                  <td className="py-3 text-[15px] text-foreground">{p.nome}</td>
                  <td className="num py-3 text-right text-[15px] text-foreground">{p.visitas}</td>
                  <td
                    className={cn(
                      "num py-3 text-right text-[15px]",
                      p.negativa ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {p.conv}
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
          {paginas.map((p) => (
            <li key={p.nome} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 text-[15px] text-foreground">{p.nome}</span>
                {seal(p.fidelity, `Nível ${p.fidelity} — dados de sessões da landing page.`)}
              </div>
              <div className="mt-3 flex items-center gap-6">
                <div>
                  <div className="t-label text-muted-foreground">Visitas</div>
                  <div className="num text-[15px] text-foreground">{p.visitas}</div>
                </div>
                <div>
                  <div className="t-label text-muted-foreground">Conversão</div>
                  <div
                    className={cn(
                      "num text-[15px]",
                      p.negativa ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {p.conv}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Bloco>
    </div>
  );
}
