import type {
  AuthPattern,
  ConnectorKey,
  ConnectorStatusOption,
} from "@ecommerce/contracts/connectors";
import type { AdSpendRow, OrderInput, TrafficRow } from "@/modules/imports/contract";

export type Credentials = Record<string, unknown>;

export type Authorized = {
  credentials: Credentials;
  externalId: string;
  externalLabel: string;
};

export type RawKind = "order" | "product" | "customer" | "ad_insight" | "traffic";

export type RawRow = { externalId: string; payload: unknown };

export type SyncCursor = Record<string, string>;

export type SyncContext = {
  connectionId: string;
  clientId: string;
  externalId: string;
  credentials: Credentials;
  cursor: SyncCursor;
  settings: Record<string, unknown>;
  reprocess: boolean;
  now: Date;
  saveRaw(kind: RawKind, rows: RawRow[]): Promise<void>;
  readRaw<T>(kind: RawKind, externalId: string): Promise<T | null>;
  listRaw<T>(
    kind: RawKind,
    skip: number,
    take: number,
  ): Promise<{ externalId: string; payload: T }[]>;
  writeOrders(orders: OrderInput[]): Promise<number>;
  writeAdSpend(rows: AdSpendRow[]): Promise<number>;
  writeTraffic(rows: TrafficRow[]): Promise<number>;
};

export type SyncResult = { cursor: SyncCursor; written: number };

export type AuthorizeParams = { state: string; redirectUri: string; domain: string };
export type ExchangeParams = { code: string; redirectUri: string; domain: string };

export type ConnectorProvider = {
  key: ConnectorKey;
  authPattern: AuthPattern;
  authorizeUrl(params: AuthorizeParams): string;
  exchangeCode(params: ExchangeParams): Promise<Authorized>;
  fromCredentials?(fields: Record<string, string>): Promise<Authorized>;
  refresh?(credentials: Credentials, now: Date): Promise<Credentials | null>;
  describeSettings?(credentials: Credentials): Promise<ConnectorStatusOption[]>;
  backfill(context: SyncContext): Promise<SyncResult>;
  sync(context: SyncContext): Promise<SyncResult>;
};

export type ProviderRegistry = ReadonlyMap<ConnectorKey, ConnectorProvider>;
