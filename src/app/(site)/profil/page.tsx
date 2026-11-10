import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrandGuide, getSiteSettings } from "@/content";
import { Section } from "@/components/ui/Section";
import { buildMetadata } from "@/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata({
    settings,
    path: "/profil",
    title: "Profilmanual",
    description: `Profilmanualen til ${settings.name}: identitet, språk, fakta og kanalregler.`,
    seo: { noindex: true },
  });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-t border-border py-5 md:grid-cols-[14rem_1fr]">
      <dt className="text-sm font-medium text-fg-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return items.length ? (
    <ul className="list-disc pl-5">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  ) : (
    <span className="text-fg-muted">–</span>
  );
}

/** Lesbar profilmanual. Maskinlesbar versjon: /api/brand-guide (fase 6: MCP). */
export default async function BrandGuidePage() {
  const guide = await getBrandGuide();
  if (!guide) notFound();
  return (
    <Section narrow>
      <p className="text-sm text-fg-muted">
        Profilmanual · versjon {guide.version} · oppdatert {guide.updatedAt.slice(0, 10)}
      </p>
      <h1 className="mt-2 mb-10 text-4xl font-semibold">{guide.identity.name}</h1>

      <h2 className="text-2xl font-semibold">Identitet</h2>
      <dl>
        <Row label="Én setning">{guide.identity.oneLiner}</Row>
        <Row label="Formål">{guide.identity.purpose}</Row>
        <Row label="Verdier">
          <List items={guide.identity.values} />
        </Row>
        <Row label="Målgrupper">
          <List items={guide.identity.audiences} />
        </Row>
      </dl>

      <h2 className="mt-12 text-2xl font-semibold">Språk og tone</h2>
      <dl>
        <Row label="Tone">
          <List items={guide.voice.tone} />
        </Row>
        <Row label="Språk">
          {guide.voice.language} · tiltale «{guide.voice.addressForm}»
        </Row>
        <Row label="Ord vi bruker">
          <List items={guide.voice.useWords} />
        </Row>
        <Row label="Ord vi unngår">
          <List items={guide.voice.avoidWords} />
        </Row>
        <Row label="Gode eksempler">
          <List items={guide.voice.goodExamples} />
        </Row>
        <Row label="Dårlige eksempler">
          <List items={guide.voice.badExamples} />
        </Row>
      </dl>

      <h2 className="mt-12 text-2xl font-semibold">Godkjente fakta</h2>
      <dl>
        {guide.facts.map((f) => (
          <Row key={f.claim} label={f.source ?? "Uten kilde"}>
            {f.claim}
          </Row>
        ))}
        <Row label="Påstår aldri">
          <List items={guide.neverClaim} />
        </Row>
      </dl>

      <h2 className="mt-12 text-2xl font-semibold">Kanaler</h2>
      <dl>
        {guide.channels.map((c) => (
          <Row key={c.name} label={c.name}>
            {c.format}
            {c.maxLength && ` · maks ${c.maxLength} tegn`}
            {c.frequency && ` · ${c.frequency}`}
            {c.hashtags.length > 0 && ` · ${c.hashtags.join(" ")}`}
          </Row>
        ))}
      </dl>

      <h2 className="mt-12 text-2xl font-semibold">Juridisk og trygghet</h2>
      <dl>
        <Row label="Krever godkjenning">
          <List items={guide.legal.requiresApproval} />
        </Row>
        <Row label="Forbudte emner">
          <List items={guide.legal.forbiddenTopics} />
        </Row>
        <Row label="Bilderettigheter">{guide.legal.imageRights ?? "–"}</Row>
      </dl>
    </Section>
  );
}
