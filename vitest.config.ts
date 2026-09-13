import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

// Unit tests live next to the pure functions they cover (`foo.test.ts` beside
// `foo.ts`). Orchestrators, routes and components are not unit-tested.
export default defineConfig({
  plugins: [tsConfigPaths({ projects: ["./tsconfig.json"] })],
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    environment: "node",
  },
});
