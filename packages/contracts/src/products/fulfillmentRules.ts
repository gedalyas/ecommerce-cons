export const isMarketplaceStock = (sold30: number, sold30Marketplace: number): boolean =>
  sold30 > 0 && sold30Marketplace * 2 >= sold30;
