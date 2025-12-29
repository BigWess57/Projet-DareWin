import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
    tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    ...nextVitals,
    // Override default ignores of eslint-config-next.
    globalIgnores([
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: { globals: globals.browser },
        rules: {
            // Disable this rule because TypeScript handles it automatically.
            "no-undef": "off",
            "no-unused-vars": "off",
            // This understands Enums, Interfaces, and Types correctly.
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            "react/react-in-jsx-scope": "off",
            // Dapp components often bloat with ABI types and useEffects.
            // If it hits 300, it likely needs to be split into sub-components or hooks.
            "max-lines": [
                "warn",
                { max: 300, skipBlankLines: true, skipComments: true },
            ],
            // "max-lines-per-function": [
            //     "warn",
            //     { max: 100, skipBlankLines: true, skipComments: true },
            // ],
            // complexity: ["warn", 10], // 15 is generous; try 10 for strict mode
            // "max-depth": ["warn", 3],
        },
    },
]);
