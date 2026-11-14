import { promises as fs } from "node:fs";
import { expect, it } from "vitest";
import { z } from "zod";
import * as schema from "@/content/schema";

const gen = (s: z.ZodType, comment: string) =>
  JSON.stringify(
    { $comment: comment, ...z.toJSONSchema(s, { target: "draft-7", io: "input" }) },
    null,
    2,
  ) + "\n";

it("generated stemmer", async () => {
  expect(await fs.readFile("generated/json-schema/blocks/dataTable.json", "utf8")).toBe(
    gen(
      schema.dataTableBlock,
      "Generert fra src/content/schema/blocks.ts – ikke rediger manuelt",
    ),
  );
  expect(await fs.readFile("generated/json-schema/page.json", "utf8")).toBe(
    gen(schema.page, "Generert fra src/content/schema – ikke rediger manuelt"),
  );
});
