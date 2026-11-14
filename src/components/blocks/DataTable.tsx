import Link from "next/link";
import type { BlockOf } from "@/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

type Props = { block: BlockOf<"dataTable"> };

/** Celler som bare består av tall, mellomrom, skilletegn, % og tankestrek høyrejusteres. */
const numericCell = /^[\d\s.,%–-]+$/;

function isNumericCell(value: string): boolean {
  return numericCell.test(value.trim());
}

/**
 * Tabell med kilde. Semantisk <table> for skjermlesere og AI-søk; horisontal
 * scroll på smale skjermer i stedet for stabling. Tabellen ligger på et eget
 * kort (bg-surface/text-fg), så kontrasten er riktig uansett `tone`.
 */
export function DataTable({ block }: Props) {
  const captionText = block.heading ?? block.caption ?? block.columns.join(", ");
  return (
    <Section tone={block.tone} id={block.anchor} narrow={block.width === "narrow"}>
      <SectionHeading heading={block.heading} lead={block.lead} />
      <Reveal className="overflow-hidden rounded-card border border-border bg-surface text-fg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            {/* Synlig overskrift er SectionHeading over; caption er alltid med for skjermlesere. */}
            <caption className="sr-only">{captionText}</caption>
            <thead className="bg-surface-muted">
              <tr>
                {block.columns.map((col, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="border-b border-border px-4 py-3 font-semibold whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-b border-border last:border-b-0">
                  {row.map((cell, c) => {
                    const className = cn(
                      "px-4 py-3 align-top",
                      isNumericCell(cell) && "text-right tabular-nums whitespace-nowrap",
                    );
                    return c === 0 && block.firstColumnIsHeader ? (
                      <th key={c} scope="row" className={cn(className, "font-medium")}>
                        {cell}
                      </th>
                    ) : (
                      <td key={c} className={className}>
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(block.caption || block.source) && (
          <div className="space-y-1 border-t border-border px-4 py-3 text-xs text-fg-muted">
            {block.caption && <p>{block.caption}</p>}
            {block.source && (
              <p>
                Kilde:{" "}
                {block.source.external ? (
                  <a
                    href={block.source.href}
                    target="_blank"
                    rel="noopener"
                    className="underline underline-offset-2 hover:text-fg"
                  >
                    {block.source.label}
                  </a>
                ) : (
                  <Link
                    href={block.source.href}
                    className="underline underline-offset-2 hover:text-fg"
                  >
                    {block.source.label}
                  </Link>
                )}
              </p>
            )}
          </div>
        )}
      </Reveal>
    </Section>
  );
}
