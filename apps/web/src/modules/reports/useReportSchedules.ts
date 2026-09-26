import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import type { ReportScheduleInput, ReportSchedulesScreen } from "@ecommerce/contracts/reports";
import {
  deleteReportScheduleFn,
  getReportSchedulesFn,
  saveReportScheduleFn,
} from "./reportsController";

export function useReportSchedules() {
  const load = useServerFn(getReportSchedulesFn);
  const saveFn = useServerFn(saveReportScheduleFn);
  const removeFn = useServerFn(deleteReportScheduleFn);
  const [screen, setScreen] = useState<ReportSchedulesScreen | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const result = await load();
    if (result.ok) setScreen(result.value);
    else setMessage(result.message);
  }, [load]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const write = async (run: () => Promise<{ ok: true } | { ok: false; message: string }>) => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await run();
      if (!result.ok) {
        setMessage(result.message);
        return false;
      }
      await reload();
      return true;
    } finally {
      setBusy(false);
    }
  };
  const save = (id: string | null, schedule: ReportScheduleInput) =>
    write(() => saveFn({ data: { id, schedule } }));
  const remove = (id: string) => write(() => removeFn({ data: { id } }));
  return { screen, message, busy, save, remove };
}
