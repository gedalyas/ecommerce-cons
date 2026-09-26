import { connectorsDependencies } from "./app";
import { registerConnectorJobs } from "./modules/connectors/contract";
import { marketingCostLines } from "./modules/money/contract";
import { registerReportJobs } from "./modules/reports/contract";
import { readEnv } from "./shared/config/env";
import { createJobs } from "./shared/jobs/createJobs";
import { createMailer } from "./shared/mail/createMailer";

const env = readEnv();
const jobs = createJobs(env.DATABASE_URL);
await jobs.start();
const now = () => new Date();
await registerConnectorJobs(jobs, connectorsDependencies(env, jobs, now));
await registerReportJobs({
  jobs,
  now,
  mailer: createMailer(env, now),
  appUrl: env.APP_URL,
  costLinesFor: marketingCostLines,
});
console.log(`worker running (${env.NODE_ENV})`);

const shutdown = async () => {
  await jobs.stop();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
