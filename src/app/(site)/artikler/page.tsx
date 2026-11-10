import type { Metadata } from "next";
import { getArticles, getSiteSettings } from "@/content";
import { ArticleCard } from "@/components/blocks/LatestArticles";
import { Section } from "@/components/ui/Section";
import { Stagger, RevealChild } from "@/components/motion/Reveal";
import { buildMetadata } from "@/seo/metadata";
import { JsonLd } from "@/seo/JsonLd";
import { breadcrumb, webPage } from "@/seo/schema";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata({
    settings,
    path: "/artikler",
    title: "Artikler",
    description: `Artikler fra ${settings.name} om nettsider, synlighet og design.`,
  });
}

export default async function ArticlesPage() {
  const articles = await getArticles();
  return (
    <>
      <JsonLd
        data={[
          webPage({ path: "/artikler", title: "Artikler" }),
          breadcrumb([
            { name: "Hjem", path: "/" },
            { name: "Artikler", path: "/artikler" },
          ]),
        ]}
      />
      <Section>
        <h1 className="mb-12 text-4xl font-semibold">Artikler</h1>
        <Stagger className="grid gap-10 md:grid-cols-2 lg:grid-cols-3" as="ul">
          {articles.map((a) => (
            <RevealChild key={a.id} as="li">
              <ArticleCard article={a} />
            </RevealChild>
          ))}
        </Stagger>
      </Section>
    </>
  );
}
