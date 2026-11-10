import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "n8n/**",
  ]),
  {
    // Standardregel: frontend importerer aldri direkte fra en CMS-adapter.
    // Alt innhold går gjennom kontrakten i src/content/index.ts.
    files: ["src/app/**", "src/components/**", "src/puck/**", "src/seo/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/content/adapters/*", "**/content/adapters/*"],
              message:
                "Importer fra '@/content' (kontrakten), ikke direkte fra en adapter.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
