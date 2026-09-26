import type { ReportBlock, ReportPalette } from "@ecommerce/contracts/reports";
import { formatDate } from "@ecommerce/contracts/shared/format";
import { formatMetricCompact } from "@ecommerce/contracts/shared/metricFormat";

type ChartBlock = Extract<ReportBlock, { kind: "chart" }>;
type Frame = { width: number; height: number; left: number; bottom: number; top: number };

export const CHART_WIDTH = 515;
const CHART_HEIGHT = 170;
const GRID_LINES = 4;

const frameOf = (): Frame => ({
  width: CHART_WIDTH,
  height: CHART_HEIGHT,
  left: 48,
  bottom: 22,
  top: 8,
});

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const bucketLabel = (bucket: string) =>
  formatDate(`${bucket}T00:00:00`, { day: "2-digit", month: "2-digit" });

function scaleOf(block: ChartBlock, frame: Frame) {
  const max = Math.max(0, ...block.series.flatMap((s) => s.values));
  const top = max > 0 ? max : 1;
  const plotHeight = frame.height - frame.bottom - frame.top;
  const plotWidth = frame.width - frame.left;
  return {
    y: (value: number) => frame.top + plotHeight - (Math.max(0, value) / top) * plotHeight,
    step: plotWidth / Math.max(1, block.buckets.length),
    top,
  };
}

function gridOf(block: ChartBlock, frame: Frame, palette: ReportPalette, top: number): string {
  const plotHeight = frame.height - frame.bottom - frame.top;
  return Array.from({ length: GRID_LINES + 1 }, (_, i) => {
    const value = (top / GRID_LINES) * i;
    const y = frame.top + plotHeight - (plotHeight / GRID_LINES) * i;
    const label = escapeXml(formatMetricCompact(value, block.unit));
    return (
      `<line x1="${frame.left}" y1="${y}" x2="${frame.width}" y2="${y}" stroke="${palette.grid}"/>` +
      `<text x="${frame.left - 6}" y="${y + 3}" font-size="7" text-anchor="end" fill="${palette.muted}">${label}</text>`
    );
  }).join("");
}

function axisLabels(block: ChartBlock, frame: Frame, palette: ReportPalette, step: number) {
  const last = block.buckets.length - 1;
  const picks = [...new Set([0, Math.floor(last / 2), last])].filter((i) => i >= 0);
  return picks
    .map((i) => {
      const x = frame.left + step * i + step / 2;
      const label = escapeXml(bucketLabel(block.buckets[i] ?? ""));
      return `<text x="${x}" y="${frame.height - 6}" font-size="7" text-anchor="middle" fill="${palette.muted}">${label}</text>`;
    })
    .join("");
}

function marksOf(block: ChartBlock, frame: Frame, palette: ReportPalette): string {
  const { y, step } = scaleOf(block, frame);
  const baseline = frame.height - frame.bottom;
  return block.series
    .map((series, s) => {
      const color = palette.series[s % palette.series.length];
      if (block.chart === "lines") {
        const points = series.values
          .map((v, i) => `${(frame.left + step * i + step / 2).toFixed(1)},${y(v).toFixed(1)}`)
          .join(" ");
        return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5"/>`;
      }
      const barWidth = (step * 0.8) / block.series.length;
      return series.values
        .map((v, i) => {
          const x = frame.left + step * i + step * 0.1 + barWidth * s;
          const top = y(v);
          return `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${(baseline - top).toFixed(1)}" fill="${color}"/>`;
        })
        .join("");
    })
    .join("");
}

export function chartSvgOf(block: ChartBlock, palette: ReportPalette): string {
  const frame = frameOf();
  const { step, top } = scaleOf(block, frame);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${frame.width}" height="${frame.height}">` +
    gridOf(block, frame, palette, top) +
    marksOf(block, frame, palette) +
    axisLabels(block, frame, palette, step) +
    `</svg>`
  );
}
