/**
 * generate-schema.ts – genererer CMS-definisjoner fra Zod-skjemaene.
 * Kjør: pnpm generate:schema. CI feiler hvis generated/ ikke er oppdatert.
 *
 * Nå: JSON Schema per innholdstype og blokk (generated/json-schema/), som er
 * kilden for ACF Local JSON (fase 3) og Payload-collections (fase 4).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import * as schema from "../src/content/schema";

const out = path.join(process.cwd(), "generated/json-schema");

const documents: Record<string, z.ZodType> = {
  siteSettings: schema.siteSettings,
  menu: schema.menu,
  page: schema.page,
  article: schema.article,
  person: schema.person,
  category: schema.category,
  media: schema.media,
  formSubmission: schema.formSubmission,
  redirect: schema.redirect,
  brandGuide: schema.brandGuide,
};

async function main() {
  await fs.rm(out, { recursive: true, force: true });
  await fs.mkdir(path.join(out, "blocks"), { recursive: true });

  const stable = (obj: unknown) => JSON.stringify(obj, null, 2) + "\n";

  for (const [name, s] of Object.entries(documents)) {
    const json = z.toJSONSchema(s, { target: "draft-7", io: "input" });
    await fs.writeFile(
      path.join(out, `${name}.json`),
      stable({
        $comment: `Generert fra src/content/schema – ikke rediger manuelt`,
        ...json,
      }),
    );
  }
  for (const [name, s] of Object.entries(schema.blockSchemas)) {
    const json = z.toJSONSchema(s, { target: "draft-7", io: "input" });
    await fs.writeFile(
      path.join(out, "blocks", `${name}.json`),
      stable({
        $comment: `Generert fra src/content/schema/blocks.ts – ikke rediger manuelt`,
        ...json,
      }),
    );
  }
  const index = {
    generatedFrom: "src/content/schema",
    documents: Object.keys(documents),
    blocks: Object.keys(schema.blockSchemas),
  };
  await fs.writeFile(path.join(out, "index.json"), stable(index));
  console.log(
    `Skjema generert: ${Object.keys(documents).length} dokumenter, ${Object.keys(schema.blockSchemas).length} blokker → generated/json-schema/`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
