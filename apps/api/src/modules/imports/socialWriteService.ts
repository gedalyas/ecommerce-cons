import { prismaClient } from "@ecommerce/database/client";
import type { SocialInput } from "./importRows.types";

const BATCH = 200;
const dayOf = (day: string) => new Date(`${day}T00:00:00.000Z`);

function chunks<T>(items: T[]): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += BATCH) groups.push(items.slice(i, i + BATCH));
  return groups;
}

export async function writeSyncedSocial(clientId: string, input: SocialInput): Promise<number> {
  for (const group of chunks(input.daily)) {
    await prismaClient.$transaction(
      group.map(({ platform, accountId, date, ...counts }) =>
        prismaClient.socialDaily.upsert({
          where: {
            clientId_platform_accountId_date: { clientId, platform, accountId, date: dayOf(date) },
          },
          create: { clientId, platform, accountId, date: dayOf(date), ...counts },
          update: counts,
        }),
      ),
    );
  }
  for (const group of chunks(input.posts)) {
    await prismaClient.$transaction(
      group.map(({ platform, externalId, publishedAt, ...fields }) =>
        prismaClient.socialPost.upsert({
          where: { clientId_platform_externalId: { clientId, platform, externalId } },
          create: {
            clientId,
            platform,
            externalId,
            publishedAt: new Date(publishedAt),
            ...fields,
          },
          update: { publishedAt: new Date(publishedAt), ...fields },
        }),
      ),
    );
  }
  return input.daily.length + input.posts.length;
}
