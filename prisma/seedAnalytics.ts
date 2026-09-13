/**
 * Deterministic generator for the analytics facts of "Loja Aurora"
 * (products, customers, orders, traffic, ad spend, cost rules).
 *
 * The dataset is calibrated so the aggregates roughly reconcile with the
 * headline fixtures the dashboard already shows: monthly paid revenue follows
 * `monthlySeries` (R$ 487.300 in ago/26), ticket ~R$ 268, conversion ~1,84%,
 * CMV ~48,6%, media spend ~R$ 96.400/month at ROAS ~3,1x, CAC ~R$ 62.
 *
 * Same seed -> same rows, so `npm run db:seed` never drifts between machines.
 */
import type {
  AdPlatform,
  BusinessUnit,
  CostCategory,
  CostFrequency,
  FinancialStatus,
  ProcessingMethod,
  PrismaClient,
  SalesPlatform,
} from "../src/generated/prisma/client.ts";

import { monthlySeries } from "../src/modules/dashboard/contract.ts";

// ---------------------------------------------------------------------------
// Random helpers (mulberry32 - small, fast, deterministic)
// ---------------------------------------------------------------------------

function createRng(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    float: (min: number, max: number) => min + next() * (max - min),
    /** Uniform noise around 1, e.g. spread 0.1 -> [0.9, 1.1]. */
    noise: (spread: number) => 1 + (next() * 2 - 1) * spread,
    pick: <T>(list: readonly T[]): T => list[Math.floor(next() * list.length)]!,
    weighted: <T>(entries: readonly (readonly [T, number])[]): T => {
      const total = entries.reduce((sum, [, w]) => sum + w, 0);
      let roll = next() * total;
      for (const [value, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return value;
      }
      return entries[entries.length - 1]![0];
    },
    chance: (p: number) => next() < p,
  };
}

type Rng = ReturnType<typeof createRng>;

// ---------------------------------------------------------------------------
// Calibration constants
// ---------------------------------------------------------------------------

/** Last day with data. Matches the "today" the prototype narrates. */
const TODAY = new Date(Date.UTC(2026, 8, 10));
const FIRST_DAY = new Date(Date.UTC(2025, 2, 1));

/** Monthly paid-revenue targets, extended backwards before the fixture window. */
const REVENUE_TARGETS: Record<string, number> = {
  "2025-03": 298000,
  "2025-04": 305000,
  "2025-05": 318000,
  "2025-06": 312000,
  "2025-07": 326000,
  "2025-08": 334000,
  ...Object.fromEntries(
    monthlySeries.map((s) => {
      const [name = "", yy = "0"] = s.month.split("/");
      const months = [
        "jan",
        "fev",
        "mar",
        "abr",
        "mai",
        "jun",
        "jul",
        "ago",
        "set",
        "out",
        "nov",
        "dez",
      ];
      const month = String(months.indexOf(name) + 1).padStart(2, "0");
      return [`20${yy}-${month}`, s.revenue];
    }),
  ),
  // Partial September at August's daily pace.
  "2026-09": Math.round((487300 / 31) * 10),
};

const TARGET_AOV = 268;
const CONVERSION_RATE = 0.0184;
const MEDIA_SPEND_SHARE = 0.198; // of paid revenue
const REPEAT_ORDER_SHARE = 0.145;

const UF_WEIGHTS: readonly (readonly [string, number])[] = [
  ["SP", 34],
  ["RJ", 12],
  ["MG", 10],
  ["PR", 6],
  ["RS", 6],
  ["SC", 4],
  ["BA", 5],
  ["PE", 3],
  ["GO", 3],
  ["DF", 3],
  ["ES", 2],
  ["CE", 2],
  ["PA", 1.5],
  ["MT", 1.2],
  ["MS", 1],
  ["PB", 0.8],
  ["RN", 0.8],
  ["AM", 0.7],
  ["MA", 0.7],
  ["AL", 0.5],
  ["SE", 0.4],
  ["PI", 0.4],
  ["TO", 0.3],
  ["RO", 0.3],
  ["AC", 0.1],
  ["AP", 0.1],
  ["RR", 0.1],
];

const CITIES: Record<string, readonly string[]> = {
  SP: ["São Paulo", "Campinas", "Santos", "Ribeirão Preto", "Sorocaba"],
  RJ: ["Rio de Janeiro", "Niterói", "Petrópolis"],
  MG: ["Belo Horizonte", "Uberlândia", "Juiz de Fora"],
  PR: ["Curitiba", "Londrina", "Maringá"],
  RS: ["Porto Alegre", "Caxias do Sul"],
  SC: ["Florianópolis", "Joinville", "Blumenau"],
  BA: ["Salvador", "Feira de Santana"],
  PE: ["Recife", "Caruaru"],
  GO: ["Goiânia", "Anápolis"],
  DF: ["Brasília"],
  ES: ["Vitória", "Vila Velha"],
  CE: ["Fortaleza"],
  PA: ["Belém"],
  MT: ["Cuiabá"],
  MS: ["Campo Grande"],
  PB: ["João Pessoa"],
  RN: ["Natal"],
  AM: ["Manaus"],
  MA: ["São Luís"],
  AL: ["Maceió"],
  SE: ["Aracaju"],
  PI: ["Teresina"],
  TO: ["Palmas"],
  RO: ["Porto Velho"],
  AC: ["Rio Branco"],
  AP: ["Macapá"],
  RR: ["Boa Vista"],
};

const DDD: Record<string, string> = {
  SP: "11",
  RJ: "21",
  MG: "31",
  PR: "41",
  RS: "51",
  SC: "48",
  BA: "71",
  PE: "81",
  GO: "62",
  DF: "61",
  ES: "27",
  CE: "85",
  PA: "91",
  MT: "65",
  MS: "67",
  PB: "83",
  RN: "84",
  AM: "92",
  MA: "98",
  AL: "82",
  SE: "79",
  PI: "86",
  TO: "63",
  RO: "69",
  AC: "68",
  AP: "96",
  RR: "95",
};

const FIRST_NAMES = [
  "Ana",
  "Beatriz",
  "Bruno",
  "Camila",
  "Carlos",
  "Daniela",
  "Diego",
  "Eduardo",
  "Fernanda",
  "Gabriel",
  "Gustavo",
  "Helena",
  "Isabela",
  "João",
  "Juliana",
  "Larissa",
  "Leonardo",
  "Letícia",
  "Lucas",
  "Luiza",
  "Marcos",
  "Mariana",
  "Mateus",
  "Natália",
  "Patrícia",
  "Paulo",
  "Rafael",
  "Renata",
  "Rodrigo",
  "Sofia",
  "Thiago",
  "Vanessa",
  "Vinícius",
  "Vitória",
];
const LAST_NAMES = [
  "Almeida",
  "Araújo",
  "Barbosa",
  "Cardoso",
  "Carvalho",
  "Castro",
  "Costa",
  "Dias",
  "Ferreira",
  "Gomes",
  "Lima",
  "Martins",
  "Melo",
  "Mendes",
  "Moreira",
  "Nascimento",
  "Oliveira",
  "Pereira",
  "Ramos",
  "Ribeiro",
  "Rocha",
  "Santos",
  "Silva",
  "Souza",
  "Teixeira",
  "Vieira",
];

type TrafficChannel = {
  source: string;
  medium: string;
  /** Share of paid orders attributed to the channel. */
  orderShare: number;
  /** Share of sessions - organic/direct bring more visits per order. */
  sessionShare: number;
  campaigns: readonly string[];
};

const ECOMMERCE_CHANNELS: readonly TrafficChannel[] = [
  {
    source: "meta",
    medium: "paid-social",
    orderShare: 46,
    sessionShare: 38,
    campaigns: [
      "prospeccao-interesses",
      "remarketing-carrinho",
      "catalogo-dinamico",
      "lancamento-inverno",
    ],
  },
  {
    source: "google",
    medium: "cpc",
    orderShare: 16,
    sessionShare: 14,
    campaigns: ["search-marca", "search-categoria", "pmax-catalogo"],
  },
  { source: "google", medium: "organic", orderShare: 12, sessionShare: 20, campaigns: [] },
  { source: "(direct)", medium: "(none)", orderShare: 11, sessionShare: 13, campaigns: [] },
  {
    source: "email",
    medium: "crm",
    orderShare: 6,
    sessionShare: 4,
    campaigns: ["newsletter-semanal", "pos-compra", "recuperacao-carrinho"],
  },
  { source: "instagram", medium: "social", orderShare: 5, sessionShare: 7, campaigns: [] },
  {
    source: "tiktok",
    medium: "paid-social",
    orderShare: 2,
    sessionShare: 2.5,
    campaigns: ["video-produto"],
  },
  { source: "whatsapp", medium: "referral", orderShare: 2, sessionShare: 1.5, campaigns: [] },
];

const GATEWAYS: readonly (readonly [string, number])[] = [
  ["Pagar.me", 60],
  ["Mercado Pago", 40],
];
const METHODS: readonly (readonly [ProcessingMethod, number])[] = [
  ["CREDIT_CARD", 60],
  ["PIX", 32],
  ["BOLETO", 8],
];
const STATUS_BY_METHOD: Record<ProcessingMethod, readonly (readonly [FinancialStatus, number])[]> =
  {
    CREDIT_CARD: [
      ["PAID", 89],
      ["PENDING", 2],
      ["AUTHORIZED", 1],
      ["CANCELLED", 5],
      ["REFUNDED", 3],
    ],
    PIX: [
      ["PAID", 95],
      ["PENDING", 3],
      ["CANCELLED", 2],
    ],
    BOLETO: [
      ["PAID", 68],
      ["PENDING", 9],
      ["CANCELLED", 23],
    ],
  };

const COUPONS: readonly (readonly [string, number, number])[] = [
  // code, share among couponed orders, discount rate
  ["BEMVINDO10", 34, 0.1],
  ["AURORA15", 22, 0.15],
  ["INSTA10", 16, 0.1],
  ["VOLTA20", 12, 0.2],
  ["FRETEGRATIS", 10, 0],
  ["AMIGA15", 6, 0.15],
];

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

type CatalogEntry = {
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  collection: string | null;
  basePrice: number;
  variants: readonly string[] | null;
};

const CATALOG: readonly CatalogEntry[] = [
  // Decoração
  {
    name: "Vaso cerâmica Aurora",
    category: "Decoração",
    subcategory: "Vasos",
    brand: "Aurora",
    collection: "Essenciais",
    basePrice: 129,
    variants: ["Areia", "Terracota", "Verde-musgo"],
  },
  {
    name: "Quadro botânico emoldurado",
    category: "Decoração",
    subcategory: "Quadros",
    brand: "Aurora",
    collection: "Botânica",
    basePrice: 189,
    variants: ["30×40", "50×70"],
  },
  {
    name: "Espelho redondo couro",
    category: "Decoração",
    subcategory: "Espelhos",
    brand: "Aurora",
    collection: null,
    basePrice: 349,
    variants: ["50 cm", "70 cm"],
  },
  {
    name: "Manta tricot",
    category: "Decoração",
    subcategory: "Mantas",
    brand: "Aurora",
    collection: "Inverno",
    basePrice: 219,
    variants: ["Off-white", "Cinza", "Mostarda"],
  },
  {
    name: "Almofada linho",
    category: "Decoração",
    subcategory: "Almofadas",
    brand: "Aurora",
    collection: "Essenciais",
    basePrice: 89,
    variants: ["Areia", "Verde", "Terracota", "Azul"],
  },
  {
    name: "Vela aromática 200 g",
    category: "Decoração",
    subcategory: "Velas",
    brand: "Lume",
    collection: null,
    basePrice: 79,
    variants: ["Lavanda", "Figo", "Cedro"],
  },
  {
    name: "Difusor de varetas",
    category: "Decoração",
    subcategory: "Aromas",
    brand: "Lume",
    collection: null,
    basePrice: 98,
    variants: ["Bergamota", "Vanilla"],
  },
  {
    name: "Cesto fibra natural",
    category: "Decoração",
    subcategory: "Cestos",
    brand: "Aurora",
    collection: "Botânica",
    basePrice: 149,
    variants: ["P", "M", "G"],
  },
  {
    name: "Relógio de parede minimal",
    category: "Decoração",
    subcategory: "Relógios",
    brand: "Nórdica",
    collection: null,
    basePrice: 179,
    variants: null,
  },
  {
    name: "Tapete kilim 1,5 × 2 m",
    category: "Decoração",
    subcategory: "Tapetes",
    brand: "Aurora",
    collection: null,
    basePrice: 690,
    variants: null,
  },
  {
    name: "Escultura abstrata",
    category: "Decoração",
    subcategory: "Objetos",
    brand: "Nórdica",
    collection: null,
    basePrice: 159,
    variants: null,
  },
  {
    name: "Porta-retratos madeira",
    category: "Decoração",
    subcategory: "Objetos",
    brand: "Aurora",
    collection: "Essenciais",
    basePrice: 59,
    variants: ["10×15", "13×18"],
  },
  {
    name: "Cachepot metal",
    category: "Decoração",
    subcategory: "Vasos",
    brand: "Nórdica",
    collection: "Botânica",
    basePrice: 74,
    variants: ["Preto", "Dourado"],
  },
  {
    name: "Bandeja espelhada",
    category: "Decoração",
    subcategory: "Objetos",
    brand: "Nórdica",
    collection: null,
    basePrice: 139,
    variants: null,
  },
  {
    name: "Suporte para plantas",
    category: "Decoração",
    subcategory: "Vasos",
    brand: "Aurora",
    collection: "Botânica",
    basePrice: 119,
    variants: ["Baixo", "Alto"],
  },
  {
    name: "Cortina linho 2,6 m",
    category: "Decoração",
    subcategory: "Cortinas",
    brand: "Aurora",
    collection: null,
    basePrice: 389,
    variants: ["Off-white", "Areia"],
  },
  // Cama e banho
  {
    name: "Jogo de lençol percal 200 fios",
    category: "Cama e banho",
    subcategory: "Lençóis",
    brand: "Aurora",
    collection: "Essenciais",
    basePrice: 299,
    variants: ["Solteiro", "Casal", "Queen", "King"],
  },
  {
    name: "Edredom dupla face",
    category: "Cama e banho",
    subcategory: "Edredons",
    brand: "Aurora",
    collection: "Inverno",
    basePrice: 379,
    variants: ["Casal", "Queen", "King"],
  },
  {
    name: "Toalha de banho felpuda",
    category: "Cama e banho",
    subcategory: "Toalhas",
    brand: "Aurora",
    collection: null,
    basePrice: 69,
    variants: ["Branco", "Areia", "Verde", "Grafite"],
  },
  {
    name: "Roupão atoalhado",
    category: "Cama e banho",
    subcategory: "Roupões",
    brand: "Aurora",
    collection: null,
    basePrice: 219,
    variants: ["M", "G"],
  },
  {
    name: "Travesseiro viscoelástico",
    category: "Cama e banho",
    subcategory: "Travesseiros",
    brand: "Dormire",
    collection: null,
    basePrice: 189,
    variants: null,
  },
  {
    name: "Protetor de colchão",
    category: "Cama e banho",
    subcategory: "Protetores",
    brand: "Dormire",
    collection: null,
    basePrice: 149,
    variants: ["Casal", "Queen"],
  },
  {
    name: "Tapete de banho algodão",
    category: "Cama e banho",
    subcategory: "Tapetes",
    brand: "Aurora",
    collection: null,
    basePrice: 79,
    variants: ["Branco", "Areia"],
  },
  {
    name: "Kit toalhas de rosto (3)",
    category: "Cama e banho",
    subcategory: "Toalhas",
    brand: "Aurora",
    collection: null,
    basePrice: 99,
    variants: null,
  },
  {
    name: "Cobertor microfibra",
    category: "Cama e banho",
    subcategory: "Cobertores",
    brand: "Dormire",
    collection: "Inverno",
    basePrice: 169,
    variants: ["Casal", "Queen"],
  },
  {
    name: "Fronha cetim (par)",
    category: "Cama e banho",
    subcategory: "Fronhas",
    brand: "Aurora",
    collection: null,
    basePrice: 89,
    variants: ["Champagne", "Preto"],
  },
  {
    name: "Colcha matelassê",
    category: "Cama e banho",
    subcategory: "Colchas",
    brand: "Aurora",
    collection: null,
    basePrice: 329,
    variants: ["Casal", "Queen"],
  },
  {
    name: "Saia para cama box",
    category: "Cama e banho",
    subcategory: "Lençóis",
    brand: "Aurora",
    collection: null,
    basePrice: 129,
    variants: ["Casal", "Queen"],
  },
  // Cozinha e mesa
  {
    name: "Jogo de pratos stoneware (6)",
    category: "Cozinha e mesa",
    subcategory: "Louças",
    brand: "Aurora",
    collection: "Mesa posta",
    basePrice: 289,
    variants: ["Areia", "Verde-sálvia"],
  },
  {
    name: "Conjunto de taças cristal (6)",
    category: "Cozinha e mesa",
    subcategory: "Taças",
    brand: "Vitrum",
    collection: "Mesa posta",
    basePrice: 199,
    variants: null,
  },
  {
    name: "Panela antiaderente 24 cm",
    category: "Cozinha e mesa",
    subcategory: "Panelas",
    brand: "Chef&Co",
    collection: null,
    basePrice: 229,
    variants: null,
  },
  {
    name: "Tábua de corte bambu",
    category: "Cozinha e mesa",
    subcategory: "Utensílios",
    brand: "Chef&Co",
    collection: null,
    basePrice: 89,
    variants: ["M", "G"],
  },
  {
    name: "Jogo americano linho (4)",
    category: "Cozinha e mesa",
    subcategory: "Mesa",
    brand: "Aurora",
    collection: "Mesa posta",
    basePrice: 119,
    variants: ["Cru", "Verde"],
  },
  {
    name: "Garrafa térmica inox 1 L",
    category: "Cozinha e mesa",
    subcategory: "Utensílios",
    brand: "Chef&Co",
    collection: null,
    basePrice: 149,
    variants: ["Preto", "Inox"],
  },
  {
    name: "Caneca cerâmica artesanal",
    category: "Cozinha e mesa",
    subcategory: "Louças",
    brand: "Aurora",
    collection: null,
    basePrice: 49,
    variants: ["Areia", "Azul", "Verde"],
  },
  {
    name: "Faqueiro 24 peças",
    category: "Cozinha e mesa",
    subcategory: "Talheres",
    brand: "Chef&Co",
    collection: "Mesa posta",
    basePrice: 259,
    variants: ["Inox", "Preto fosco"],
  },
  {
    name: "Pote hermético vidro (3)",
    category: "Cozinha e mesa",
    subcategory: "Organização",
    brand: "Vitrum",
    collection: null,
    basePrice: 109,
    variants: null,
  },
  {
    name: "Jarra de vidro 1,5 L",
    category: "Cozinha e mesa",
    subcategory: "Louças",
    brand: "Vitrum",
    collection: null,
    basePrice: 79,
    variants: null,
  },
  {
    name: "Avental algodão",
    category: "Cozinha e mesa",
    subcategory: "Têxtil",
    brand: "Aurora",
    collection: null,
    basePrice: 69,
    variants: ["Cru", "Grafite"],
  },
  {
    name: "Petisqueira cerâmica",
    category: "Cozinha e mesa",
    subcategory: "Louças",
    brand: "Aurora",
    collection: "Mesa posta",
    basePrice: 139,
    variants: null,
  },
  {
    name: "Frigideira ferro 26 cm",
    category: "Cozinha e mesa",
    subcategory: "Panelas",
    brand: "Chef&Co",
    collection: null,
    basePrice: 189,
    variants: null,
  },
  {
    name: "Kit panos de prato (3)",
    category: "Cozinha e mesa",
    subcategory: "Têxtil",
    brand: "Aurora",
    collection: null,
    basePrice: 59,
    variants: null,
  },
  // Iluminação
  {
    name: "Luminária de mesa cúpula linho",
    category: "Iluminação",
    subcategory: "Luminárias",
    brand: "Nórdica",
    collection: null,
    basePrice: 249,
    variants: ["Off-white", "Preto"],
  },
  {
    name: "Pendente rattan",
    category: "Iluminação",
    subcategory: "Pendentes",
    brand: "Aurora",
    collection: "Botânica",
    basePrice: 319,
    variants: ["40 cm", "55 cm"],
  },
  {
    name: "Abajur cerâmica",
    category: "Iluminação",
    subcategory: "Luminárias",
    brand: "Aurora",
    collection: null,
    basePrice: 279,
    variants: null,
  },
  {
    name: "Fita LED 5 m",
    category: "Iluminação",
    subcategory: "LED",
    brand: "Nórdica",
    collection: null,
    basePrice: 89,
    variants: ["Quente", "Neutra"],
  },
  {
    name: "Luminária de chão arco",
    category: "Iluminação",
    subcategory: "Luminárias",
    brand: "Nórdica",
    collection: null,
    basePrice: 590,
    variants: null,
  },
  {
    name: "Arandela madeira",
    category: "Iluminação",
    subcategory: "Arandelas",
    brand: "Aurora",
    collection: null,
    basePrice: 169,
    variants: null,
  },
  {
    name: "Lâmpada filamento (2)",
    category: "Iluminação",
    subcategory: "LED",
    brand: "Nórdica",
    collection: null,
    basePrice: 59,
    variants: null,
  },
  {
    name: "Cordão de luz 10 m",
    category: "Iluminação",
    subcategory: "LED",
    brand: "Nórdica",
    collection: null,
    basePrice: 119,
    variants: null,
  },
  // Organização
  {
    name: "Caixa organizadora tecido (3)",
    category: "Organização",
    subcategory: "Caixas",
    brand: "Aurora",
    collection: null,
    basePrice: 99,
    variants: ["Cinza", "Areia"],
  },
  {
    name: "Cabideiro de parede",
    category: "Organização",
    subcategory: "Cabideiros",
    brand: "Nórdica",
    collection: null,
    basePrice: 129,
    variants: null,
  },
  {
    name: "Prateleira flutuante",
    category: "Organização",
    subcategory: "Prateleiras",
    brand: "Nórdica",
    collection: null,
    basePrice: 149,
    variants: ["60 cm", "90 cm"],
  },
  {
    name: "Cesto de roupa bambu",
    category: "Organização",
    subcategory: "Cestos",
    brand: "Aurora",
    collection: "Botânica",
    basePrice: 189,
    variants: null,
  },
  {
    name: "Organizador de gavetas (6)",
    category: "Organização",
    subcategory: "Gavetas",
    brand: "Aurora",
    collection: null,
    basePrice: 79,
    variants: null,
  },
  {
    name: "Carrinho auxiliar 3 níveis",
    category: "Organização",
    subcategory: "Carrinhos",
    brand: "Nórdica",
    collection: null,
    basePrice: 219,
    variants: ["Preto", "Branco"],
  },
  {
    name: "Sapateira 5 níveis",
    category: "Organização",
    subcategory: "Sapateiras",
    brand: "Nórdica",
    collection: null,
    basePrice: 169,
    variants: null,
  },
  {
    name: "Cabides veludo (20)",
    category: "Organização",
    subcategory: "Cabideiros",
    brand: "Aurora",
    collection: null,
    basePrice: 69,
    variants: ["Cinza", "Preto"],
  },
  {
    name: "Estante modular 4 nichos",
    category: "Organização",
    subcategory: "Estantes",
    brand: "Nórdica",
    collection: null,
    basePrice: 449,
    variants: null,
  },
  {
    name: "Porta-joias madeira",
    category: "Organização",
    subcategory: "Caixas",
    brand: "Aurora",
    collection: null,
    basePrice: 139,
    variants: null,
  },
  // Móveis pequenos
  {
    name: "Mesa lateral madeira",
    category: "Móveis",
    subcategory: "Mesas",
    brand: "Nórdica",
    collection: null,
    basePrice: 389,
    variants: ["Natural", "Preto"],
  },
  {
    name: "Banqueta alta",
    category: "Móveis",
    subcategory: "Assentos",
    brand: "Nórdica",
    collection: null,
    basePrice: 329,
    variants: null,
  },
  {
    name: "Puff redondo",
    category: "Móveis",
    subcategory: "Assentos",
    brand: "Aurora",
    collection: null,
    basePrice: 279,
    variants: ["Verde", "Areia", "Terracota"],
  },
  {
    name: "Poltrona linho",
    category: "Móveis",
    subcategory: "Assentos",
    brand: "Aurora",
    collection: null,
    basePrice: 890,
    variants: ["Off-white", "Verde"],
  },
  {
    name: "Aparador ripado",
    category: "Móveis",
    subcategory: "Aparadores",
    brand: "Nórdica",
    collection: null,
    basePrice: 790,
    variants: null,
  },
  {
    name: "Criado-mudo",
    category: "Móveis",
    subcategory: "Mesas",
    brand: "Nórdica",
    collection: null,
    basePrice: 349,
    variants: ["Natural", "Preto"],
  },
  {
    name: "Cadeira de jantar",
    category: "Móveis",
    subcategory: "Assentos",
    brand: "Nórdica",
    collection: "Mesa posta",
    basePrice: 299,
    variants: null,
  },
  {
    name: "Mesa de centro redonda",
    category: "Móveis",
    subcategory: "Mesas",
    brand: "Nórdica",
    collection: null,
    basePrice: 490,
    variants: null,
  },
  // Presentes / kits
  {
    name: "Kit presente casa nova",
    category: "Presentes",
    subcategory: "Kits",
    brand: "Aurora",
    collection: null,
    basePrice: 249,
    variants: null,
  },
  {
    name: "Kit spa relax",
    category: "Presentes",
    subcategory: "Kits",
    brand: "Lume",
    collection: null,
    basePrice: 179,
    variants: null,
  },
  {
    name: "Cartão-presente",
    category: "Presentes",
    subcategory: "Vale",
    brand: "Aurora",
    collection: null,
    basePrice: 100,
    variants: ["R$ 100", "R$ 200", "R$ 300"],
  },
  {
    name: "Kit café da manhã",
    category: "Presentes",
    subcategory: "Kits",
    brand: "Aurora",
    collection: "Mesa posta",
    basePrice: 159,
    variants: null,
  },
  {
    name: "Kit velas trio",
    category: "Presentes",
    subcategory: "Kits",
    brand: "Lume",
    collection: null,
    basePrice: 149,
    variants: null,
  },
  {
    name: "Kit banho premium",
    category: "Presentes",
    subcategory: "Kits",
    brand: "Aurora",
    collection: null,
    basePrice: 229,
    variants: null,
  },
  {
    name: "Kit mesa posta",
    category: "Presentes",
    subcategory: "Kits",
    brand: "Aurora",
    collection: "Mesa posta",
    basePrice: 389,
    variants: null,
  },
  {
    name: "Kit jardim interno",
    category: "Presentes",
    subcategory: "Kits",
    brand: "Aurora",
    collection: "Botânica",
    basePrice: 199,
    variants: null,
  },
  {
    name: "Kit organização closet",
    category: "Presentes",
    subcategory: "Kits",
    brand: "Aurora",
    collection: null,
    basePrice: 169,
    variants: null,
  },
  {
    name: "Kit quarto aconchego",
    category: "Presentes",
    subcategory: "Kits",
    brand: "Aurora",
    collection: "Inverno",
    basePrice: 299,
    variants: null,
  },
];

// ---------------------------------------------------------------------------
// Generated row shapes (mirror the Prisma models; ids are assigned here so
// the dataset is fully deterministic)
// ---------------------------------------------------------------------------

type ProductRow = {
  id: string;
  clientId: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  collection: string | null;
};

type VariantRow = {
  id: string;
  productId: string;
  sku: string;
  name: string | null;
  price: number;
  cost: number;
  stockQty: number;
  lastSaleAt: Date | null;
  /** Generator-only: relative sales weight. */
  weight: number;
  /** Generator-only: units sold in the last 90 days, to size stock. */
  unitsLast90: number;
};

type CustomerRow = {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  acquisitionSource: string;
  firstOrderAt: Date | null;
  lastOrderAt: Date | null;
  ordersCount: number;
  totalSpent: number;
  daysSinceLastPurchase: number | null;
  rScore: number | null;
  fScore: number | null;
  mScore: number | null;
  rfmSegment: string | null;
};

type OrderRow = {
  id: string;
  clientId: string;
  customerId: string;
  number: string;
  placedAt: Date;
  paidAt: Date | null;
  salesPlatform: SalesPlatform;
  channel: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  financialStatus: FinancialStatus;
  paymentGateway: string;
  processingMethod: ProcessingMethod;
  productRevenue: number;
  shippingRevenue: number;
  totalDiscounts: number;
  totalPrice: number;
  discountCodes: string[];
  country: string;
  province: string;
  city: string;
  orderNumberForCustomer: number;
  itemsCount: number;
};

type OrderItemRow = {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
};

type TrafficRow = {
  clientId: string;
  date: Date;
  source: string;
  medium: string;
  sessions: number;
  users: number;
  newUsers: number;
  viewItem: number;
  addToCart: number;
  beginCheckout: number;
};

type AdSpendRow = {
  clientId: string;
  date: Date;
  platform: AdPlatform;
  campaignId: string;
  campaignName: string;
  adsetId: string;
  adsetName: string;
  adId: string;
  adName: string;
  spend: number;
  platformFee: number;
  impressions: number;
  clicks: number;
  conversions: number;
  attributedRevenue: number;
};

type CostRow = {
  clientId: string;
  name: string;
  description: string | null;
  businessUnit: BusinessUnit;
  category: CostCategory;
  subcategory: string;
  frequency: CostFrequency;
  value: number;
  startDate: Date;
  endDate: Date | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const round2 = (n: number) => Math.round(n * 100) / 100;
const pad = (n: number, width: number) => String(n).padStart(width, "0");
const monthKey = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1, 2)}`;
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);
const daysBetween = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / 86_400_000);

/** Seasonality: weekday shape, Black Friday, Christmas run-up, mid-year sale. */
function dayWeight(d: Date) {
  const dow = d.getUTCDay();
  let w = [0.78, 1.06, 1.08, 1.02, 1.0, 1.0, 0.86][dow]!;
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  if (m === 10) {
    // Black Friday week: the last Friday of November and the days around it.
    const lastDay = new Date(Date.UTC(d.getUTCFullYear(), 11, 0));
    const lastFriday = lastDay.getUTCDate() - ((lastDay.getUTCDay() + 2) % 7);
    const dist = day - lastFriday;
    if (dist === 0) w *= 3.2;
    else if (dist >= -4 && dist < 0) w *= 1.5;
    else if (dist > 0 && dist <= 3) w *= 1.7;
  }
  if (m === 11) w *= day <= 20 ? 1.25 : 0.7;
  if (m === 4 && day >= 1 && day <= 10) w *= 1.15; // Dia das Mães
  return w;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

function buildCatalog(rng: Rng, clientId: string) {
  const products: ProductRow[] = [];
  const variants: VariantRow[] = [];
  let skuCounter = 100;

  CATALOG.forEach((entry, index) => {
    const productId = `prod_${pad(index + 1, 3)}`;
    products.push({
      id: productId,
      clientId,
      name: entry.name,
      category: entry.category,
      subcategory: entry.subcategory,
      brand: entry.brand,
      collection: entry.collection,
    });

    // Zipf-ish popularity so the ABC curve has a real head and tail.
    const popularity = 1 / Math.pow(index * 0.37 + 1, 0.85);
    const names = entry.variants ?? [null];
    names.forEach((variantName, vi) => {
      skuCounter += 1;
      const priceJitter =
        variantName && /G|King|Queen|70|90|55|300|200/.test(variantName) ? 1.15 : 1;
      const price = Math.round(entry.basePrice * priceJitter * rng.noise(0.04));
      variants.push({
        id: `var_${pad(skuCounter, 4)}`,
        productId,
        sku: `AUR-${skuCounter}`,
        name: variantName,
        price,
        cost: round2(price * rng.float(0.42, 0.56)),
        stockQty: 0,
        lastSaleAt: null,
        // Cheaper items sell more often, which is what keeps the ticket near R$ 268.
        weight:
          popularity * Math.pow(120 / price, 0.9) * (vi === 0 ? 1 : 0.7) * rng.float(0.7, 1.3),
        unitsLast90: 0,
      });
    });
  });

  return { products, variants };
}

function buildOrders(rng: Rng, clientId: string, variants: VariantRow[]) {
  const products = new Map<string, VariantRow[]>();
  for (const v of variants) {
    const list = products.get(v.productId) ?? [];
    list.push(v);
    products.set(v.productId, list);
  }
  const variantWeights = variants.map((v) => [v, v.weight] as const);

  const customers: CustomerRow[] = [];
  const customerIndex = new Map<string, CustomerRow>();
  const orders: OrderRow[] = [];
  const items: OrderItemRow[] = [];
  const paidOrdersByCustomer = new Map<string, number>();
  const allOrdersByCustomer = new Map<string, number>();
  const usedEmails = new Set<string>();

  let orderCounter = 10_000;
  let itemCounter = 0;

  // Daily paid-revenue targets per month, normalized on seasonality weights.
  const days: Date[] = [];
  for (let d = FIRST_DAY; d <= TODAY; d = addDays(d, 1)) days.push(d);
  const monthWeightSum = new Map<string, number>();
  const dayWeights = days.map((d) => {
    const w = dayWeight(d) * rng.noise(0.12);
    monthWeightSum.set(monthKey(d), (monthWeightSum.get(monthKey(d)) ?? 0) + w);
    return w;
  });

  function newCustomer(placedAt: Date, source: string): CustomerRow {
    const province = rng.weighted(UF_WEIGHTS);
    const city = rng.pick(CITIES[province]!);
    const first = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    let email = `${slugify(first)}.${slugify(last)}@exemplo.com`;
    let n = 1;
    while (usedEmails.has(email)) {
      n += 1;
      email = `${slugify(first)}.${slugify(last)}${n}@exemplo.com`;
    }
    usedEmails.add(email);
    const customer: CustomerRow = {
      id: `cust_${pad(customers.length + 1, 6)}`,
      clientId,
      name: `${first} ${last}`,
      email,
      phone: `+55 ${DDD[province]} 9${rng.int(6000, 9999)}-${pad(rng.int(0, 9999), 4)}`,
      city,
      province,
      acquisitionSource: source,
      firstOrderAt: null,
      lastOrderAt: null,
      ordersCount: 0,
      totalSpent: 0,
      daysSinceLastPurchase: null,
      rScore: null,
      fScore: null,
      mScore: null,
      rfmSegment: null,
    };
    customers.push(customer);
    customerIndex.set(customer.id, customer);
    return customer;
  }

  function pickReturningCustomer(placedAt: Date): CustomerRow | null {
    if (customers.length < 200) return null;
    // Recent buyers are far more likely to come back; sample from the tail.
    const window = Math.min(customers.length, 4000);
    const start = customers.length - window;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const candidate = customers[start + Math.floor(Math.pow(rng.next(), 0.6) * window)]!;
      if (candidate.lastOrderAt && daysBetween(candidate.lastOrderAt, placedAt) >= 3)
        return candidate;
    }
    return null;
  }

  days.forEach((day, dayIndex) => {
    const key = monthKey(day);
    const target = REVENUE_TARGETS[key] ?? 0;
    const dailyTarget = (target * dayWeights[dayIndex]!) / (monthWeightSum.get(key) ?? 1);
    let paidSoFar = 0;

    while (paidSoFar < dailyTarget) {
      orderCounter += 1;
      const placedAt = new Date(day.getTime() + rng.int(8 * 60, 23 * 60 + 40) * 60_000);

      // Channel and attribution.
      const marketplace = rng.chance(0.2);
      const marketplaceName = marketplace
        ? rng.weighted([
            ["Mercado Livre", 65],
            ["Shopee", 35],
          ] as const)
        : null;
      const channel = marketplace
        ? ECOMMERCE_CHANNELS[0]! // placeholder, replaced below
        : rng.weighted(ECOMMERCE_CHANNELS.map((c) => [c, c.orderShare] as const));
      const utmSource = marketplace ? null : channel.source;
      const utmMedium = marketplace ? null : channel.medium;
      const utmCampaign =
        marketplace || channel.campaigns.length === 0 ? null : rng.pick(channel.campaigns);
      const attributionSource = marketplace ? slugify(marketplaceName!) : channel.source;

      // Customer: returning or new.
      const returning = rng.chance(REPEAT_ORDER_SHARE) ? pickReturningCustomer(placedAt) : null;
      const customer = returning ?? newCustomer(placedAt, attributionSource);
      const orderNumberForCustomer = (allOrdersByCustomer.get(customer.id) ?? 0) + 1;
      allOrdersByCustomer.set(customer.id, orderNumberForCustomer);

      // Items.
      const itemCount = rng.weighted([
        [1, 52],
        [2, 29],
        [3, 12],
        [4, 5],
        [5, 2],
      ] as const);
      const chosen = new Map<string, { variant: VariantRow; quantity: number }>();
      for (let i = 0; i < itemCount; i += 1) {
        const variant = rng.weighted(variantWeights);
        const existing = chosen.get(variant.id);
        if (existing) existing.quantity += 1;
        else chosen.set(variant.id, { variant, quantity: 1 });
      }
      let productRevenue = 0;
      let unitsInOrder = 0;
      const orderId = `ord_${pad(orderCounter, 6)}`;
      for (const { variant, quantity } of chosen.values()) {
        productRevenue += variant.price * quantity;
        unitsInOrder += quantity;
        itemCounter += 1;
        items.push({
          id: `item_${pad(itemCounter, 7)}`,
          orderId,
          productId: variant.productId,
          variantId: variant.id,
          sku: variant.sku,
          quantity,
          unitPrice: variant.price,
          unitCost: variant.cost,
        });
      }

      // Discounts.
      const discountCodes: string[] = [];
      let totalDiscounts = 0;
      const couponChance = day.getUTCMonth() === 10 ? 0.4 : 0.22;
      if (!marketplace && rng.chance(couponChance)) {
        const coupon = rng.weighted(COUPONS.map((c) => [c, c[1]] as const));
        discountCodes.push(day.getUTCMonth() === 10 && rng.chance(0.5) ? "BF30" : coupon[0]);
        const rate = discountCodes[0] === "BF30" ? 0.3 : coupon[2];
        totalDiscounts = round2(productRevenue * rate);
      }

      // Shipping: free on promos/coupon FRETEGRATIS or big carts, else by region.
      const province = customer.province;
      const farRegion = ["AM", "PA", "AC", "AP", "RR", "RO", "TO", "MA", "PI"].includes(province);
      const freeShipping =
        discountCodes.includes("FRETEGRATIS") ||
        productRevenue >= 399 ||
        (marketplace && rng.chance(0.5));
      const shippingRevenue = freeShipping
        ? 0
        : round2(rng.float(farRegion ? 24 : 12, farRegion ? 42 : 29));

      // Payment.
      const processingMethod = marketplace
        ? rng.weighted([
            ["CREDIT_CARD", 70],
            ["PIX", 28],
            ["BOLETO", 2],
          ] as const)
        : rng.weighted(METHODS);
      const paymentGateway = marketplace
        ? marketplaceName === "Shopee"
          ? "ShopeePay"
          : "Mercado Pago"
        : rng.weighted(GATEWAYS);
      const financialStatus = rng.weighted(STATUS_BY_METHOD[processingMethod]);
      const totalPrice = round2(productRevenue + shippingRevenue - totalDiscounts);
      const paid = financialStatus === "PAID" || financialStatus === "REFUNDED";
      const paidAt = paid
        ? new Date(
            placedAt.getTime() +
              (processingMethod === "BOLETO"
                ? rng.int(1, 3) * 86_400_000
                : rng.int(1, 40) * 60_000),
          )
        : null;

      orders.push({
        id: orderId,
        clientId,
        customerId: customer.id,
        number: `#${orderCounter}`,
        placedAt,
        paidAt,
        salesPlatform: marketplace ? "MARKETPLACE" : "ECOMMERCE",
        channel: marketplace ? marketplaceName! : "Loja Aurora",
        utmSource,
        utmMedium,
        utmCampaign,
        financialStatus,
        paymentGateway,
        processingMethod,
        productRevenue: round2(productRevenue),
        shippingRevenue,
        totalDiscounts,
        totalPrice,
        discountCodes,
        country: "BR",
        province,
        city: customer.city,
        orderNumberForCustomer,
        itemsCount: unitsInOrder,
      });

      if (financialStatus === "PAID") {
        paidSoFar += totalPrice;
        customer.firstOrderAt ??= placedAt;
        customer.lastOrderAt = placedAt;
        customer.ordersCount += 1;
        customer.totalSpent = round2(customer.totalSpent + totalPrice);
        paidOrdersByCustomer.set(customer.id, customer.ordersCount);
        for (const { variant, quantity } of chosen.values()) {
          variant.lastSaleAt = placedAt;
          if (daysBetween(placedAt, TODAY) <= 90) variant.unitsLast90 += quantity;
        }
      }
    }
  });

  return { customers, orders, items };
}

/** Quintile scores and a segment label per customer (paid orders only). */
function scoreCustomers(customers: CustomerRow[]) {
  const buyers = customers.filter((c) => c.ordersCount > 0);
  for (const c of buyers) c.daysSinceLastPurchase = daysBetween(c.lastOrderAt!, TODAY);

  const quintile = (values: number[], ascendingIsBetter: boolean) => {
    const sorted = [...values].sort((a, b) => a - b);
    const cut = (q: number) =>
      sorted[Math.min(sorted.length - 1, Math.floor((sorted.length * q) / 5))]!;
    const cuts = [cut(1), cut(2), cut(3), cut(4)];
    return (v: number) => {
      let rank = 1;
      for (const c of cuts) if (v > c) rank += 1;
      return ascendingIsBetter ? 6 - rank : rank;
    };
  };

  const r = quintile(
    buyers.map((c) => c.daysSinceLastPurchase!),
    true,
  );
  const m = quintile(
    buyers.map((c) => c.totalSpent),
    false,
  );

  for (const c of buyers) {
    c.rScore = r(c.daysSinceLastPurchase!);
    // Most customers have a single order, so frequency quintiles collapse; use
    // explicit thresholds instead of the distribution.
    c.fScore =
      c.ordersCount >= 5
        ? 5
        : c.ordersCount >= 4
          ? 4
          : c.ordersCount >= 3
            ? 3
            : c.ordersCount >= 2
              ? 2
              : 1;
    c.mScore = m(c.totalSpent);
    c.rfmSegment = segmentFor(c.rScore, c.fScore, c.mScore);
  }
}

/**
 * Segment rules tuned for a store where most buyers have a single order:
 * three paid orders already make a customer "loyal".
 */
function segmentFor(r: number, f: number, m: number): string {
  if (r >= 4 && f >= 3 && m >= 4) return "Campeões";
  if (r <= 2 && f >= 3) return "Não pode perder";
  if (f >= 3) return "Leais";
  if (r >= 4 && f === 2) return "Potenciais leais";
  if (r >= 4) return "Novos";
  if (r === 3 && f === 1) return "Promissores";
  if (r === 3) return "Precisam de atenção";
  if (f === 2) return "Em risco";
  if (r === 1) return "Perdidos";
  return "Hibernando";
}

/** Stock sized on the last-90-day velocity: ~41 days of cover, ~6% stockouts. */
function sizeStock(rng: Rng, variants: VariantRow[]) {
  variants.forEach((v, index) => {
    const velocity = v.unitsLast90 / 90;
    const stockout = index % 16 === 7; // deterministic ~6%
    if (stockout) {
      v.stockQty = 0;
      return;
    }
    const coverDays = rng.float(12, 75);
    v.stockQty = Math.max(1, Math.round(velocity * coverDays + rng.int(0, 4)));
  });
}

function buildTraffic(rng: Rng, clientId: string, orders: OrderRow[]) {
  const paidByDay = new Map<string, number>();
  for (const o of orders) {
    if (o.financialStatus !== "PAID" || o.salesPlatform !== "ECOMMERCE") continue;
    const key = o.placedAt.toISOString().slice(0, 10);
    paidByDay.set(key, (paidByDay.get(key) ?? 0) + 1);
  }

  const rows: TrafficRow[] = [];
  const shareSum = ECOMMERCE_CHANNELS.reduce((s, c) => s + c.sessionShare, 0);
  for (let d = FIRST_DAY; d <= TODAY; d = addDays(d, 1)) {
    const key = d.toISOString().slice(0, 10);
    const paidOrders = paidByDay.get(key) ?? 0;
    const sessionsTotal = Math.round((paidOrders / CONVERSION_RATE) * rng.noise(0.1));
    for (const channel of ECOMMERCE_CHANNELS) {
      const sessions = Math.round(
        ((sessionsTotal * channel.sessionShare) / shareSum) * rng.noise(0.15),
      );
      const users = Math.round(sessions * 0.82);
      const viewItem = Math.round(sessions * rng.float(0.28, 0.36));
      const addToCart = Math.round(viewItem * rng.float(0.38, 0.46));
      const beginCheckout = Math.round(addToCart * rng.float(0.25, 0.31));
      rows.push({
        clientId,
        date: d,
        source: channel.source,
        medium: channel.medium,
        sessions,
        users,
        newUsers: Math.round(users * (channel.medium === "crm" ? 0.2 : 0.7)),
        viewItem,
        addToCart,
        beginCheckout,
      });
    }
  }
  return rows;
}

type AdUnit = {
  platform: AdPlatform;
  campaignId: string;
  campaignName: string;
  adsetId: string;
  adsetName: string;
  adId: string;
  adName: string;
  /** Share of the platform's daily spend. */
  weight: number;
  roas: number;
  cpm: number;
  ctr: number;
};

function buildAdUnits(): AdUnit[] {
  const units: AdUnit[] = [];
  const add = (
    platform: AdPlatform,
    campaign: string,
    adsets: readonly string[],
    ads: readonly string[],
    weight: number,
    roas: number,
    cpm: number,
    ctr: number,
  ) => {
    const campaignId = `${platform.toLowerCase()}-${slugify(campaign)}`;
    adsets.forEach((adset, ai) => {
      ads.forEach((ad, adi) => {
        units.push({
          platform,
          campaignId,
          campaignName: campaign,
          adsetId: `${campaignId}-${ai + 1}`,
          adsetName: adset,
          adId: `${campaignId}-${ai + 1}-${adi + 1}`,
          adName: ad,
          weight: weight / (adsets.length * ads.length),
          roas: roas * 0.9 * (1 + (adi - (ads.length - 1) / 2) * 0.18),
          cpm,
          ctr,
        });
      });
    });
  };

  add(
    "META",
    "Prospecção · interesses casa",
    ["Decoração 25-44", "Casa nova 25-44"],
    ["Vídeo ambiente", "Carrossel best-sellers"],
    34,
    2.6,
    19,
    0.013,
  );
  add(
    "META",
    "Remarketing · carrinho",
    ["Visitantes 7 dias", "Carrinho 3 dias"],
    ["Frete grátis", "Última chance"],
    22,
    5.8,
    24,
    0.021,
  );
  add(
    "META",
    "Catálogo dinâmico",
    ["Compradores 180 dias"],
    ["Catálogo automático"],
    20,
    4.1,
    17,
    0.016,
  );
  add(
    "META",
    "Lançamento inverno",
    ["Interesses aconchego"],
    ["Manta tricot", "Edredom"],
    24,
    1.7,
    21,
    0.011,
  );
  add("GOOGLE", "Search · marca", ["Termos de marca"], ["Anúncio marca"], 22, 8.4, 38, 0.052);
  add(
    "GOOGLE",
    "Search · categoria",
    ["Cama e banho", "Decoração"],
    ["Genérico categoria"],
    40,
    2.3,
    46,
    0.034,
  );
  add("GOOGLE", "Performance Max", ["Catálogo completo"], ["PMax auto"], 38, 3.0, 28, 0.027);
  add(
    "TIKTOK",
    "Vídeo produto",
    ["Broad 18-34"],
    ["Unboxing", "Antes e depois"],
    100,
    1.4,
    9,
    0.009,
  );
  return units;
}

function buildAdSpend(rng: Rng, clientId: string, orders: OrderRow[]) {
  const paidRevenueByDay = new Map<string, number>();
  for (const o of orders) {
    if (o.financialStatus !== "PAID") continue;
    const key = o.placedAt.toISOString().slice(0, 10);
    paidRevenueByDay.set(key, (paidRevenueByDay.get(key) ?? 0) + o.totalPrice);
  }

  const units = buildAdUnits();
  const platformShare: Record<AdPlatform, number> = { META: 0.68, GOOGLE: 0.27, TIKTOK: 0.05 };
  const platformWeightSum: Record<AdPlatform, number> = { META: 0, GOOGLE: 0, TIKTOK: 0 };
  for (const u of units) platformWeightSum[u.platform] += u.weight;

  const rows: AdSpendRow[] = [];
  for (let d = FIRST_DAY; d <= TODAY; d = addDays(d, 1)) {
    const key = d.toISOString().slice(0, 10);
    // Spend is planned, so it is smoother than revenue; use a 7-day-ish level.
    const revenue = paidRevenueByDay.get(key) ?? 0;
    const dailySpend = revenue * MEDIA_SPEND_SHARE * rng.noise(0.08);
    // Meta Ads stopped syncing on 2026-08-20 (fixture story) - keep the rows but
    // the screens will flag them; nothing to do here.
    for (const u of units) {
      const spend = round2(
        (dailySpend * platformShare[u.platform] * u.weight) / platformWeightSum[u.platform],
      );
      if (spend <= 0) continue;
      const impressions = Math.round((spend / u.cpm) * 1000 * rng.noise(0.15));
      const clicks = Math.round(impressions * u.ctr * rng.noise(0.15));
      const attributedRevenue = round2(spend * u.roas * rng.noise(0.3));
      rows.push({
        clientId,
        date: d,
        platform: u.platform,
        campaignId: u.campaignId,
        campaignName: u.campaignName,
        adsetId: u.adsetId,
        adsetName: u.adsetName,
        adId: u.adId,
        adName: u.adName,
        spend,
        platformFee: round2(spend * 0.015),
        impressions,
        clicks,
        conversions: Math.round(attributedRevenue / TARGET_AOV),
        attributedRevenue,
      });
    }
  }
  return rows;
}

function buildCosts(clientId: string): CostRow[] {
  const start = FIRST_DAY;
  const row = (
    name: string,
    businessUnit: BusinessUnit,
    category: CostCategory,
    subcategory: string,
    frequency: CostFrequency,
    value: number,
    description: string | null = null,
  ): CostRow => ({
    clientId,
    name,
    description,
    businessUnit,
    category,
    subcategory,
    frequency,
    value,
    startDate: start,
    endDate: null,
  });

  return [
    row(
      "Taxa do adquirente",
      "ECOMMERCE",
      "COGS",
      "gateway",
      "PERCENT_PER_ORDER",
      2.84,
      "Taxa média ponderada por parcelamento",
    ),
    row("Anti-fraude", "ECOMMERCE", "COGS", "antifraud", "PER_ORDER", 0.9),
    row(
      "Frete transportadora",
      "BOTH",
      "COGS",
      "shipping",
      "PER_ORDER",
      18.4,
      "Custo médio por pedido nas transportadoras integradas",
    ),
    row(
      "Comissão do marketplace",
      "MARKETPLACE",
      "COGS",
      "marketplace_fee",
      "PERCENT_PER_ORDER",
      14,
    ),
    row(
      "Impostos sobre venda",
      "BOTH",
      "COGS",
      "taxes",
      "PERCENT_PER_ORDER",
      4.5,
      "Simples Nacional, alíquota efetiva",
    ),
    row("Plataforma da loja", "ECOMMERCE", "COGS", "platform", "MONTHLY", 399),
    row("Agência de mídia", "ECOMMERCE", "SALES_MARKETING", "agency", "MONTHLY", 4500),
    row("Ferramenta de e-mail", "ECOMMERCE", "SALES_MARKETING", "email_marketing", "MONTHLY", 590),
    row(
      "Imposto sobre Meta Ads",
      "ECOMMERCE",
      "SALES_MARKETING",
      "meta_ads_tax",
      "PERCENT_OF_AD_SPEND",
      0,
    ),
    row("Aluguel do galpão", "BOTH", "OPERATIONAL", "rent", "MONTHLY", 6500),
    row("Salários", "BOTH", "OPERATIONAL", "salary", "MONTHLY", 38000, "Equipe de 7 pessoas"),
    row("Software e assinaturas", "BOTH", "OPERATIONAL", "software", "MONTHLY", 1900),
    row("Ferramentas de atendimento", "BOTH", "OPERATIONAL", "tools", "MONTHLY", 800),
    row("Outras despesas", "BOTH", "OPERATIONAL", "other", "MONTHLY", 1200),
  ];
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function generateAnalytics(clientId: string, seed = 20260910) {
  const rng = createRng(seed);
  const { products, variants } = buildCatalog(rng, clientId);
  const { customers, orders, items } = buildOrders(rng, clientId, variants);
  scoreCustomers(customers);
  sizeStock(rng, variants);
  const traffic = buildTraffic(rng, clientId, orders);
  const adSpend = buildAdSpend(rng, clientId, orders);
  const costs = buildCosts(clientId);
  return { products, variants, customers, orders, items, traffic, adSpend, costs };
}

async function insertInChunks<T>(
  rows: T[],
  size: number,
  insert: (chunk: T[]) => Promise<unknown>,
) {
  for (let i = 0; i < rows.length; i += size) await insert(rows.slice(i, i + size));
}

/** Writes the generated dataset for `clientId`. Assumes the client was just created (no facts yet). */
export async function seedAnalytics(prisma: PrismaClient, clientId: string) {
  const data = generateAnalytics(clientId);

  await prisma.product.createMany({ data: data.products });
  await prisma.productVariant.createMany({
    data: data.variants.map(({ weight: _w, unitsLast90: _u, ...v }) => v),
  });
  await insertInChunks(data.customers, 2000, (chunk) =>
    prisma.customer.createMany({ data: chunk }),
  );
  await insertInChunks(data.orders, 1000, (chunk) => prisma.order.createMany({ data: chunk }));
  await insertInChunks(data.items, 2000, (chunk) => prisma.orderItem.createMany({ data: chunk }));
  await insertInChunks(data.traffic, 2000, (chunk) =>
    prisma.trafficDaily.createMany({ data: chunk }),
  );
  await insertInChunks(data.adSpend, 2000, (chunk) =>
    prisma.adSpendDaily.createMany({ data: chunk }),
  );
  await prisma.costExpense.createMany({ data: data.costs });

  return {
    products: data.products.length,
    variants: data.variants.length,
    customers: data.customers.length,
    orders: data.orders.length,
    items: data.items.length,
    traffic: data.traffic.length,
    adSpend: data.adSpend.length,
    costs: data.costs.length,
  };
}
