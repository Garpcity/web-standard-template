/**
 * Markdown → RichText. Bevisst lite: overskrifter (##–####), avsnitt, punkt-/nummerlister,
 * sitat, og inline fet/kursiv/kode/lenker. Det er det agenter trenger for å levere innhold
 * uten å kjenne RichText-formatet. Ingen HTML, ingen tabeller (bruk blokker for det).
 */
import type { RichText, RichTextNode } from "./schema";

type Span = {
  _type: "span";
  text: string;
  marks: ("strong" | "em" | "code" | "underline")[];
  href?: string;
};

export function parseInline(src: string): Span[] {
  const spans: Span[] = [];
  const re =
    /(\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_(.+?)_|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last)
      spans.push({ _type: "span", text: src.slice(last, m.index), marks: [] });
    if (m[2] ?? m[3])
      spans.push({ _type: "span", text: (m[2] ?? m[3])!, marks: ["strong"] });
    else if (m[4] ?? m[5])
      spans.push({ _type: "span", text: (m[4] ?? m[5])!, marks: ["em"] });
    else if (m[6]) spans.push({ _type: "span", text: m[6], marks: ["code"] });
    else if (m[7]) spans.push({ _type: "span", text: m[7], marks: [], href: m[8] });
    last = m.index + m[0].length;
  }
  if (last < src.length) spans.push({ _type: "span", text: src.slice(last), marks: [] });
  return spans.length ? spans : [{ _type: "span", text: "", marks: [] }];
}

export function markdownToRichText(md: string): RichText {
  const nodes: RichTextNode[] = [];
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let para: string[] = [];
  const flush = () => {
    if (!para.length) return;
    nodes.push({
      _type: "block",
      style: "normal",
      children: parseInline(para.join(" ").trim()),
    });
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      flush();
      const level = Math.min(Math.max(h[1].length, 2), 4) as 2 | 3 | 4;
      nodes.push({ _type: "block", style: `h${level}`, children: parseInline(h[2]) });
      continue;
    }
    const q = /^>\s?(.*)$/.exec(line);
    if (q) {
      flush();
      nodes.push({ _type: "block", style: "blockquote", children: parseInline(q[1]) });
      continue;
    }
    const li = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (li) {
      flush();
      const level = (Math.min(Math.floor(li[1].length / 2), 2) + 1) as 1 | 2 | 3;
      nodes.push({
        _type: "block",
        style: "normal",
        listItem: /\d/.test(li[2]) ? "number" : "bullet",
        level,
        children: parseInline(li[3]),
      });
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return nodes;
}
