import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Route files are named in English while the URLs stay in Portuguese, so the
// filename can no longer double as the path. `routes.ts` maps one to the other.
export default defineConfig(({ command }) => ({
  server: { host: true, port: 8080 },
  preview: { host: true, port: 8080 },
  resolve: {
    // Keep a single copy of React and the TanStack runtime: duplicates break
    // hooks and the router context across the SSR/client boundary.
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Redirect the bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
      router: { virtualRouteConfig: "./src/routes.ts" },
      // Fail the build instead of leaking a server-only module into the client bundle.
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    // Nitro owns the server build; the default preset targets Node, which is
    // what the Docker image runs.
    ...(command === "build" ? [nitro()] : []),
    viteReact(),
  ],
}));
