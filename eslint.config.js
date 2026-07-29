import js from "@eslint/js";
import pluginQuery from "@tanstack/eslint-plugin-query";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/routeTree.gen.ts",
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  {
    files: ["apps/web/**/*.{ts,tsx}", "packages/ui/**/*.{ts,tsx}"],
    extends: [
      reactHooks.configs.flat["recommended-latest"],
      jsxA11y.flatConfigs.recommended,
      ...pluginQuery.configs["flat/recommended"],
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },

  {
    files: [
      "packages/api/**/*.ts",
      "packages/db/**/*.ts",
      "apps/server/**/*.ts",
    ],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    files: ["**/*.tsx"],
    rules: {
      "react-hooks/incompatible-library": "off",
    },
  },

  {
    files: ["apps/web/src/routes/**/*.tsx"],
    rules: {
      "@typescript-eslint/only-throw-error": "off",
    },
  },

  {
    files: [
      "apps/web/src/routes/_auth/route.tsx",
      "apps/web/src/routes/_auth/dashboard.tsx",
    ],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
    },
  },

  {
    files: ["packages/ui/src/components/**/*.tsx"],
    rules: {
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
    },
  },

  {
    files: ["**/*.config.{js,ts,mjs}", "eslint.config.js", "scripts/**/*.ts"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
