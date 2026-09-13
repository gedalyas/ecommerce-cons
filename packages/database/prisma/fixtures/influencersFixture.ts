import type { InfluencerSeed } from "./fixture.types";

export const influencersSeed: InfluencerSeed[] = [
  {
    name: "Luiza Casa & Cor",
    handle: "@casa.da.lu",
    status: "ACTIVE",
    notes: "Reels semanais com a coleção de inverno; cupom exclusivo desde março.",
    rules: [
      {
        type: "MONTHLY",
        value: 1500,
        startDate: "2025-03-01",
        endDate: null,
        cap: null,
        notes: "",
      },
      {
        type: "PERCENT_OF_PRODUCTS",
        value: 10,
        startDate: "2025-03-01",
        endDate: null,
        cap: 3000,
        notes: "Teto de R$ 3.000 por mês",
      },
    ],
    coupons: [{ code: "INSTA10", activeFrom: "2025-03-01", activeUntil: null }],
  },
  {
    name: "Amiga Decor",
    handle: "@amigadecor",
    status: "ACTIVE",
    notes: "Indicação por cupom, sem fixo.",
    rules: [
      { type: "PER_ORDER", value: 8, startDate: "2025-06-01", endDate: null, cap: null, notes: "" },
    ],
    coupons: [{ code: "AMIGA15", activeFrom: "2025-06-01", activeUntil: null }],
  },
  {
    name: "Studio Lar",
    handle: "@studiolar.oficial",
    status: "PAUSED",
    notes: "Parceria pausada em agosto; cupom desativado.",
    rules: [
      {
        type: "FIXED",
        value: 2500,
        startDate: "2026-05-10",
        endDate: null,
        cap: null,
        notes: "Vídeo de lançamento",
      },
    ],
    coupons: [{ code: "STUDIOLAR", activeFrom: "2026-05-10", activeUntil: "2026-08-10" }],
  },
];
