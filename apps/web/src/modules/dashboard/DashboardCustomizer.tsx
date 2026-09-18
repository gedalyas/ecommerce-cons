import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bell,
  Filter,
  Flag,
  GripVertical,
  LayoutGrid,
  LineChart,
  ListChecks,
  Megaphone,
  Package,
  PieChart,
  Plus,
  SlidersHorizontal,
  Split,
  Table,
  Trash2,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import {
  dashboardWidgetCatalog,
  dashboardWidgetSizeLabel,
  dashboardWidgetSizes,
  type DashboardLayout,
  type DashboardWidget,
  type DashboardWidgetKind,
  type DashboardWidgetSize,
} from "@ecommerce/contracts/dashboard";
import { saveDashboardLayoutFn } from "./dashboardController";
import { useDashboardLayoutDraft } from "./useDashboardLayoutDraft";

const widgetIcon: Record<DashboardWidgetKind, LucideIcon> = {
  headline: LayoutGrid,
  indicator: LineChart,
  revenueVsInvestment: TrendingUp,
  channelSplit: Split,
  bySource: PieChart,
  topProducts: Package,
  customerMix: Users,
  funnel: Filter,
  paidMedia: Megaphone,
  matrix: Table,
  alerts: Bell,
  milestone: Flag,
  recommendations: ListChecks,
};

const sizeOptions = dashboardWidgetSizes.map((key) => ({
  key,
  label: dashboardWidgetSizeLabel[key],
}));

function WidgetRow({
  widget,
  onResize,
  onRemove,
}: {
  widget: DashboardWidget;
  onResize: (size: DashboardWidgetSize) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.kind,
  });
  const definition = dashboardWidgetCatalog[widget.kind];
  const Icon = widgetIcon[widget.kind];
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 border border-border bg-card p-3",
        radiusClass.card,
        isDragging && "relative z-10 shadow-md",
      )}
    >
      <button
        type="button"
        className={cn(
          "flex h-8 w-6 shrink-0 cursor-grab items-center justify-center text-muted-foreground hover:text-foreground active:cursor-grabbing",
          radiusClass.badge,
        )}
        aria-label={`Mover ${definition.label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center bg-success-soft text-primary",
          radiusClass.control,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn(textClass.meta, "font-semibold text-foreground")}>
          {definition.label}
        </div>
        <div className={cn(textClass.meta, "text-muted-foreground")}>{definition.description}</div>
      </div>
      <SegmentedControl
        options={sizeOptions}
        value={widget.size}
        onChange={onResize}
        label={`Largura de ${definition.label}`}
        className="max-sm:hidden"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label={`Remover ${definition.label}`}
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

function CustomizerForm({ layout, onClose }: { layout: DashboardLayout; onClose: () => void }) {
  const draft = useDashboardLayoutDraft(layout);
  const save = useServerFn(saveDashboardLayoutFn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      draft.move(active.id as DashboardWidgetKind, over.id as DashboardWidgetKind);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = await save({ data: draft.draft });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await router.invalidate();
    onClose();
  };

  return (
    <div className="space-y-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={draft.draft.widgets.map((w) => w.kind)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2">
            {draft.draft.widgets.map((widget) => (
              <WidgetRow
                key={widget.kind}
                widget={widget}
                onResize={(size) => draft.resize(widget.kind, size)}
                onRemove={() => draft.remove(widget.kind)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {draft.draft.widgets.length === 0 && (
        <p className={cn(textClass.meta, "text-muted-foreground")}>
          Nenhum bloco escolhido. Adicione pelo menos um para salvar.
        </p>
      )}

      {draft.available.length > 0 && (
        <div>
          <div className={cn(textClass.meta, "mb-2 text-muted-foreground")}>Adicionar bloco</div>
          <div className="flex flex-wrap gap-2">
            {draft.available.map((kind) => (
              <Button
                key={kind}
                variant="outline"
                size="sm"
                onClick={() => draft.add(kind)}
                className="font-normal"
              >
                <Plus className="h-4 w-4" /> {dashboardWidgetCatalog[kind].label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className={cn(textClass.meta, "text-destructive")}>
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button
          onClick={() => void submit()}
          disabled={busy || !draft.isDirty || draft.draft.widgets.length === 0}
        >
          {busy ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}

export function DashboardCustomizer({ layout }: { layout: DashboardLayout }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" /> Personalizar
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Personalizar dashboard"
        description="Escolha os blocos, a ordem e a largura de cada um."
      >
        {open && <CustomizerForm layout={layout} onClose={() => setOpen(false)} />}
      </Dialog>
    </>
  );
}
