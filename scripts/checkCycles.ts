import { spawnSync } from "node:child_process";
import { type ImportGraph, summarizeCycles } from "./cyclicFiles";

// Measures how many files under src/ live inside a cyclic import component
// (Tarjan) and fails when the number is above the cap (`--max-files N`), which
// only ever goes down - the same ratchet as the lint's `--max-warnings`.
// `no-restricted-imports` cannot see a cycle (it reads one import at a time)
// and dependency-cruiser's native baseline matches a cycle by its path, which
// changes with every edit in the middle. See specs/architecture.md §5.

interface CruisedModule {
  readonly source: string;
  readonly dependencies: readonly { readonly resolved: string }[];
}

const MAX_FILES_FLAG = "--max-files";

const readMaxFiles = (argv: readonly string[]): number | null => {
  const position = argv.indexOf(MAX_FILES_FLAG);
  if (position < 0) return null;
  const value = Number(argv[position + 1]);
  if (!Number.isInteger(value) || value < 0) {
    console.error(`${MAX_FILES_FLAG} needs an integer >= 0.`);
    process.exit(1);
  }
  return value;
};

const readImportGraph = (): ImportGraph => {
  const result = spawnSync(
    "depcruise",
    ["src", "--config", ".dependency-cruiser.cjs", "--output-type", "json"],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, shell: process.platform === "win32" },
  );
  if (result.error || result.stdout === "") {
    console.error(result.error ?? result.stderr);
    process.exit(1);
  }
  const { modules } = JSON.parse(result.stdout) as { modules: CruisedModule[] };
  const graph = new Map<string, string[]>();
  for (const module of modules) {
    if (!module.source.startsWith("src/")) continue;
    graph.set(
      module.source,
      module.dependencies
        .map((dependency) => dependency.resolved)
        .filter((target) => target.startsWith("src/")),
    );
  }
  return graph;
};

const moduleOf = (file: string): string => /^src\/modules\/([^/]+)\//.exec(file)?.[1] ?? "shared";

const describeLargest = (component: readonly string[]): string => {
  const modules = [...new Set(component.map(moduleOf))];
  return `  largest component: ${component.length} files in ${modules.length} module(s): ${modules.join(", ")}\n`;
};

const checkCycles = (): void => {
  const maxFiles = readMaxFiles(process.argv);
  const { components, files, edges } = summarizeCycles(readImportGraph());

  process.stdout.write(
    `check:cycles — ${files} files in cycles (${edges} edges) in ${components.length} component(s)\n`,
  );
  if (components.length > 0) process.stdout.write(describeLargest(components[0]!));
  if (maxFiles === null) return;

  if (files > maxFiles) {
    console.error(
      `✗ ${files} files in cycles, cap ${maxFiles}: a file entered a cycle. Undo the edge that closes it (specs/architecture.md §5) — the cap never goes up.`,
    );
    process.exit(1);
  }
  if (files < maxFiles) {
    process.stdout.write(
      `  ${maxFiles - files} below the cap: lower ${MAX_FILES_FLAG} to ${files} in ci.yml in this PR.\n`,
    );
  }
};

checkCycles();
