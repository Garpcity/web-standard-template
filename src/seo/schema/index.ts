/**
 * JSON-LD-builders. Én funksjon per schema.org-type. Tar kontraktens typer inn,
 * returnerer typesikre objekter (schema-dts). Aldri håndskrevet JSON-LD andre steder.
 */
import type {
  Article as SchemaArticle,
  BreadcrumbList,
  FAQPage,
  Organization,
  Person as SchemaPerson,
  WebPage,
  WebSite,
  WithContext,
} from "schema-dts";
import type { Article, BlockOf, Person, SiteSettings } from "@/content";
import { siteUrl } from "@/lib/utils";

const ctx = "https://schema.org" as const;

export const organizationId = () => `${siteUrl("/")}#organization`;
export const websiteId = () => `${siteUrl("/")}#website`;
export const personId = (p: Person) => `${siteUrl(`/om-oss#${p.slug}`)}`;

export function organization(s: SiteSettings): WithContext<Organization> {
  return {
    "@context": ctx,
    "@type": "Organization",
    "@id": organizationId(),
    name: s.name,
    url: siteUrl("/"),
    description: s.description,
    ...(s.logo ? { logo: siteUrl(s.logo.url) } : {}),
    ...(s.contact.email ? { email: s.contact.email } : {}),
    ...(s.contact.phone ? { telephone: s.contact.phone } : {}),
    ...(s.contact.address
      ? { address: { "@type": "PostalAddress", streetAddress: s.contact.address } }
      : {}),
    ...(s.contact.orgNumber ? { identifier: s.contact.orgNumber } : {}),
    sameAs: [...s.sameAs, ...s.social.map((x) => x.url)],
  };
}

export function webSite(s: SiteSettings): WithContext<WebSite> {
  return {
    "@context": ctx,
    "@type": "WebSite",
    "@id": websiteId(),
    name: s.name,
    url: siteUrl("/"),
    inLanguage: "nb-NO",
    publisher: { "@id": organizationId() },
  };
}

export function webPage(input: {
  path: string;
  title: string;
  description?: string;
  updatedAt?: string;
}): WithContext<WebPage> {
  return {
    "@context": ctx,
    "@type": "WebPage",
    "@id": siteUrl(input.path),
    url: siteUrl(input.path),
    name: input.title,
    ...(input.description ? { description: input.description } : {}),
    ...(input.updatedAt ? { dateModified: input.updatedAt } : {}),
    isPartOf: { "@id": websiteId() },
    inLanguage: "nb-NO",
  };
}

export function person(p: Person, s: SiteSettings): WithContext<SchemaPerson> {
  return {
    "@context": ctx,
    "@type": "Person",
    "@id": personId(p),
    name: p.name,
    ...(p.role ? { jobTitle: p.role } : {}),
    ...(p.image ? { image: siteUrl(p.image.url) } : {}),
    ...(p.email ? { email: p.email } : {}),
    worksFor: { "@id": organizationId(), "@type": "Organization", name: s.name },
    ...(p.knowsAbout.length ? { knowsAbout: p.knowsAbout } : {}),
    ...(p.credentials.length
      ? {
          hasCredential: p.credentials.map((c) => ({
            "@type": "EducationalOccupationalCredential" as const,
            name: c,
          })),
        }
      : {}),
    ...(p.sameAs.length ? { sameAs: p.sameAs } : {}),
  };
}

export function article(a: Article, author: Person | null): WithContext<SchemaArticle> {
  return {
    "@context": ctx,
    "@type": "Article",
    "@id": siteUrl(`/artikler/${a.slug}`),
    headline: a.title,
    description: a.summary,
    ...(a.image ? { image: siteUrl(a.image.url) } : {}),
    datePublished: a.publishedAt,
    dateModified: a.updatedAt,
    inLanguage: "nb-NO",
    mainEntityOfPage: siteUrl(`/artikler/${a.slug}`),
    publisher: { "@id": organizationId() },
    ...(author
      ? { author: { "@id": personId(author), "@type": "Person", name: author.name } }
      : {}),
    ...(a.sources.length ? { citation: a.sources.map((src) => src.href) } : {}),
  };
}

export function faqPage(block: BlockOf<"faq">, path: string): WithContext<FAQPage> {
  return {
    "@context": ctx,
    "@type": "FAQPage",
    "@id": `${siteUrl(path)}#faq-${block.id}`,
    mainEntity: block.items.map((item) => ({
      "@type": "Question" as const,
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: item.answer
          .flatMap((n) => (n._type === "block" ? n.children.map((c) => c.text) : []))
          .join(" "),
      },
    })),
  };
}

export function breadcrumb(
  items: { name: string; path: string }[],
): WithContext<BreadcrumbList> {
  return {
    "@context": ctx,
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem" as const,
      position: i + 1,
      name: it.name,
      item: siteUrl(it.path),
    })),
  };
}
