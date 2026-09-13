import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

const noRuntime = {
  patterns: [
    {
      group: [
        "react",
        "react-dom",
        "react/*",
        "@tanstack/*",
        "@ecommerce/database",
        "@ecommerce/database/*",
        "@prisma/*",
      ],
      message:
        "contracts is pure TypeScript shared with the web, the API and the mobile app: no React, no Prisma, no runtime.",
    },
    {
      group: ["@/*"],
      message:
        "There is no @/ alias inside contracts: import relatively, or another domain through ../<domain>/contract.",
    },
  ],
};

export default tseslint.config(
  { ignores: ["node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["src/**/*.ts", "*.ts", "*.js"],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.node } },
    plugins: { "unused-imports": unusedImports },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "no-console": "error",
      "prefer-const": "error",
      "no-var": "error",
      "no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
      "no-restricted-imports": ["error", noRuntime],
      "max-lines": ["error", { max: 600, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 50, skipBlankLines: true, skipComments: true }],
      "max-params": ["warn", 5],
      "max-depth": ["warn", 4],
    },
  },
  { files: ["src/**/*.test.ts"], rules: { "max-lines-per-function": "off" } },
  eslintPluginPrettier,
);
