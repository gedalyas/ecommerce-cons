import { useState } from "react";
import {
  addWidget,
  availableWidgets,
  moveWidget,
  removeWidget,
  resizeWidget,
  sameLayout,
  type DashboardLayout,
  type DashboardWidgetKind,
  type DashboardWidgetSize,
} from "@ecommerce/contracts/dashboard";

export function useDashboardLayoutDraft(initial: DashboardLayout) {
  const [draft, setDraft] = useState<DashboardLayout>(initial);
  return {
    draft,
    available: availableWidgets(draft),
    isDirty: !sameLayout(draft, initial),
    reset: () => setDraft(initial),
    add: (kind: DashboardWidgetKind) => setDraft((prev) => addWidget(prev, kind)),
    remove: (kind: DashboardWidgetKind) => setDraft((prev) => removeWidget(prev, kind)),
    resize: (kind: DashboardWidgetKind, size: DashboardWidgetSize) =>
      setDraft((prev) => resizeWidget(prev, kind, size)),
    move: (from: DashboardWidgetKind, to: DashboardWidgetKind) =>
      setDraft((prev) => moveWidget(prev, from, to)),
  };
}
