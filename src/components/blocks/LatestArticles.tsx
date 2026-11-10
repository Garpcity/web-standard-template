import Link from "next/link";
import type { Article, BlockOf } from "@/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { Stagger, RevealChild } from "@/components/motion/Reveal";
import { formatDate } from "@/lib/utils";

export function ArticleCard({ article }: { article: Article }) {
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
          />
        </Link>
      )}
      <time dateTime={article.publishedAt} className="text-xs text-fg-muted">
        {formatDate(article.publishedAt)}
      </time>
      <h3 className="mt-1 text-xl font-semibold">
        <Link href={`/artikler/${article.slug}`} className="hover:underline">
          {article.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-3 text-fg-muted">{article.summary}</p>
    </article>
  );
}

export function LatestArticles({
  block,
  articles,
}: {
  block: BlockOf<"latestArticles">;
  articles: Article[];
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
        {articles.map((a) => (
          <RevealChild key={a.id} as="li">
            <ArticleCard article={a} />
          </RevealChild>
        ))}
      </Stagger>
    </Section>
  );
}
