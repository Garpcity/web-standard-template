import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, getArticles, getPerson, getSiteSettings } from "@/content";
import { RichText } from "@/components/RichText";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/motion/Reveal";
import { buildMetadata } from "@/seo/metadata";
import { JsonLd } from "@/seo/JsonLd";
import {
  article as articleSchema,
  breadcrumb,
  person as personSchema,
} from "@/seo/schema";
import { formatDate } from "@/lib/utils";

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/artikler/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [settings, article] = await Promise.all([getSiteSettings(), getArticle(slug)]);
  if (!article) return {};
  const author = await getPerson(article.authorId);
  return buildMetadata({
    settings,
    path: `/artikler/${slug}`,
    title: article.title,
    description: article.summary,
    seo: { ...article.seo, image: article.seo.image ?? article.image },
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    authors: author ? [author.name] : undefined,
  });
}

export default async function ArticlePage({ params }: PageProps<"/artikler/[slug]">) {
  const { slug } = await params;
  const [article, settings] = await Promise.all([getArticle(slug), getSiteSettings()]);
  if (!article) notFound();
  const author = await getPerson(article.authorId);
  const path = `/artikler/${slug}`;

  return (
    <>
      <JsonLd
        data={[
          articleSchema(article, author),
          ...(author ? [personSchema(author, settings)] : []),
          breadcrumb([
            { name: "Hjem", path: "/" },
            { name: "Artikler", path: "/artikler" },
            { name: article.title, path },
          ]),
        ]}
      />
      <article className="py-section">
        <header className="container-narrow">
          <Reveal>
            <p className="text-sm text-fg-muted">
              <time dateTime={article.publishedAt}>
                {formatDate(article.publishedAt)}
              </time>
              {article.updatedAt !== article.createdAt && (
                <>
                  {" "}
                  · Oppdatert{" "}
                  <time dateTime={article.updatedAt}>
                    {formatDate(article.updatedAt)}
                  </time>
                </>
              )}
            </p>
            <h1 className="mt-3 text-4xl font-semibold md:text-5xl">{article.title}</h1>
            {/* Kort svar øverst – AEO */}
            <p className="mt-6 text-xl leading-snug text-fg-muted">{article.summary}</p>
            {author && (
              <div className="mt-8 flex items-center gap-3">
                {author.image && (
                  <span className="size-12 overflow-hidden rounded-pill">
                    <SmartImage
                      image={author.image}
                      sizes="48px"
                      className="h-full object-cover"
                    />
                  </span>
                )}
                <div className="text-sm">
                  <p className="font-medium">{author.name}</p>
                  {author.role && <p className="text-fg-muted">{author.role}</p>}
                </div>
              </div>
            )}
          </Reveal>
        </header>
        {article.image && (
          <Reveal className="container-site my-12">
            <SmartImage
              image={article.image}
              priority
              className="rounded-card"
              sizes="(min-width: 1024px) 72rem, 100vw"
            />
          </Reveal>
        )}
        <div className="container-narrow">
          <RichText value={article.body} />
          {article.sources.length > 0 && (
            <aside className="mt-12 rounded-card border border-border bg-surface p-6">
              <h2 className="text-base font-semibold">Kilder</h2>
              <ul className="mt-3 space-y-1 text-sm">
                {article.sources.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      className="text-brand underline underline-offset-3"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}
          {author && author.knowsAbout.length > 0 && (
            <aside className="mt-8 text-sm text-fg-muted">
              <p>
                <strong className="text-fg">{author.name}</strong> skriver om{" "}
                {author.knowsAbout.join(", ").toLowerCase()}.
                {author.credentials.length > 0 && ` ${author.credentials.join(". ")}.`}
              </p>
            </aside>
          )}
          <p className="mt-12">
            <Link href="/artikler" className="text-brand hover:underline">
              ← Alle artikler
            </Link>
          </p>
        </div>
      </article>
    </>
  );
}
