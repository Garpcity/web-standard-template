import type { Metadata } from "next";
import type { SeoFields, SiteSettings } from "@/content";
import { siteUrl } from "@/lib/utils";

type Input = {
  settings: SiteSettings;
  path: string;
  title?: string;
  description?: string;
  seo?: SeoFields;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
};

/** Eneste måten metadata bygges på. Brukes i generateMetadata på alle sider. */
export function buildMetadata(input: Input): Metadata {
  const { settings, path, seo } = input;
  const title = seo?.title ?? input.title ?? settings.name;
  const description = seo?.description ?? input.description ?? settings.description;
  const image = seo?.image ?? settings.defaultSeo.image;
  const url = seo?.canonical ?? siteUrl(path);

  return {
    title: title === settings.name ? title : `${title} – ${settings.name}`,
    description,
    metadataBase: new URL(siteUrl("/")),
    alternates: { canonical: url },
    robots: seo?.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: input.type ?? "website",
      url,
      title,
      description,
      siteName: settings.name,
      locale: "nb_NO",
      images: image
        ? [
            {
              url: siteUrl(image.url),
              width: image.width,
              height: image.height,
              alt: image.alt,
            },
          ]
        : [],
      ...(input.type === "article"
        ? {
            publishedTime: input.publishedTime,
            modifiedTime: input.modifiedTime,
            authors: input.authors,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [siteUrl(image.url)] : [],
    },
  };
}
