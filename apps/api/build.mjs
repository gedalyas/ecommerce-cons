import { readFileSync } from "node:fs";
import { build } from "esbuild";

// Bundle the API and the workspace packages it imports (they are TypeScript
// sources); every real dependency stays external and comes from node_modules.
const { dependencies } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url)));
const external = Object.keys(dependencies).filter((name) => !name.startsWith("@ecommerce/"));

await build({
  entryPoints: ["src/index.ts", "src/worker.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  external: [...external, "@prisma/client", "@prisma/adapter-pg", "pg", "dotenv"],
  sourcemap: true,
  logLevel: "info",
});
