import PgBoss from "pg-boss";
import type { JobHandler, Jobs, JobSendOptions } from "./jobs.types";

const SCHEMA = "pgboss";
const DEFAULT_RETRY_LIMIT = 3;
const DEFAULT_EXPIRE_MINUTES = 60;

const toSendOptions = (options: JobSendOptions = {}): PgBoss.SendOptions => ({
  ...(options.singletonKey ? { singletonKey: options.singletonKey } : {}),
  retryLimit: options.retryLimit ?? DEFAULT_RETRY_LIMIT,
  retryDelay: options.retryDelaySeconds ?? 30,
  retryBackoff: true,
  expireInMinutes: options.expireInMinutes ?? DEFAULT_EXPIRE_MINUTES,
  ...(options.startAfterSeconds ? { startAfter: options.startAfterSeconds } : {}),
});

export function createJobs(databaseUrl: string): Jobs {
  const boss = new PgBoss({ connectionString: databaseUrl, schema: SCHEMA });
  boss.on("error", (error) => console.error(error));
  const queues = new Set<string>();
  return {
    async start() {
      await boss.start();
    },
    async stop() {
      await boss.stop({ graceful: true, timeout: 10_000 });
    },
    async ensureQueue(name, retryLimit = DEFAULT_RETRY_LIMIT) {
      if (queues.has(name)) return;
      await boss.createQueue(name, { name, retryLimit, retryBackoff: true, retryDelay: 30 });
      queues.add(name);
    },
    async send(name, data, options) {
      await this.ensureQueue(name, options?.retryLimit);
      return boss.send(name, data, toSendOptions(options));
    },
    async schedule(name, cron, data) {
      await this.ensureQueue(name);
      await boss.schedule(name, cron, data, { tz: "America/Sao_Paulo" });
    },
    async work<T extends object>(name: string, handler: JobHandler<T>) {
      await this.ensureQueue(name);
      await boss.work<T>(name, { batchSize: 1 }, async (jobs) => {
        for (const job of jobs) await handler(job.data, job.id);
      });
    },
  };
}
