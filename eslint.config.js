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
  regex: "(^|/)modules/",
  message:
    "shared/ does not know any domain. Invert the dependency or move the file to the module.",
};

const moduleExposesOnlyContract = {
  regex: "(^|/)modules/(?!\\w+/contract(\\.ts)?$)",
  message:
    "A module only exposes contract.ts. Import from @/modules/<domain>/contract or add the line there.",
};

const insideModuleIsRelative = {
  regex: "^@/modules/(?!\\w+/contract(\\.ts)?$)",
  message:
    "Inside a module the import is relative (./file). From another module, only @/modules/<domain>/contract.",
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
  group: ["**/shared/dependencies/*", "@/generated/prisma/*", "!@/generated/prisma/enums"],
  message:
    "I/O only in the orchestrator: the Prisma client is imported by *Service.ts, never by a component, route, controller or pure function. Enums come from @/generated/prisma/enums.",
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
      ...restrictedImports([extinct, moduleExposesOnlyContract, dependenciesOnlyInService]),
    },
  },
  {
    // The seed and the operational scripts are not product code.
    files: ["prisma/**/*.ts", "scripts/**/*.ts"],
    rules: { "no-console": "off", "max-lines": "off" },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: restrictedImports([extinct, sharedKnowsNoDomain, dependenciesOnlyInService]),
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
        insideModuleIsRelative,
        crossingUsesAlias(depth),
      ]),
    },
    {
      files: [`src/modules/*/${"*/".repeat(depth)}*Service.ts`],
      rules: restrictedImports([
        extinct,
        moduleExposesOnlyContract,
        insideModuleIsRelative,
        crossingUsesAlias(depth),
      ]),
    },
  ]),
  eslintPluginPrettier,
);
