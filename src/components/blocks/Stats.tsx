import type { BlockOf } from "@/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Stagger, RevealChild } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";

export function Stats({ block }: { block: BlockOf<"stats"> }) {
  return (
    <Section tone={block.tone} id={block.anchor}>
      <SectionHeading heading={block.heading} align="center" />
      <Stagger className="grid grid-cols-2 gap-8 md:grid-cols-4" as="ul">
        {block.items.map((s) => (
          <RevealChild key={s.id} as="li" scale className="text-center">
            <p className="font-display text-4xl font-semibold text-brand md:text-5xl">
              <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm text-fg-muted">{s.label}</p>
          </RevealChild>
        ))}
      </Stagger>
    </Section>
  );
}
