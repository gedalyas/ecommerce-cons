import { createApp } from "./app";
import { readEnv } from "./shared/config/env";
import { createJobs } from "./shared/jobs/createJobs";

const env = readEnv();
const jobs = createJobs(env.DATABASE_URL);
await jobs.start();
const app = createApp(env, jobs);

app.listen(env.API_PORT, () => {
  console.log(`api listening on http://localhost:${env.API_PORT}/api/v1 (${env.NODE_ENV})`);
});
