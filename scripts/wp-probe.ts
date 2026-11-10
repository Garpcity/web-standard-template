/**
 * Genererer en WP-CLI-fil som kjører alle adapterets GraphQL-spørringer mot et ekte WordPress
 * og skriver svaret som JSON. Resultatet brukes som fixture i tests/unit/wordpress-adapter.test.ts,
 * så fixturen alltid speiler `queries.ts`.
 *
 *   pnpm tsx scripts/wp-probe.ts > wp-probe.php
 *   wp eval-file wp-probe.php            # i WordPress-roten (eller via Studio)
 *   cp probe-result.json tests/fixtures/wpgraphql-probe.json
 */
import { Q } from "../src/content/adapters/wordpress/queries";

const variables: Record<keyof typeof Q, unknown> = {
  settings: {},
  menu: { location: "MAIN" },
  pageBySlug: { slug: "tjenester" },
  frontPage: {},
  pages: {},
  posts: { first: 10, categoryId: null, status: ["PUBLISH"] },
  postBySlug: { slug: "slik-blir-bedriften-din-sitert-av-ai" },
  people: {},
  personById: { id: "5" },
  categories: {},
};

const php = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

const lines = ["<?php", "$out = [];"];
for (const [name, query] of Object.entries(Q)) {
  const vars = JSON.stringify(variables[name as keyof typeof Q]);
  lines.push(
    `$out[${php(name)}] = graphql(["query" => ${php(query)}, "variables" => json_decode(${php(vars)}, true)]);`,
  );
}
lines.push(
  `foreach ($out as $k => $r) { unset($r["extensions"]); $out[$k] = $r; }`,
  `file_put_contents(dirname(__FILE__) . "/probe-result.json", json_encode($out, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT));`,
  `WP_CLI::success("probe skrevet");`,
);
process.stdout.write(lines.join("\n") + "\n");
