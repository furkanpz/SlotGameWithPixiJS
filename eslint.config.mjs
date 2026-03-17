import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";

const sharedTypeScriptRules = {
  ...tsPlugin.configs.recommended.rules,
  "no-empty": ["error", { allowEmptyCatch: true }],
  "no-undef": "off",
  "no-unused-vars": "off",
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrors: "none",
    },
  ],
};

export default [
  {
    ignores: [
      "dist/**",
      "build/**",
      "coverage/**",
      "node_modules/**",
      "backend/node_modules/**",
      "backend/out/**",
      "backend/dist/**",
      "docs/**/*.png",
      "public/**/*.json",
    ],
  },
  {
    ...js.configs.recommended,
    files: ["scripts/**/*.mjs", "eslint.config.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["src/**/*.ts", "backend/src/**/*.ts", "vite.config.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: sharedTypeScriptRules,
  },
];
