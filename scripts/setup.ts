/**
 * setup.ts – interaktivt oppsett av et nytt prosjekt fra templaten.
 * Kjør: pnpm setup
 *
 * Bytter navn, slug og beskrivelse i site.json, site.config.ts, package.json og
 * AGENTS.md, og skriver .env.local fra .env.example. Studio (fase 7) kaller
 * det samme via GitHub-API.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q: string, def: string) =>
  (await rl.question(`${q} [${def}]: `)).trim() || def;

async function replaceIn(file: string, pairs: [RegExp | string, string][]) {
  const p = path.join(process.cwd(), file);
  let s = await fs.readFile(p, "utf8");
  for (const [from, to] of pairs) s = s.replace(from, to);
  await fs.writeFile(p, s);
}

async function main() {
  const name = await ask("Kundens navn", "Nordvik Digital");
  const slug = await ask(
    "Teknisk slug",
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
  );
  const description = await ask(
    "Én setning om bedriften",
    "Vi bygger nettsider for norske bedrifter.",
  );
  const cms = await ask("CMS (mock | wordpress | payload)", "mock");
  rl.close();

  await replaceIn("package.json", [
    [/"name": "web-standard-template"/, `"name": "${slug}"`],
  ]);
  await replaceIn("site.config.ts", [
    [/slug: "web-standard-template"/, `slug: "${slug}"`],
  ]);
  await replaceIn("AGENTS.md", [
    [
      /- Navn: `web-standard-template` \(byttes ved `pnpm setup`\)/,
      `- Navn: \`${slug}\` (${name})`,
    ],
    [
      /- CMS: `CMS_PROVIDER` i `.env.local` – `mock` \(standard i template\), `wordpress`, `payload`/,
      `- CMS: \`${cms}\``,
    ],
  ]);

  const siteFile = path.join(process.cwd(), "src/content/adapters/mock/data/site.json");
  const site = JSON.parse(await fs.readFile(siteFile, "utf8"));
  site.name = name;
  site.description = description;
  await fs.writeFile(siteFile, JSON.stringify(site, null, 2) + "\n");

  const envExample = await fs.readFile(path.join(process.cwd(), ".env.example"), "utf8");
  await fs.writeFile(
    path.join(process.cwd(), ".env.local"),
    envExample.replace("CMS_PROVIDER=mock", `CMS_PROVIDER=${cms}`),
  );

  console.log(
    `\nFerdig. Neste: pnpm dev → http://localhost:3000\nHusk å oppdatere tokens.css, profilmanualen (brand-guide.json) og README med avvik fra standard.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
