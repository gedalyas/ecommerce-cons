import {
  IMPORT_PREVIEW_ROWS,
  type ImportPreviewCell,
  type ImportPreviewColumn,
  type ImportPreviewSummary,
} from "@ecommerce/contracts/imports";
import { adPlatformLabel } from "@ecommerce/contracts/marketing";
import { financialStatusLabel, labelFor } from "@ecommerce/contracts/orders";
import type { AdSpendRow, OrderInput, TrafficRow } from "./importRows.types";

export type PreviewBody = {
  summary: ImportPreviewSummary;
  columns: ImportPreviewColumn[];
  sample: Record<string, ImportPreviewCell>[];
};

const column = (
  key: string,
  header: string,
  type: ImportPreviewColumn["type"] = "text",
): ImportPreviewColumn => ({ key, header, type });

function dateSpan(dates: string[]): Pick<ImportPreviewSummary, "from" | "to"> {
  if (dates.length === 0) return { from: null, to: null };
  const sorted = [...dates].sort();
  return { from: sorted[0] ?? null, to: sorted[sorted.length - 1] ?? null };
}

export const ordersColumns: ImportPreviewColumn[] = [
  column("number", "Pedido"),
  column("placedAt", "Data", "date"),
  column("customer", "Cliente"),
  column("items", "Itens", "integer"),
  column("totalPrice", "Total", "currency"),
  column("status", "Status"),
];

export function ordersPreview(orders: OrderInput[]): PreviewBody {
  return {
    summary: {
      count: orders.length,
      label: orders.length === 1 ? "pedido" : "pedidos",
      ...dateSpan(orders.map((o) => o.placedAt)),
    },
    columns: ordersColumns,
    sample: orders.slice(0, IMPORT_PREVIEW_ROWS).map((o) => ({
      number: o.number,
      placedAt: o.placedAt,
      customer: o.customerName,
      items: o.items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: o.totalPrice,
      status: labelFor(financialStatusLabel, o.status),
    })),
  };
}

export const adSpendColumns: ImportPreviewColumn[] = [
  column("date", "Data", "date"),
  column("platform", "Plataforma"),
  column("campaignName", "Campanha"),
  column("spend", "Investimento", "currency"),
  column("clicks", "Cliques", "integer"),
  column("conversions", "Conversões", "integer"),
];

export function adSpendPreview(rows: AdSpendRow[]): PreviewBody {
  return {
    summary: {
      count: rows.length,
      label: rows.length === 1 ? "linha de mídia" : "linhas de mídia",
      ...dateSpan(rows.map((r) => r.date)),
    },
    columns: adSpendColumns,
    sample: rows.slice(0, IMPORT_PREVIEW_ROWS).map((r) => ({
      date: r.date,
      platform: adPlatformLabel[r.platform],
      campaignName: r.campaignName,
      spend: r.spend,
      clicks: r.clicks,
      conversions: r.conversions,
    })),
  };
}

export const trafficColumns: ImportPreviewColumn[] = [
  column("date", "Data", "date"),
  column("source", "Origem"),
  column("medium", "Meio"),
  column("sessions", "Sessões", "integer"),
  column("users", "Usuários", "integer"),
  column("beginCheckout", "Checkouts", "integer"),
];

export function trafficPreview(rows: TrafficRow[]): PreviewBody {
  return {
    summary: {
      count: rows.length,
      label: rows.length === 1 ? "linha de tráfego" : "linhas de tráfego",
      ...dateSpan(rows.map((r) => r.date)),
    },
    columns: trafficColumns,
    sample: rows.slice(0, IMPORT_PREVIEW_ROWS).map((r) => ({
      date: r.date,
      source: r.source,
      medium: r.medium,
      sessions: r.sessions,
      users: r.users,
      beginCheckout: r.beginCheckout,
    })),
  };
}
