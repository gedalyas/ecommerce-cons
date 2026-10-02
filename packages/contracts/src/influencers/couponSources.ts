import { connectorOf, type ConnectorKey, type DataOwner } from "../connectors/contract";

const couponlessSources: readonly ConnectorKey[] = [
  "bling",
  "amazon",
  "amazon_fba_classic",
  "amazon_fba_onsite",
];

export function couponSourceNotice(salesSource: DataOwner | null): string | null {
  if (!salesSource || salesSource === "system" || !couponlessSources.includes(salesSource)) {
    return null;
  }
  return `As vendas desta loja vêm de ${connectorOf(salesSource).label}, que não informa o cupom usado no pedido: os influenciadores ficam sem vendas atribuídas.`;
}

export function influencersEmptyMessage(influencersInStore: number): string {
  return influencersInStore === 0
    ? "Cadastre o primeiro influenciador com o cupom que ele divulga para medir as vendas da parceria."
    : "Nenhum influenciador neste status.";
}
