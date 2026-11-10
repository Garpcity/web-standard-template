import type { BlockOf } from "@/content";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { HeroParallax } from "@/components/motion/HeroParallax";
import { cn, toneClasses } from "@/lib/utils";

export function Hero({ block }: { block: BlockOf<"hero"> }) {
  const { eyebrow, heading, lead, image, links, layout, tone } = block;
  const centered = layout === "centered" || !image;

  return (
    <section
      id={block.anchor}
      className={cn("relative overflow-hidden", toneClasses[tone])}
    >
      {layout === "fullBleed" && image && (
        <div className="absolute inset-0 -z-10">
          <SmartImage image={image} fill priority sizes="100vw" className="opacity-40" />
        </div>
      )}
      <div
        className={cn(
          "container-site grid items-center gap-12 py-section",
          !centered && layout !== "fullBleed" && "lg:grid-cols-2",
        )}
      >
        <div className={cn("hero-in", centered && "mx-auto max-w-3xl text-center")}>
          {eyebrow && (
            <p className="mb-4 text-sm font-medium tracking-wide text-accent-strong uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="text-4xl font-semibold md:text-5xl">{heading}</h1>
          {lead && (
            <p
              className="mt-6 max-w-xl text-lg text-fg-muted md:text-xl"
              style={centered ? { marginInline: "auto" } : undefined}
            >
              {lead}
            </p>
          )}
          {links.length > 0 && (
            <div
              className={cn("mt-8 flex flex-wrap gap-3", centered && "justify-center")}
            >
              {links.map((l) => (
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
          )}
        </div>
        {image && layout === "split" && (
          <HeroParallax className="hero-in-delayed relative aspect-[4/3] overflow-hidden rounded-card shadow-lg">
            <SmartImage
              image={image}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </HeroParallax>
        )}
      </div>
    </section>
  );
}
