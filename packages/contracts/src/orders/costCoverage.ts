import { formatPercent } from "../shared/format";

const minimumCostCoverage = 90;

export function costCoverage(costedRevenue: number, itemsRevenue: number): number | null {
  if (itemsRevenue <= 0) return null;
  return Math.min(100, Math.max(0, (costedRevenue / itemsRevenue) * 100));
}

const isCostUnknown = (coverage: number | null) =>
  coverage !== null && coverage < minimumCostCoverage;

export const knownCogs = (cogs: number, coverage: number | null): number | null =>
  isCostUnknown(coverage) ? null : cogs;

export function costCoverageNotice(coverage: number | null): string | null {
  if (coverage === null || coverage >= 100) return null;
  const share = formatPercent(Math.floor(coverage), 0);
  if (coverage === 0) {
    return "Nenhum produto vendido no período tem custo cadastrado. Cadastre o custo dos produtos para ver CMV, lucro e margens.";
  }
  if (isCostUnknown(coverage)) {
    return `Só ${share} da receita de produtos tem custo cadastrado. Cadastre o custo dos demais produtos para ver CMV, lucro e margens.`;
  }
  return `${share} da receita de produtos tem custo cadastrado: o CMV fica um pouco abaixo do real e o lucro e as margens, um pouco acima.`;
}
