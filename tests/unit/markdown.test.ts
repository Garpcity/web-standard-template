import { describe, expect, it } from "vitest";
import { markdownToRichText, parseInline } from "@/content/markdown";
import { richText } from "@/content/schema";

describe("markdownToRichText", () => {
  it("gir gyldig RichText for typisk agent-tekst", () => {
    const md = `## Hva vi testet

Agenten koblet til via **MCP** og lagret et *utkast* med [kilde](https://example.com).

- Punkt én
- Punkt to
  - Underpunkt

1. Første
2. Andre

> Et sitat`;
    const out = markdownToRichText(md);
    expect(() => richText.parse(out)).not.toThrow();
    expect(out[0]).toMatchObject({ style: "h2" });
    expect(out[1]).toMatchObject({ style: "normal" });
    expect(
      out.filter((n) => n._type === "block" && n.listItem === "bullet"),
    ).toHaveLength(3);
    expect(
      out.filter((n) => n._type === "block" && n.listItem === "number"),
    ).toHaveLength(2);
    expect(out.at(-1)).toMatchObject({ style: "blockquote" });
    const under = out.find(
      (n) => n._type === "block" && n.listItem === "bullet" && n.level === 2,
    );
    expect(under).toBeTruthy();
  });

  it("parser inline-markeringer og lenker", () => {
    const spans = parseInline("a **b** c `d` [e](https://x.no)");
    expect(spans.map((s) => s.text)).toEqual(["a ", "b", " c ", "d", " ", "e"]);
    expect(spans[1].marks).toEqual(["strong"]);
    expect(spans[3].marks).toEqual(["code"]);
    expect(spans[5].href).toBe("https://x.no");
  });

  it("klemmer # og ##### til h2–h4", () => {
    expect(markdownToRichText("# Tittel")[0]).toMatchObject({ style: "h2" });
    expect(markdownToRichText("#### Dyp")[0]).toMatchObject({ style: "h4" });
  });
});
