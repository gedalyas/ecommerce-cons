import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileUp } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import {
  importKindLabel,
  importKinds,
  importTemplates,
  templateRows,
  type ColumnMapping,
  type ImportJob,
  type ImportKind,
  type ImportPreviewResult,
  type ImportsScreen,
} from "@ecommerce/contracts/imports";
import { Button } from "@/shared/ui/Button";
import { DataTable } from "@/shared/ui/DataTable";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { layout } from "@/shared/styles/spacing";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { downloadCsv } from "@/shared/utils/csv";
import { ColumnMappingCard } from "./ColumnMappingCard";
import { formatFileSize, importFileProblem } from "./importFile";
import { importHistoryColumns } from "./importHistoryColumns";
import { UndoImportButton } from "./UndoImportButton";
import { ImportPreviewCard } from "./ImportPreviewCard";
import { ImportResult } from "./ImportResult";
import { previewImportFn, uploadImportFn } from "./importsController";

const kindOptions = importKinds.map((key) => ({ key, label: importKindLabel[key] }));

const csvForm = (kind: ImportKind, file: File, mapping: ColumnMapping | null) => {
  const form = new FormData();
  form.append("kind", kind);
  form.append("file", file, file.name);
  if (mapping) form.append("mapping", JSON.stringify(mapping));
  return form;
};

function useImportUpload() {
  const upload = useServerFn(uploadImportFn);
  const previewFn = useServerFn(previewImportFn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [job, setJob] = useState<ImportJob | null>(null);

  const preview_ = async (kind: ImportKind, file: File, chosen: ColumnMapping | null = null) => {
    setBusy(true);
    setMessage(null);
    setJob(null);
    setMapping(chosen);
    try {
      const result = await previewFn({ data: csvForm(kind, file, chosen) });
      if (result.ok) setPreview(result.data);
      else setMessage(result.message);
    } finally {
      setBusy(false);
    }
  };
  const submit = async (kind: ImportKind, file: File) => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await upload({ data: csvForm(kind, file, mapping) });
      if (result.ok) {
        setJob(result.data);
        setPreview(null);
        await router.invalidate();
      } else {
        setMessage(result.message);
      }
    } finally {
      setBusy(false);
    }
  };
  const reset = () => {
    setPreview(null);
    setMapping(null);
    setMessage(null);
  };
  return { busy, message, setMessage, preview, job, previewFile: preview_, submit, reset };
}

function TemplateColumns({ kind }: { kind: ImportKind }) {
  const template = importTemplates[kind];
  return (
    <div>
      <p className={cn(textClass.meta, "text-muted-foreground")}>{template.description}</p>
      <ul className="mt-2 flex flex-wrap gap-1">
        {template.columns.map((column) => (
          <li
            key={column.key}
            className={cn(
              textClass.meta,
              radiusClass.badge,
              "border border-border px-2 py-0.5",
              column.required ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
            title={`Exemplo: ${column.example}`}
          >
            {column.header}
            {column.required ? " *" : ""}
          </li>
        ))}
      </ul>
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => downloadCsv(`modelo-${kind.toLowerCase()}`, templateRows(kind))}
      >
        <Download className="h-4 w-4" /> Baixar modelo
      </Button>
    </div>
  );
}

export function ImportPanel({ data }: { data: ImportsScreen }) {
  const editableOptions = kindOptions.filter((o) => data.editableKinds.includes(o.key));
  const [kind, setKind] = useState<ImportKind>(data.editableKinds[0] ?? "ORDERS");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { busy, message, setMessage, preview, job, previewFile, submit, reset } = useImportUpload();

  const pick = (candidate: File | null) => {
    reset();
    if (!candidate) return;
    const problem = importFileProblem(candidate.name, candidate.size);
    if (problem) {
      setFile(null);
      setMessage(problem);
      return;
    }
    setFile(candidate);
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    pick(event.dataTransfer.files[0] ?? null);
  };

  return (
    <SectionBlock
      title="Importação manual"
      description="Planilhas CSV que ainda não têm integração automática — no modelo ou do jeito que a sua planilha já é: você diz qual coluna é qual e a gente lembra. O arquivo é validado e gravado nas mesmas tabelas que alimentam os indicadores."
      bodyClassName={cn(layout.cardPadding, layout.groupStack)}
    >
      {editableOptions.length === 0 && (
        <p role="status" className={cn(textClass.meta, "text-muted-foreground")}>
          Você não tem permissão para importar planilhas. Peça ao dono da loja para liberar a edição
          de Dados ou Marketing.
        </p>
      )}
      {editableOptions.length > 0 && (
        <>
          <SegmentedControl
            options={editableOptions}
            value={kind}
            onChange={(next) => {
              reset();
              setKind(next);
            }}
            label="Tipo de dado"
          />
          <TemplateColumns kind={kind} />

          <div
            role="button"
            tabIndex={0}
            onClick={() => input.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "cursor-pointer border border-dashed bg-background p-5 transition-colors duration-150",
              radiusClass.card,
              dragging ? "border-primary bg-accent" : "border-border",
            )}
          >
            <input
              ref={input}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
            <div className="flex items-center gap-3">
              <FileUp className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-foreground">
                  {file ? file.name : "Arraste o CSV aqui ou selecione um arquivo"}
                </div>
                <p className={cn(textClass.meta, "mt-1 text-muted-foreground")}>
                  {file
                    ? `${formatFileSize(file.size)} · clique para trocar`
                    : "Formato aceito: .csv · até 10 MB"}
                </p>
              </div>
            </div>
          </div>

          {message && (
            <p role="alert" className={cn(textClass.meta, "text-destructive")}>
              {message}
            </p>
          )}

          {!preview && (
            <div className="flex justify-end">
              <Button
                disabled={!file || busy}
                onClick={() => file && void previewFile(kind, file)}
                className="h-11 w-full md:h-9 md:w-auto"
              >
                {busy ? "Lendo…" : `Conferir ${importKindLabel[kind].toLowerCase()}`}
              </Button>
            </div>
          )}

          {preview?.step === "mapping" && file && (
            <ColumnMappingCard
              key={preview.header.join("|")}
              step={preview}
              busy={busy}
              onConfirm={(chosen) => void previewFile(kind, file, chosen)}
              onCancel={reset}
            />
          )}

          {preview?.step === "preview" && file && (
            <ImportPreviewCard
              preview={preview}
              busy={busy}
              onConfirm={() => void submit(kind, file)}
              onCancel={reset}
            />
          )}

          {job && <ImportResult job={job} />}
        </>
      )}

      <DataTable
        columns={[
          ...importHistoryColumns,
          {
            key: "undo",
            header: "",
            align: "right",
            render: (r) => (r.canUndo ? <UndoImportButton job={r} /> : null),
          },
        ]}
        rows={data.jobs}
        rowKey={(r) => r.id}
        emptyMessage="Nenhuma importação ainda."
      />
    </SectionBlock>
  );
}
