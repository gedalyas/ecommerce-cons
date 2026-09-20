import {
  dashboardWidgetKinds,
  defaultDashboardLayout,
  type DashboardLayout,
  type DashboardWidget,
  type DashboardWidgetKind,
} from "./dashboardWidgets";

const isKind = (value: unknown): value is DashboardWidgetKind =>
  typeof value === "string" && (dashboardWidgetKinds as readonly string[]).includes(value);

export function normalizeDashboardLayout(input: unknown): DashboardLayout {
  const widgets =
    input && typeof input === "object" && Array.isArray((input as { widgets?: unknown }).widgets)
      ? ((input as { widgets: unknown[] }).widgets as unknown[])
      : [];
  const seen = new Set<DashboardWidgetKind>();
  const kept: DashboardWidget[] = [];
  for (const raw of widgets) {
    if (!raw || typeof raw !== "object") continue;
    const { kind } = raw as { kind?: unknown };
    if (!isKind(kind) || seen.has(kind)) continue;
    seen.add(kind);
    kept.push({ kind });
  }
  return kept.length > 0 ? { widgets: kept } : defaultDashboardLayout;
}

export const availableWidgets = (layout: DashboardLayout): DashboardWidgetKind[] => {
  const used = new Set(layout.widgets.map((w) => w.kind));
  return dashboardWidgetKinds.filter((kind) => !used.has(kind));
};

export const addWidget = (layout: DashboardLayout, kind: DashboardWidgetKind): DashboardLayout =>
  layout.widgets.some((w) => w.kind === kind) ? layout : { widgets: [...layout.widgets, { kind }] };

export const removeWidget = (
  layout: DashboardLayout,
  kind: DashboardWidgetKind,
): DashboardLayout => ({
  widgets: layout.widgets.filter((w) => w.kind !== kind),
});

export function moveWidget(
  layout: DashboardLayout,
  from: DashboardWidgetKind,
  to: DashboardWidgetKind,
): DashboardLayout {
  const fromIndex = layout.widgets.findIndex((w) => w.kind === from);
  const toIndex = layout.widgets.findIndex((w) => w.kind === to);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return layout;
  const widgets = [...layout.widgets];
  const [moved] = widgets.splice(fromIndex, 1);
  widgets.splice(toIndex, 0, moved!);
  return { widgets };
}

export const sameLayout = (a: DashboardLayout, b: DashboardLayout) =>
  a.widgets.length === b.widgets.length && a.widgets.every((w, i) => w.kind === b.widgets[i]!.kind);
