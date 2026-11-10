import { Fragment } from "react";
import type { RichText as RichTextType } from "@/content";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils";

type Props = { value: RichTextType; className?: string };

/** Rendrer normalisert rik tekst. Eneste komponent for brødtekst. */
export function RichText({ value, className }: Props) {
  const out: React.ReactNode[] = [];
  let listBuffer: { kind: "bullet" | "number"; items: React.ReactNode[] } | null = null;

  const flush = () => {
    if (!listBuffer) return;
    const Tag = listBuffer.kind === "number" ? "ol" : "ul";
    out.push(<Tag key={`l-${out.length}`}>{listBuffer.items}</Tag>);
    listBuffer = null;
  };

  value.forEach((node, i) => {
    if (node._type === "image") {
      flush();
      out.push(
        <figure key={i} className="my-8">
          <SmartImage image={node.image} className="rounded-card" />
          {node.image.caption && (
            <figcaption className="mt-2 text-sm text-fg-muted">
              {node.image.caption}
            </figcaption>
          )}
        </figure>,
      );
      return;
    }
    const content = node.children.map((span, j) => {
      let el: React.ReactNode = span.text;
      if (span.marks.includes("code")) el = <code key={j}>{el}</code>;
      if (span.marks.includes("em")) el = <em key={j}>{el}</em>;
      if (span.marks.includes("strong")) el = <strong key={j}>{el}</strong>;
      if (span.marks.includes("underline")) el = <u key={j}>{el}</u>;
      if (span.href) {
        const external = /^https?:\/\//.test(span.href);
        el = (
          <a
            key={j}
            href={span.href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {el}
          </a>
        );
      }
      return <Fragment key={j}>{el}</Fragment>;
    });

    if (node.listItem) {
      if (!listBuffer || listBuffer.kind !== node.listItem) {
        flush();
        listBuffer = { kind: node.listItem, items: [] };
      }
      listBuffer.items.push(<li key={i}>{content}</li>);
      return;
    }
    flush();
    switch (node.style) {
      case "h2":
        out.push(<h2 key={i}>{content}</h2>);
        break;
      case "h3":
        out.push(<h3 key={i}>{content}</h3>);
        break;
      case "h4":
        out.push(<h4 key={i}>{content}</h4>);
        break;
      case "blockquote":
        out.push(<blockquote key={i}>{content}</blockquote>);
        break;
      default:
        out.push(<p key={i}>{content}</p>);
    }
  });
  flush();

  return <div className={cn("prose-site", className)}>{out}</div>;
}
