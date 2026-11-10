import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, getSiteSettings } from "@/content";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { buildMetadata } from "@/seo/metadata";
import { JsonLd } from "@/seo/JsonLd";
import { faqPage, webPage } from "@/seo/schema";

const HOME_SLUG = "forside";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getPage(HOME_SLUG)]);
  return buildMetadata({ settings, path: "/", title: page?.title, seo: page?.seo });
}

export const revalidate = 3600; // sikkerhetsnett; on-demand via revalidateContent

export default async function HomePage() {
  const page = await getPage(HOME_SLUG);
  if (!page) notFound();
  const faqs = page.blocks.filter((b) => b._type === "faq");
  return (
    <>
      <JsonLd
        data={[
          webPage({
            path: "/",
            title: page.title,
            description: page.seo.description,
            updatedAt: page.updatedAt,
          }),
          ...faqs.map((b) => faqPage(b, "/")),
        ]}
      />
      <BlockRenderer blocks={page.blocks} />
    </>
  );
}
