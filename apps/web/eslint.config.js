import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

// Folder architecture (specs/architecture.md): the folder is the business
// domain, the layer is the file. A file lives in src/modules/<domain>/ or in
// src/shared/, nothing else. The patterns below are the boundary rules copied
// from the reference system (specs/architecture-reference.md §3.2).

const EXTINCT_PATHS = [
  "@/features/**",
  "@/lib/**",
  "@/hooks/**",
  "@/components/**",
  "@/design-system/**",
  "@/layout/**",
  "@/server/**",
];

/** Modules are flat: a subfolder inside src/modules/<domain>/ is not allowed. */
const MAX_MODULE_DEPTH = 0;

const extinct = {
  group: EXTINCT_PATHS,
  message: "Pre-migration structure. Code lives in @/modules/<domain>/ or @/shared/.",
};

const sharedKnowsNoDomain = {
  regex: "(^|/)modules/|^@ecommerce/contracts/(?!shared/|auth$)",
  message:
    "shared/ does not know any domain: only @ecommerce/contracts/shared/* (and the auth session shape) is allowed here. Invert the dependency or move the file to the module.",
};

const moduleExposesOnlyContract = {
  regex: "(^|/)modules/(?!\\w+/contract(\\.server)?(\\.ts)?$)",
  message:
    "A module only exposes contract.ts (isomorphic) and contract.server.ts (server-only). Import from @/modules/<domain>/contract[.server] or add the line there.",
};

const insideModuleIsRelative = {
  regex: "^@/modules/(?!\\w+/contract(\\.server)?(\\.ts)?$)",
  message:
    "Inside a module the import is relative (./file). From another module, only @/modules/<domain>/contract or contract.server.",
};

const crossingUsesAlias = (depth) => ({
  regex: `^(\\.\\./){${depth + 1}}`,
  message:
    "A relative import left the module. Cross the boundary through an alias: @/shared/... or @/modules/<domain>/contract.",
});

/**
 * I/O only in the orchestrator: the Prisma client (and everything under
 * shared/dependencies) is imported by *Service.ts, never by a component, a
 * route, a controller or the pure core. Prisma enums are browser-safe and
 * stay allowed everywhere.
 */
const dependenciesOnlyInService = {
  group: ["**/shared/dependencies/*"],
  message:
    "I/O only in the orchestrator: the API client and the session are imported by *Controller.ts (the BFF) and *Service.ts, never by a component, route or pure function.",
};

const noDatabaseInTheWeb = {
  group: ["@ecommerce/database", "@ecommerce/database/*", "@prisma/*"],
  message:
    "The web never touches the database: it calls the API through shared/dependencies/apiClient. Closed sets come from @ecommerce/contracts.",
};

const serverOnlyPackage = {
  name: "server-only",
  message:
    "TanStack Start does not use the Next.js `server-only` package. Keep server code in *Service.ts or shared/dependencies.",
};

const restrictedImports = (patterns) => ({
  "no-restricted-imports": ["error", { paths: [serverOnlyPackage], patterns }],
});

const englishIdentifiers = [
  "VariableDeclarator > Identifier.id",
  "FunctionDeclaration > Identifier.id",
  "ClassDeclaration > Identifier.id",
  "TSInterfaceDeclaration > Identifier.id",
  "TSTypeAliasDeclaration > Identifier.id",
  "TSEnumDeclaration > Identifier.id",
  ":function > Identifier.params",
].map((selector) => ({
  selector: `${selector}[name=/[\\u00C0-\\u024F]/]`,
  message:
    "Accented identifier: variables, parameters, functions, classes, types and enums are English. Data keys and strings shown to the user may be Portuguese.",
}));

export default tseslint.config(
  {
    ignores: [
      "dist",
      ".output",
      ".vercel",
      ".vinxi",
      ".nitro",
      "coverage",
      "src/generated",
      "src/routeTree.gen.ts",
      ".dependency-cruiser.cjs",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "unused-imports": unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": ["error", { allow: ["error"] }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "prefer-const": "error",
      "no-var": "error",
      "no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
      "no-restricted-syntax": ["error", ...englishIdentifiers],
      "max-lines": ["error", { max: 600, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 50, skipBlankLines: true, skipComments: true }],
      "max-params": ["warn", 5],
      "max-depth": ["warn", 4],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      ...restrictedImports([
        extinct,
        moduleExposesOnlyContract,
        dependenciesOnlyInService,
        noDatabaseInTheWeb,
      ]),
    },
  },
  {
    // A component is a render tree, a test file is a suite, a route file is a table.
    files: ["**/*.tsx"],
    rules: {
      "max-lines-per-function": ["warn", { max: 150, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "src/routes/**/*.tsx", "src/routes.ts"],
    rules: { "max-lines-per-function": "off" },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: restrictedImports([
      extinct,
      sharedKnowsNoDomain,
      dependenciesOnlyInService,
      noDatabaseInTheWeb,
    ]),
  },
  {
    files: ["src/shared/dependencies/*.ts"],
    rules: restrictedImports([extinct, sharedKnowsNoDomain]),
  },
  ...Array.from({ length: MAX_MODULE_DEPTH + 1 }, (_, depth) => depth).flatMap((depth) => [
    {
      files: [`src/modules/*/${"*/".repeat(depth)}*.{ts,tsx}`],
      rules: restrictedImports([
        extinct,
        moduleExposesOnlyContract,
        dependenciesOnlyInService,
        noDatabaseInTheWeb,
        insideModuleIsRelative,
        crossingUsesAlias(depth),
      ]),
    },
    {
      files: [
        `src/modules/*/${"*/".repeat(depth)}*Service.ts`,
        `src/modules/*/${"*/".repeat(depth)}*Controller.ts`,
      ],
      rules: restrictedImports([
        extinct,
        moduleExposesOnlyContract,
        noDatabaseInTheWeb,
        insideModuleIsRelative,
        crossingUsesAlias(depth),
      ]),
    },
  ]),
  eslintPluginPrettier,
);
