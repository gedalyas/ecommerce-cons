/**
 * Import-graph resolution options for `check:cycles` (`scripts/checkCycles.ts`).
 * dependency-cruiser only builds the graph; the script measures and gates -
 * files inside a cyclic component (Tarjan), capped in CI by a number that only
 * goes down, like `--max-warnings`. No `no-circular` rule here on purpose: the
 * native baseline matches a cycle by its path and re-routes on every change in
 * the middle, flagging an old cycle as "new".
 * See specs/architecture.md §5 and specs/architecture-reference.md §3.
 *
 * Copied from the reference system's frontend config. Copy, do not rewrite.
 */
module.exports = {
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "\\.test\\.tsx?$|routeTree\\.gen\\.ts$|src/generated/" },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "browser", "default"],
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
  },
};
