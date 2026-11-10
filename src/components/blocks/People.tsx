import type { BlockOf, Person } from "@/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { SmartImage } from "@/components/ui/SmartImage";
import { Stagger, RevealChild } from "@/components/motion/Reveal";

/** Data hentes av BlockRenderer (server) og sendes inn som `people`. */
export function People({
  block,
  people,
}: {
  block: BlockOf<"people">;
  people: Person[];
}) {
  return (
    <Section tone={block.tone} id={block.anchor}>
      <SectionHeading heading={block.heading} lead={block.lead} />
      <Stagger className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" as="ul">
        {people.map((person) => (
          <RevealChild key={person.id} as="li">
            <article className="flex gap-4">
              {person.image && (
                <div className="size-20 shrink-0 overflow-hidden rounded-pill">
                  <SmartImage
                    image={person.image}
                    className="h-full object-cover"
                    sizes="80px"
                  />
                </div>
              )}
              <div>
                <h3 className="font-semibold">{person.name}</h3>
                {person.role && <p className="text-sm text-fg-muted">{person.role}</p>}
                {person.knowsAbout.length > 0 && (
                  <p className="mt-2 text-xs text-fg-muted">
                    {person.knowsAbout.slice(0, 3).join(" · ")}
                  </p>
                )}
              </div>
            </article>
          </RevealChild>
        ))}
      </Stagger>
    </Section>
  );
}
