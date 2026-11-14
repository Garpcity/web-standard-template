import type { Block } from "@/content";
import { getArticles, getPeople } from "@/content";
import { Hero } from "./Hero";
import { Text } from "./Text";
import { TextImage } from "./TextImage";
import { CardGrid } from "./CardGrid";
import { People } from "./People";
import { LatestArticles } from "./LatestArticles";
import { Gallery } from "./Gallery";
import { Quote } from "./Quote";
import { Faq } from "./Faq";
import { ContactForm } from "./ContactForm";
import { Embed } from "./Embed";
import { Cta } from "./Cta";
import { Stats } from "./Stats";
import { Model3d } from "./Model3d";
import { DataTable } from "./DataTable";

/**
 * Server Component som rendrer en liste blokker. Blokker som trenger data
 * (people, latestArticles) får den hentet her via kontrakten.
 */
export async function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map(async (block, index) => {
        // Første blokk på siden er sannsynlig over folden: bildene der skal lastes med prioritet (LCP).
        const aboveFold = index === 0;
        switch (block._type) {
          case "hero":
            return <Hero key={block.id} block={block} />;
          case "text":
            return <Text key={block.id} block={block} />;
          case "textImage":
            return <TextImage key={block.id} block={block} />;
          case "cardGrid":
            return <CardGrid key={block.id} block={block} aboveFold={aboveFold} />;
          case "people": {
            const people = await getPeople(block.personIds);
            return <People key={block.id} block={block} people={people} />;
          }
          case "latestArticles": {
            const articles = await getArticles({
              limit: block.limit,
              categoryId: block.categoryId,
            });
            return (
              <LatestArticles
                key={block.id}
                block={block}
                articles={articles}
                aboveFold={aboveFold}
              />
            );
          }
          case "gallery":
            return <Gallery key={block.id} block={block} />;
          case "quote":
            return <Quote key={block.id} block={block} />;
          case "faq":
            return <Faq key={block.id} block={block} />;
          case "contactForm":
            return <ContactForm key={block.id} block={block} />;
          case "embed":
            return <Embed key={block.id} block={block} />;
          case "cta":
            return <Cta key={block.id} block={block} />;
          case "stats":
            return <Stats key={block.id} block={block} />;
          case "model3d":
            return <Model3d key={block.id} block={block} />;
          case "dataTable":
            return <DataTable key={block.id} block={block} />;
          default: {
            const never: never = block;
            return never;
          }
        }
      })}
    </>
  );
}
