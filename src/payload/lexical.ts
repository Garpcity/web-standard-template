import type { RichText } from "@/content/schema";

/** RichText (kontrakt) → Lexical (Payload). Brukes av seed og agent-utkast. */
export function richTextToLexical(rt: RichText) {
  const text = (t: string, format = 0) => ({
    type: "text",
    text,
    format,
    detail: 0,
    mode: "normal",
    style: "",
    version: 1,
  });
  const spans = (children: Extract<RichText[number], { _type: "block" }>["children"]) =>
    children.map((c) => {
      let format = 0;
      if (c.marks.includes("strong")) format |= 1;
      if (c.marks.includes("em")) format |= 2;
      if (c.marks.includes("underline")) format |= 8;
      if (c.marks.includes("code")) format |= 16;
      const node = text(c.text, format);
      return c.href
        ? {
            type: "link",
            fields: { url: c.href, newTab: true, linkType: "custom" },
            children: [node],
            direction: "ltr",
            format: "",
            indent: 0,
            version: 3,
          }
        : node;
    });
  const children: unknown[] = [];
  let list: {
    type: "list";
    listType: "bullet" | "number";
    tag: "ul" | "ol";
    children: unknown[];
  } | null = null;
  const flush = () => {
    if (list)
      children.push({
        ...list,
        direction: "ltr",
        format: "",
        indent: 0,
        start: 1,
        version: 1,
      });
    list = null;
  };
  for (const n of rt) {
    if (n._type !== "block") continue;
    if (n.listItem) {
      const lt = n.listItem;
      if (!list || list.listType !== lt) {
        flush();
        list = {
          type: "list",
          listType: lt,
          tag: lt === "number" ? "ol" : "ul",
          children: [],
        };
      }
      list.children.push({
        type: "listitem",
        children: spans(n.children),
        direction: "ltr",
        format: "",
        indent: 0,
        value: list.children.length + 1,
        version: 1,
      });
      continue;
    }
    flush();
    const base = {
      children: spans(n.children),
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    };
    if (n.style === "normal")
      children.push({ type: "paragraph", ...base, textFormat: 0 });
    else if (n.style === "blockquote") children.push({ type: "quote", ...base });
    else children.push({ type: "heading", tag: n.style, ...base });
  }
  flush();
  return {
    root: { type: "root", children, direction: "ltr", format: "", indent: 0, version: 1 },
  };
}
