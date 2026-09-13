import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

export function useEditRun() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: () => Promise<{ ok: boolean; message?: string }>) => {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (!result.ok) {
      setError(result.message ?? "Não foi possível salvar.");
      return false;
    }
    await router.invalidate();
    return true;
  };
  return { busy, error, run };
}
