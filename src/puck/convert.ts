/**
 * Konvertering mellom kontraktens Block[] og Pucks Data-format.
 * Puck lagrer { content: [{ type, props }], root }. Vi lagrer Block[] i CMS.
 */
import type { Data } from "@puckeditor/core";
import {
  block as blockSchema,
  type Block,
  type Page,
  type RichText,
} from "@/content/schema";

const typeToComponent: Record<Block["_type"], string> = {
  hero: "Hero",
  text: "Text",
  textImage: "TextImage",
  cardGrid: "CardGrid",
  people: "People",
  latestArticles: "LatestArticles",
  gallery: "Gallery",
  quote: "Quote",
  faq: "Faq",
  contactForm: "ContactForm",
  embed: "Embed",
  cta: "Cta",
  stats: "Stats",
};
const componentToType = Object.fromEntries(
  Object.entries(typeToComponent).map(([k, v]) => [v, k]),
) as Record<string, Block["_type"]>;

export type PuckRootProps = { title: string };

export function blocksToPuck(
  page: Page,
): Data<Record<string, Record<string, unknown>>, PuckRootProps> {
  return {
    root: { props: { title: page.title } },
    content: page.blocks.map((b) => {
      const { _type, id, ...props } = b;
      return { type: typeToComponent[_type], props: { ...props, id } };
    }),
  };
}

export function puckToBlocks(data: Data): { title?: string; blocks: Block[] } {
  const blocks = data.content.map((item, i) => {
    const _type = componentToType[item.type];
    if (!_type) throw new Error(`Ukjent Puck-komponent: ${item.type}`);
    const { id, ...rest } = item.props as Record<string, unknown> & { id?: string };
    return blockSchema.parse({ _type, id: id ?? `b-${i}-${Date.now()}`, ...rest });
  });
  const title = (data.root?.props as PuckRootProps | undefined)?.title;
  return { title, blocks };
}

/**
 * Enkel tekst -> RichText for Puck-feltene (v1). Én linje = ett avsnitt.
 * "## " = overskrift 2, "### " = overskrift 3, "- " = punktliste, "> " = sitat.
 * CMS-adapterne (WordPress/Payload) har egne, rikere editorer.
 */
export function plainToRichText(input: string): RichText {
  return input
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("## "))
        return {
          _type: "block" as const,
          style: "h2" as const,
          children: [{ _type: "span" as const, text: line.slice(3), marks: [] }],
        };
      if (line.startsWith("### "))
        return {
          _type: "block" as const,
          style: "h3" as const,
          children: [{ _type: "span" as const, text: line.slice(4), marks: [] }],
        };
      if (line.startsWith("> "))
        return {
          _type: "block" as const,
          style: "blockquote" as const,
          children: [{ _type: "span" as const, text: line.slice(2), marks: [] }],
        };
      if (line.startsWith("- "))
        return {
          _type: "block" as const,
          style: "normal" as const,
          listItem: "bullet" as const,
          level: 1,
          children: [{ _type: "span" as const, text: line.slice(2), marks: [] }],
        };
      return {
        _type: "block" as const,
        style: "normal" as const,
        children: [{ _type: "span" as const, text: line, marks: [] }],
      };
    });
}

export function richTextToPlain(value: RichText): string {
  return value
    .map((n) => {
      if (n._type === "image") return "";
      const text = n.children.map((c) => c.text).join("");
      if (n.listItem) return `- ${text}`;
      if (n.style === "h2") return `## ${text}`;
      if (n.style === "h3") return `### ${text}`;
      if (n.style === "blockquote") return `> ${text}`;
      return text;
    })
    .filter(Boolean)
    .join("\n\n");
}
