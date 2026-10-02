export const productTextLimits = { sku: 100, name: 200, category: 100 } as const;

const MAX_MONEY = 9_999_999_999.99;
const MAX_STOCK = 2_147_483_647;

export const isMoneyInRange = (value: number | null) =>
  value === null || (value >= 0 && value <= MAX_MONEY);

export const isStockInRange = (value: number | null) =>
  value === null || Math.abs(value) <= MAX_STOCK;
