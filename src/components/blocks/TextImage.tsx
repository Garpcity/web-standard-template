import type { BlockOf } from "@/content";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { RichText } from "@/components/RichText";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

export function TextImage({ block }: { block: BlockOf<"textImage"> }) {
  const imageLeft = block.imagePosition === "left";
  return (
    <Section tone={block.tone} id={block.anchor}>
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal
          className={cn(
            "overflow-hidden rounded-card",
            imageLeft ? "lg:order-1" : "lg:order-2",
          )}
        >
          <SmartImage image={block.image} />
        </Reveal>
        <Reveal className={imageLeft ? "lg:order-2" : "lg:order-1"} delay={0.1}>
          {block.heading && (
            <h2 className="mb-6 text-3xl font-semibold">{block.heading}</h2>
          )}
          <RichText value={block.body} />
          {block.link && (
            <div className="mt-8">
              <Button
                href={block.link.href}
                external={block.link.external}
                variant={block.link.variant}
              >
                {block.link.label}
              </Button>
            </div>
          )}
        </Reveal>
      </div>
    </Section>
  );
}
