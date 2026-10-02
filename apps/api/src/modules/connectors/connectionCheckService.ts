import { connectionOf } from "./connectorAccountsService";
import { integrationLabel } from "./integrationLabel";
import { prismaClient } from "@ecommerce/database/client";
import {
  accountCheck,
  CHECK_WINDOW_DAYS,
  connectionVerdict,
  receivedKindLabel,
  receivedKinds,
  type AccessResult,
  type ConnectionCheck,
  type ConnectorKey,
  type ReceivedRows,
} from "@ecommerce/contracts/connectors";
import { recordActivity } from "@/modules/audit/contract";
import type { AuthContext } from "@/shared/http/auth.types";
import { notFound } from "@/shared/http/httpError";
import type { ConnectorProvider, Credentials } from "./connectorProvider.types";
import { providerOf, type ConnectorsDependencies } from "./connectorsService";
import { credentialsExpired, failedAccess } from "./connectionProbe";
import { accountIdOf } from "./connectionSettings";

const DAY_MS = 86_400_000;

async function probeAccess(
  provider: ConnectorProvider,
  credentials: Credentials,
  settings: unknown,
  externalLabel: string,
): Promise<AccessResult> {
  try {
    if (provider.test) return { status: "ok", ...(await provider.test(credentials)) };
    if (!provider.describeSettings) return { status: "unverified" };
    const described = await provider.describeSettings(credentials);
    return accountCheck(described.accounts ?? [], accountIdOf(settings), externalLabel);
  } catch (error) {
    console.error(error);
    return failedAccess(error);
  }
}

async function receivedSince(connectionId: string, since: Date): Promise<ReceivedRows[]> {
  const groups = await prismaClient.rawRecord.groupBy({
    by: ["kind"],
    where: { connectionId, fetchedAt: { gte: since } },
    _count: { _all: true },
  });
  const rows = new Map(groups.map((g) => [g.kind, g._count._all]));
  return receivedKinds.flatMap((kind) => {
    const count = rows.get(kind) ?? 0;
    return count > 0 ? [{ kind, label: receivedKindLabel[kind], rows: count }] : [];
  });
}

export async function checkConnection(
  auth: AuthContext,
  key: ConnectorKey,
  id: string,
  deps: ConnectorsDependencies,
): Promise<ConnectionCheck> {
  const provider = providerOf(deps, key);
  const row = await connectionOf(auth.clientId, key, id);
  if (!row) throw notFound("Integração não encontrada");
  const credentials = deps.vault.open<Credentials>(row.account.credentials);
  const access: AccessResult = credentialsExpired(credentials, deps.now())
    ? { status: "unverified" }
    : await probeAccess(provider, credentials, row.settings, row.account.externalLabel);
  const received = await receivedSince(
    row.id,
    new Date(deps.now().getTime() - CHECK_WINDOW_DAYS * DAY_MS),
  );
  const verdict = connectionVerdict(access, received);
  await recordActivity(auth, auth.clientId, {
    action: "CONNECTION_TESTED",
    connector: integrationLabel(key, row.name),
    result: verdict.text,
  });
  return { access, received, lastSyncAt: row.lastSyncAt?.toISOString() ?? null, verdict };
}
