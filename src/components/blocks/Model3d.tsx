import type { BlockOf } from "@/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { Model3dViewer } from "@/components/three/Model3dViewer";
import { cn, toneClasses } from "@/lib/utils";

/** 3D-blokk: glb fra Cinema 4D eller demo-geometri. Fallback til poster alltid. */
export function Model3d({ block }: { block: BlockOf<"model3d"> }) {
  const h = block.height === "tall" ? "h-[70vh] min-h-[420px]" : "h-[52vh] min-h-[320px]";
  const viewer = (
    <Model3dViewer
      src={block.src}
      alt={block.alt}
      poster={block.poster}
      autoRotate={block.autoRotate}
      interactive={block.interactive}
      className={cn("rounded-card", h)}
    />
  );

  if (block.layout === "hero") {
    return (
      <section
        id={block.anchor}
        className={cn("relative overflow-hidden", toneClasses[block.tone])}
      >
        <div className="container-site grid items-center gap-10 py-section lg:grid-cols-2">
          <div className="hero-in">
            {block.heading && (
              <h2 className="text-4xl font-semibold md:text-5xl">{block.heading}</h2>
            )}
            {block.lead && (
              <p className="mt-6 text-lg opacity-85 md:text-xl">{block.lead}</p>
            )}
          </div>
          <div className="hero-in-delayed">{viewer}</div>
        </div>
      </section>
    );
  }

  return (
    <Section tone={block.tone} id={block.anchor}>
      <SectionHeading heading={block.heading} lead={block.lead} align="center" />
      <Reveal>{viewer}</Reveal>
    </Section>
  );
}
