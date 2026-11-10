import Link from "next/link";
import type { Article, BlockOf } from "@/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { Stagger, RevealChild } from "@/components/motion/Reveal";
import { formatDate } from "@/lib/utils";

/**
 * `priority` settes på det første kortet i en liste som kan være over folden – LCP-regelen i DESIGN.md.
 * `headingLevel` gjør at kortet følger dokumentets overskriftsrekkefølge (h2 under en h1-side, h3 under en seksjon med h2).
 */
export function ArticleCard({
  article,
  priority = false,
  headingLevel = 3,
}: {
  article: Article;
  priority?: boolean;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="group flex h-full flex-col">
      {article.image && (
        <Link
          href={`/artikler/${article.slug}`}
          className="mb-4 block aspect-[16/9] overflow-hidden rounded-card"
          tabIndex={-1}
          aria-hidden
        >
          <SmartImage
            image={article.image}
            className="h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(min-width: 768px) 33vw, 100vw"
            priority={priority}
          />
        </Link>
      )}
      <time dateTime={article.publishedAt} className="text-xs text-fg-muted">
        {formatDate(article.publishedAt)}
      </time>
      <Heading className="mt-1 text-xl font-semibold">
        <Link href={`/artikler/${article.slug}`} className="hover:underline">
          {article.title}
        </Link>
      </Heading>
      <p className="mt-2 line-clamp-3 text-fg-muted">{article.summary}</p>
    </article>
  );
}

export function LatestArticles({
  block,
  articles,
  aboveFold = false,
}: {
  block: BlockOf<"latestArticles">;
  articles: Article[];
  aboveFold?: boolean;
}) {
  return (
    <Section tone={block.tone} id={block.anchor}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading heading={block.heading} />
        {block.link && (
          <Button href={block.link.href} variant="ghost" className="mb-12">
            {block.link.label}
          </Button>
        )}
      </div>
      <Stagger className="grid gap-8 md:grid-cols-3" as="ul">
        {articles.map((a, i) => (
          <RevealChild key={a.id} as="li" eager={aboveFold && i === 0}>
            <ArticleCard article={a} priority={aboveFold && i === 0} />
          </RevealChild>
        ))}
      </Stagger>
    </Section>
  );
}
