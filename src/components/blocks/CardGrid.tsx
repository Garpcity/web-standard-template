import { createElement } from "react";
import Link from "next/link";
import type { BlockOf } from "@/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { SmartImage } from "@/components/ui/SmartImage";
import { Stagger, RevealChild } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import { icons, resolveIcon } from "@/design/icons";

const ArrowIcon = icons["arrow-right"];

const cols = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
};

function Icon({ name }: { name: string }) {
  const icon = resolveIcon(name);
  if (!icon) return null;
  return createElement(icon, { className: "size-6 text-accent", "aria-hidden": true });
}

export function CardGrid({
  block,
  aboveFold = false,
}: {
  block: BlockOf<"cardGrid">;
  aboveFold?: boolean;
}) {
  return (
    <Section tone={block.tone} id={block.anchor}>
      <SectionHeading heading={block.heading} lead={block.lead} />
      <Stagger className={cn("grid gap-6", cols[block.columns])} as="ul">
        {block.items.map((item, i) => (
          <RevealChild
            key={item.id}
            as="li"
            className="h-full"
            eager={aboveFold && i === 0}
          >
            <Card className="flex h-full flex-col p-0">
              {item.image && (
                <div className="aspect-[3/2] overflow-hidden rounded-t-card">
                  <SmartImage
                    image={item.image}
                    className="h-full object-cover"
                    sizes="(min-width: 768px) 33vw, 100vw"
                    priority={aboveFold && i === 0}
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
                    {item.link.label} <ArrowIcon className="size-4" aria-hidden />
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
