import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { AdminStore } from "@ecommerce/contracts/admin";
import {
  orderedScreens,
  storeScreenLabel,
  storeScreens,
  type StoreScreen,
} from "@ecommerce/contracts/auth";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { releaseScreensFn } from "./adminController";

const options = storeScreens.map((screen) => ({ value: screen, label: storeScreenLabel[screen] }));

const isStoreScreen = (value: string): value is StoreScreen =>
  storeScreens.some((screen) => screen === value);

export function StoreScreensSelect({
  store,
  onError,
}: {
  store: AdminStore;
  onError: (message: string) => void;
}) {
  const release = useServerFn(releaseScreensFn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const released = orderedScreens(store.releasedScreens);

  const change = async (values: string[]) => {
    setBusy(true);
    try {
      const screens = orderedScreens(values.filter(isStoreScreen));
      const result = await release({ data: { id: store.id, screens } });
      if (!result.ok) onError(result.message);
      await router.invalidate();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <MultiSelect
        label="Telas liberadas"
        options={options}
        value={released}
        onChange={(values) => void change(values)}
        className={cn("w-48", busy && "opacity-60")}
      />
      <span className={cn(textClass.meta, "max-w-56 truncate text-muted-foreground")}>
        {released.length > 0
          ? released.map((screen) => storeScreenLabel[screen]).join(", ")
          : "Só o dashboard e as conexões"}
      </span>
    </div>
  );
}
