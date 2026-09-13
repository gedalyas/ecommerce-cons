import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

const MAX_MODULE_DEPTH = 0;

const moduleExposesOnlyContract = {
  regex: "^@/modules/\w+/(?!contract(\.ts)?$)",
  message:
    "A module only exposes contract.ts. Import from @/modules/<domain>/contract or add the line there.",
};

const insideModuleIsRelative = {
  regex: "^@/modules/(?!\w+/contract(\.ts)?$)",
  message:
    "Inside a module the import is relative (./file). From another module, only @/modules/<domain>/contract.",
};

const crossingUsesAlias = (depth) => ({
  regex: `^(\.\./){${depth + 1}}`,
  message:
    "A relative import left the module. Cross the boundary through an alias: @/shared/... or @/modules/<domain>/contract.",
});

const dependenciesOnlyInService = {
  group: ["@ecommerce/database/client", "@ecommerce/database/passwordHash"],
  message:
    "I/O only in the orchestrator: the Prisma client is imported by *Service.ts, never by a router, controller or pure function. Enums come from @ecommerce/database/enums.",
};

const sharedKnowsNoDomain = {
  regex: "(^|/)modules/|^@ecommerce/contracts/(?!shared/|auth$)",
  message:
    "shared/ does not know any domain: only @ecommerce/contracts/shared/* (and the auth context type) is allowed here.",
};

const noReactHere = {
  group: ["react", "react-dom", "@tanstack/*"],
  message: "The API has no UI: no React, no TanStack.",
};

const restrictedImports = (patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
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
  selector: `${selector}[name=/[\u00C0-\u024F]/]`,
  message:
    "Accented identifier: variables, parameters, functions, classes, types and enums are English. Strings shown to the user may be Portuguese.",
}));

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.ts"],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.node } },
    plugins: { "unused-imports": unusedImports },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
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
      ...restrictedImports([noReactHere]),
    },
  },
  { files: ["src/**/*.test.ts"], rules: { "max-lines-per-function": "off" } },
  { files: ["src/index.ts"], rules: { "no-console": "off" } },
  {
    files: ["src/shared/**/*.ts"],
    rules: restrictedImports([noReactHere, sharedKnowsNoDomain, dependenciesOnlyInService]),
  },
  ...Array.from({ length: MAX_MODULE_DEPTH + 1 }, (_, depth) => depth).flatMap((depth) => [
    {
      files: [`src/modules/*/${"*/".repeat(depth)}*.ts`],
      rules: restrictedImports([
        noReactHere,
        moduleExposesOnlyContract,
        dependenciesOnlyInService,
        insideModuleIsRelative,
        crossingUsesAlias(depth),
      ]),
    },
    {
      files: [`src/modules/*/${"*/".repeat(depth)}*Service.ts`],
      rules: restrictedImports([
        noReactHere,
        moduleExposesOnlyContract,
        insideModuleIsRelative,
        crossingUsesAlias(depth),
      ]),
    },
  ]),
  eslintPluginPrettier,
);
