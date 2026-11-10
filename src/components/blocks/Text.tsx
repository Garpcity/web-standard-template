import type { BlockOf } from "@/content";
import { Section } from "@/components/ui/Section";
import { RichText } from "@/components/RichText";
import { Reveal } from "@/components/motion/Reveal";

export function Text({ block }: { block: BlockOf<"text"> }) {
  return (
    <Section tone={block.tone} id={block.anchor} narrow={block.width === "narrow"}>
      <Reveal>
        {block.heading && (
          <h2 className="mb-6 text-3xl font-semibold">{block.heading}</h2>
        )}
        <RichText value={block.body} />
      </Reveal>
    </Section>
  );
}
