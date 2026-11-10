import type { BlockOf } from "@/content";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

export function Cta({ block }: { block: BlockOf<"cta"> }) {
  return (
    <Section tone={block.tone} id={block.anchor}>
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold md:text-4xl">{block.heading}</h2>
        {block.text && <p className="mt-4 text-lg opacity-85">{block.text}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {block.links.map((l) => (
            <Button
              key={l.href + l.label}
              href={l.href}
              external={l.external}
              variant={l.variant}
              size="lg"
            >
              {l.label}
            </Button>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
