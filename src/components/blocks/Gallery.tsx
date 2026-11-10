import type { BlockOf } from "@/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { SmartImage } from "@/components/ui/SmartImage";
import { Stagger, RevealChild } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

export function Gallery({ block }: { block: BlockOf<"gallery"> }) {
  const masonry = block.layout === "masonry";
  return (
    <Section tone={block.tone} id={block.anchor}>
      <SectionHeading heading={block.heading} />
      <Stagger
        className={cn(
          masonry
            ? "columns-2 gap-4 md:columns-3"
            : "grid grid-cols-2 gap-4 md:grid-cols-3",
        )}
        as="ul"
      >
        {block.images.map((img, i) => (
          <RevealChild
            key={i}
            as="li"
            className={cn(masonry && "mb-4 break-inside-avoid")}
          >
            <figure className="overflow-hidden rounded-md">
              <SmartImage
                image={img}
                sizes="(min-width: 768px) 33vw, 50vw"
                className={cn(!masonry && "aspect-square object-cover")}
              />
              {img.caption && (
                <figcaption className="mt-1 text-xs text-fg-muted">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          </RevealChild>
        ))}
      </Stagger>
    </Section>
  );
}
