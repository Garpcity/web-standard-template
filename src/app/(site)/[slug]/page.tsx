import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, getPages, getSiteSettings } from "@/content";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { buildMetadata } from "@/seo/metadata";
import { JsonLd } from "@/seo/JsonLd";
import { breadcrumb, faqPage, webPage } from "@/seo/schema";

export async function generateStaticParams() {
  const pages = await getPages();
  return pages.filter((p) => p.slug !== "forside").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [settings, page] = await Promise.all([getSiteSettings(), getPage(slug)]);
  if (!page) return {};
  return buildMetadata({ settings, path: `/${slug}`, title: page.title, seo: page.seo });
}

export default async function GenericPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page || slug === "forside") notFound();
  const path = `/${slug}`;
  const faqs = page.blocks.filter((b) => b._type === "faq");
  return (
    <>
      <JsonLd
        data={[
          webPage({
            path,
            title: page.title,
            description: page.seo.description,
            updatedAt: page.updatedAt,
          }),
          breadcrumb([
            { name: "Hjem", path: "/" },
            { name: page.title, path },
          ]),
          ...faqs.map((b) => faqPage(b, path)),
        ]}
      />
      <BlockRenderer blocks={page.blocks} />
    </>
  );
}
