/**
 * Skjema-paritet: Zod-skjemaene er kilden. Denne testen feiler i CI hvis
 * Payload-collections, WordPress-feltene, Puck-registreringen eller
 * BlockRenderer mangler noe som finnes i Zod – eller omvendt.
 */
import { promises as fs } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import * as schema from "@/content/schema";
import { lockedBlockFields } from "@/content/permissions";
import { siteConfig } from "../../site.config";
import { collections } from "@/payload/collections";
import { globals } from "@/payload/globals";

const keysOf = (s: z.ZodObject<z.ZodRawShape>) => Object.keys(s.shape);
const fieldNames = (fields: { name?: string; type: string }[]) =>
  // UI-felt (knapper, lenker) er ikke innhold og holdes utenfor pariteten.
  fields
    .filter((f) => "name" in f && f.name && f.type !== "ui")
    .map((f) => f.name as string);

/** Zod-nøkler som bevisst ikke er egne CMS-felt. */
const systemKeys = new Set(["id", "_type", "createdAt", "updatedAt"]);

describe("Blokker", () => {
  const zodBlocks = Object.keys(schema.blockSchemas);

  it("site.config lister alle blokker", () => {
    expect([...siteConfig.enabledBlocks].sort()).toEqual([...zodBlocks].sort());
  });

  it("permissions.ts har låste felt definert for alle blokker", () => {
    expect(Object.keys(lockedBlockFields).sort()).toEqual([...zodBlocks].sort());
    for (const [name, fields] of Object.entries(lockedBlockFields)) {
      const shape = keysOf(schema.blockSchemas[name as keyof typeof schema.blockSchemas]);
      for (const f of fields)
        expect(shape, `${name}.${f} finnes ikke i Zod`).toContain(f);
    }
  });

  it("Puck-config registrerer hver blokk og hver blokk har en komponent", async () => {
    const puck = await fs.readFile("src/puck/config.tsx", "utf8");
    const renderer = await fs.readFile("src/components/blocks/BlockRenderer.tsx", "utf8");
    const convert = await fs.readFile("src/puck/convert.ts", "utf8");
    for (const name of zodBlocks) {
      const comp = name.charAt(0).toUpperCase() + name.slice(1);
      expect(puck, `Puck mangler ${comp}`).toMatch(new RegExp(`\\n\\s+${comp}: \\{`));
      expect(renderer, `BlockRenderer mangler case "${name}"`).toContain(
        `case "${name}":`,
      );
      expect(convert, `convert.ts mangler ${name}`).toContain(`${name}: "${comp}"`);
      await expect(
        fs.stat(`src/components/blocks/${comp}.tsx`),
        `Komponent ${comp}.tsx mangler`,
      ).resolves.toBeTruthy();
    }
  });
});

describe("Payload speiler Zod", () => {
  const byslug = Object.fromEntries(collections.map((c) => [c.slug, c]));
  const gbyslug = Object.fromEntries(globals.map((g) => [g.slug, g]));

  const cases: [string, z.ZodObject<z.ZodRawShape>, string[], Record<string, string>][] =
    [
      // [collection, zod, ekstra Payload-felt som ikke er i Zod, Zod→Payload navnemap]
      ["pages", schema.page, ["status", "owner"], { ownerId: "owner" }],
      [
        "articles",
        schema.article,
        ["status"],
        { authorId: "author", categoryIds: "categories" },
      ],
      ["people", schema.person, ["status"], {}],
      ["categories", schema.category, [], {}],
      ["redirects", schema.redirect, [], {}],
      ["form-submissions", schema.formSubmission, [], {}],
    ];

  for (const [slug, zod, extra, map] of cases) {
    it(`${slug}`, () => {
      const payloadFields = fieldNames(
        byslug[slug].fields as { name?: string; type: string }[],
      );
      const expected = keysOf(zod)
        .filter((k) => !systemKeys.has(k))
        .map((k) => map[k] ?? k);
      for (const k of expected)
        expect(payloadFields, `${slug} mangler feltet ${k}`).toContain(k);
      for (const k of payloadFields) {
        if (!extra.includes(k))
          expect(expected, `${slug} har feltet ${k} som ikke finnes i Zod`).toContain(k);
      }
    });
  }

  it("globals: site-settings, menus, brand-guide", () => {
    const settings = fieldNames(
      gbyslug["site-settings"].fields as { name?: string; type: string }[],
    );
    for (const k of keysOf(schema.siteSettings)) expect(settings).toContain(k);
    const menus = fieldNames(
      gbyslug["menus"].fields as { name?: string; type: string }[],
    );
    expect(menus.sort()).toEqual(["footer", "legal", "main"]);
    const guide = fieldNames(
      gbyslug["brand-guide"].fields as { name?: string; type: string }[],
    );
    for (const k of keysOf(schema.brandGuide)) {
      if (k !== "updatedAt") expect(guide, `brand-guide mangler ${k}`).toContain(k);
    }
  });
});

describe("WordPress speiler Zod", () => {
  it("fields.php dekker artikkel- og personfeltene som ikke er innebygd i WP", async () => {
    const php = await fs.readFile(
      "wordpress/plugins/site-core/includes/fields.php",
      "utf8",
    );
    const snake = (s: string) => s.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
    const builtIn = new Set([
      "slug",
      "title",
      "name",
      "body",
      "bio",
      "image",
      "publishedAt",
      "categoryIds",
      "status",
      "seo",
      "authorId",
    ]);
    for (const k of keysOf(schema.article)) {
      if (systemKeys.has(k) || builtIn.has(k)) continue;
      expect(php, `post mangler '${snake(k)}'`).toContain(`'${snake(k)}'`);
    }
    for (const k of keysOf(schema.person)) {
      if (systemKeys.has(k) || builtIn.has(k)) continue;
      expect(php, `person mangler '${snake(k)}'`).toContain(`'${snake(k)}'`);
    }
    expect(php).toContain("'site_blocks'");
    expect(php).toContain("'author_person_id'");
  });
});
