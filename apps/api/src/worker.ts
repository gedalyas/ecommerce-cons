import { connectorsDependencies } from "./app";
import { registerConnectorJobs } from "./modules/connectors/contract";
import { readEnv } from "./shared/config/env";
import { createJobs } from "./shared/jobs/createJobs";

const env = readEnv();
const jobs = createJobs(env.DATABASE_URL);
await jobs.start();
await registerConnectorJobs(
  jobs,
  connectorsDependencies(env, jobs, () => new Date()),
);
console.log(`worker running (${env.NODE_ENV})`);

const shutdown = async () => {
  await jobs.stop();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
