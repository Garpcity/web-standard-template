import type { BlockOf } from "@/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { RichText } from "@/components/RichText";
import { Reveal } from "@/components/motion/Reveal";

/** FAQ med native <details>: tilgjengelig, uten JS, og AEO-vennlig (FAQPage-skjema settes av siden). */
export function Faq({ block }: { block: BlockOf<"faq"> }) {
  return (
    <Section tone={block.tone} id={block.anchor} narrow>
      <SectionHeading heading={block.heading} lead={block.lead} />
      <Reveal>
        <div className="divide-y divide-border rounded-card border border-border bg-surface">
          {block.items.map((item) => (
            <details key={item.id} className="group px-6 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                {item.question}
                <span
                  className="shrink-0 text-fg-muted transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <div className="pt-3 text-fg-muted">
                <RichText value={item.answer} />
              </div>
            </details>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
