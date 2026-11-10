import type { BlockOf } from "@/content";
import { Section } from "@/components/ui/Section";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/motion/Reveal";

export function Quote({ block }: { block: BlockOf<"quote"> }) {
  return (
    <Section tone={block.tone} id={block.anchor} narrow>
      <Reveal>
        <figure className="text-center">
          <blockquote className="font-display text-2xl leading-snug font-medium md:text-3xl">
            «{block.quote}»
          </blockquote>
          {(block.author || block.role) && (
            <figcaption className="mt-6 flex items-center justify-center gap-3 text-sm opacity-80">
              {block.image && (
                <span className="size-10 overflow-hidden rounded-pill">
                  <SmartImage
                    image={block.image}
                    sizes="40px"
                    className="h-full object-cover"
                  />
                </span>
              )}
              <span>
                {block.author && <strong className="font-medium">{block.author}</strong>}
                {block.role && <span>, {block.role}</span>}
              </span>
            </figcaption>
          )}
        </figure>
      </Reveal>
    </Section>
  );
}
