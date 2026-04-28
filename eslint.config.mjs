import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettierPlugin from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";

const typescriptRules = {
  ...tsPlugin.configs.recommended.rules,
  ...eslintConfigPrettier.rules,
  "prettier/prettier": "error",
  "@typescript-eslint/no-explicit-any": "off",
};

export default [
  {
    ignores: ["coverage/**", "dist/**", "node_modules/**"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
    },
    rules: typescriptRules,
  },
];
