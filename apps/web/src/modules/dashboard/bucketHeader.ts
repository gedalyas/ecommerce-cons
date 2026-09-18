import { formatDate } from "@ecommerce/contracts/shared/format";
import type { Granularity } from "@ecommerce/contracts/shared/period";

export const bucketHeader = (bucket: string, por: Granularity) => {
  const date = `${bucket}T00:00:00`;
  switch (por) {
    case "dia":
      return formatDate(date);
    case "semana":
      return `sem. ${formatDate(date)}`;
    case "mes":
      return formatDate(date, { month: "short", year: "2-digit" });
    case "ano":
      return formatDate(date, { year: "numeric" });
  }
};
