import type { BlockOf } from "@/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";

const aspects = { "16/9": "aspect-video", "4/3": "aspect-[4/3]", "1/1": "aspect-square" };

function toEmbedSrc(provider: BlockOf<"embed">["provider"], src: string) {
  if (provider === "youtube") {
    const id = src.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : src;
  }
  if (provider === "vimeo") {
    const id = src.match(/vimeo\.com\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}?dnt=1` : src;
  }
  return src;
}

export function Embed({ block }: { block: BlockOf<"embed"> }) {
  return (
    <Section tone={block.tone} id={block.anchor} narrow>
      <SectionHeading heading={block.heading} />
      <Reveal>
        <div
          className={`${aspects[block.aspect]} overflow-hidden rounded-card bg-surface-muted`}
        >
          <iframe
            src={toEmbedSrc(block.provider, block.src)}
            title={block.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="size-full border-0"
          />
        </div>
      </Reveal>
    </Section>
  );
}
