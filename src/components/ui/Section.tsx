import { cn, toneClasses } from "@/lib/utils";

type Props = {
  tone?: keyof typeof toneClasses;
  id?: string;
  narrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Standard seksjon: tone-bakgrunn, vertikal luft fra --space-section, container. */
export function Section({ tone = "default", id, narrow, className, children }: Props) {
  return (
    <section id={id} className={cn("py-section", toneClasses[tone], className)}>
      <div className={narrow ? "container-narrow" : "container-site"}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  heading,
  lead,
  align = "left",
}: {
  heading?: string;
  lead?: string;
  align?: "left" | "center";
}) {
  if (!heading && !lead) return null;
  return (
    <div className={cn("mb-12 max-w-2xl", align === "center" && "mx-auto text-center")}>
      {heading && <h2 className="text-3xl font-semibold">{heading}</h2>}
      {lead && <p className="mt-4 text-lg opacity-80">{lead}</p>}
    </div>
  );
}
