import { createApp } from "./app";
import { readEnv } from "./shared/config/env";

const env = readEnv();
const app = createApp(env);

app.listen(env.API_PORT, () => {
  console.log(`api listening on http://localhost:${env.API_PORT}/api/v1 (${env.NODE_ENV})`);
});
