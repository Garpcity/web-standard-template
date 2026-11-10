import Link from "next/link";
import * as icons from "lucide-react";
import type { BlockOf } from "@/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { SmartImage } from "@/components/ui/SmartImage";
import { Stagger, RevealChild } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

const cols = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
};

function Icon({ name }: { name: string }) {
  const pascal = name
    .split(/[-_\s]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  const Cmp = (icons as unknown as Record<string, icons.LucideIcon | undefined>)[pascal];
  if (!Cmp) return null;
  return <Cmp className="size-6 text-accent" aria-hidden />;
}

export function CardGrid({ block }: { block: BlockOf<"cardGrid"> }) {
  return (
    <Section tone={block.tone} id={block.anchor}>
      <SectionHeading heading={block.heading} lead={block.lead} />
      <Stagger className={cn("grid gap-6", cols[block.columns])} as="ul">
        {block.items.map((item) => (
          <RevealChild key={item.id} as="li" className="h-full">
            <Card className="flex h-full flex-col p-0">
              {item.image && (
                <div className="aspect-[3/2] overflow-hidden rounded-t-card">
                  <SmartImage
                    image={item.image}
                    className="h-full object-cover"
                    sizes="(min-width: 768px) 33vw, 100vw"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                {item.icon && !item.image && (
                  <div className="mb-4 inline-flex size-11 items-center justify-center rounded-md bg-accent-soft">
                    <Icon name={item.icon} />
                  </div>
                )}
                <h3 className="text-xl font-semibold">{item.title}</h3>
                {item.text && <p className="mt-2 flex-1 text-fg-muted">{item.text}</p>}
                {item.link && (
                  <Link
                    href={item.link.href}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                  >
                    {item.link.label} <icons.ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
              </div>
            </Card>
          </RevealChild>
        ))}
      </Stagger>
    </Section>
  );
}
