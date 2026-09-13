import { createApp } from "./app";
import { readEnv } from "./shared/config/env";
import { createJobs } from "./shared/jobs/createJobs";

const env = readEnv();
const jobs = createJobs(env.DATABASE_URL);
await jobs.start();
const app = createApp(env, jobs);

const port = env.PORT ?? env.API_PORT;
app.listen(port, () => {
  console.log(`api listening on http://localhost:${port}/api/v1 (${env.NODE_ENV})`);
});
