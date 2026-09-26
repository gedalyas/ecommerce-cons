import type {
  AuthPattern,
  ConnectorAccountOption,
  ConnectorKey,
  ConnectorStatusOption,
  ReceivedKind,
} from "@ecommerce/contracts/connectors";
import type {
  AdSpendRow,
  KeywordRow,
  OrderInput,
  SocialInput,
  TrafficDetail,
  TrafficRow,
} from "@/modules/imports/contract";

export type Credentials = Record<string, unknown>;

export type Authorized = {
  credentials: Credentials;
  externalId: string;
  externalLabel: string;
  settings?: Record<string, unknown>;
};

export type ProviderSettings = {
  statuses?: ConnectorStatusOption[];
  accounts?: ConnectorAccountOption[];
};

export type RawKind = ReceivedKind;

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
  writeKeywords(rows: KeywordRow[]): Promise<number>;
  writeTrafficDetail(detail: TrafficDetail): Promise<number>;
  writeSocial(input: SocialInput): Promise<number>;
};

export type SyncResult = { cursor: SyncCursor; written: number };

export type AuthorizeParams = { state: string; redirectUri: string; domain: string };
export type ExchangeParams = {
  code: string;
  redirectUri: string;
  domain: string;
  query: Record<string, string>;
};

export type ConnectorProvider = {
  key: ConnectorKey;
  authPattern: AuthPattern;
  authorizeUrl(params: AuthorizeParams): string;
  exchangeCode(params: ExchangeParams): Promise<Authorized>;
  fromCredentials?(fields: Record<string, string>): Promise<Authorized>;
  refresh?(credentials: Credentials, now: Date): Promise<Credentials | null>;
  describeSettings?(credentials: Credentials): Promise<ProviderSettings>;
  test?(credentials: Credentials): Promise<{ accountLabel: string }>;
  backfill(context: SyncContext): Promise<SyncResult>;
  sync(context: SyncContext): Promise<SyncResult>;
};

export type ProviderRegistry = ReadonlyMap<ConnectorKey, ConnectorProvider>;
