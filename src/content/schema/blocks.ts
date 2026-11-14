/**
 * Innholdsblokker. Én Zod-definisjon per blokk = én React-komponent med samme navn
 * i src/components/blocks/ + én registrering i src/puck/config.tsx.
 *
 * Feltet `_locked` lister felter kunden ikke kan endre (se permissions.ts).
 */
import { z } from "zod";
import { imageRef, linkRef, richText } from "./common";

const blockBase = z.object({
  id: z.string().min(1),
  /** Valgfri anker-id for lenking til seksjonen. */
  anchor: z.string().optional(),
  /** Bakgrunnsvariant. Låst som standard – styres av design, ikke innhold. */
  tone: z.enum(["default", "muted", "brand", "dark"]).default("default"),
});

export const heroBlock = blockBase.extend({
  _type: z.literal("hero"),
  eyebrow: z.string().max(60).optional(),
  heading: z.string().min(1).max(120),
  lead: z.string().max(300).optional(),
  image: imageRef.optional(),
  links: z.array(linkRef).max(2).default([]),
  layout: z.enum(["split", "centered", "fullBleed"]).default("split"),
});

export const textBlock = blockBase.extend({
  _type: z.literal("text"),
  heading: z.string().max(120).optional(),
  body: richText,
  width: z.enum(["narrow", "wide"]).default("narrow"),
});

export const textImageBlock = blockBase.extend({
  _type: z.literal("textImage"),
  heading: z.string().max(120).optional(),
  body: richText,
  image: imageRef,
  imagePosition: z.enum(["left", "right"]).default("right"),
  link: linkRef.optional(),
});

export const cardItem = z.object({
  id: z.string(),
  title: z.string().min(1).max(80),
  text: z.string().max(300).optional(),
  icon: z.string().max(40).optional(),
  image: imageRef.optional(),
  link: linkRef.optional(),
});

export const cardGridBlock = blockBase.extend({
  _type: z.literal("cardGrid"),
  heading: z.string().max(120).optional(),
  lead: z.string().max(300).optional(),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  items: z.array(cardItem).min(1).max(12),
});

export const peopleBlock = blockBase.extend({
  _type: z.literal("people"),
  heading: z.string().max(120).optional(),
  lead: z.string().max(300).optional(),
  /** Tom = alle personer. */
  personIds: z.array(z.string()).default([]),
});

export const latestArticlesBlock = blockBase.extend({
  _type: z.literal("latestArticles"),
  heading: z.string().max(120).default("Siste nytt"),
  limit: z.number().int().min(1).max(12).default(3),
  categoryId: z.string().optional(),
  link: linkRef.optional(),
});

export const galleryBlock = blockBase.extend({
  _type: z.literal("gallery"),
  heading: z.string().max(120).optional(),
  images: z.array(imageRef).min(1).max(24),
  layout: z.enum(["grid", "masonry"]).default("grid"),
});

export const quoteBlock = blockBase.extend({
  _type: z.literal("quote"),
  quote: z.string().min(1).max(400),
  author: z.string().max(80).optional(),
  role: z.string().max(80).optional(),
  image: imageRef.optional(),
});

export const faqItem = z.object({
  id: z.string(),
  question: z.string().min(1).max(200),
  answer: richText,
});

export const faqBlock = blockBase.extend({
  _type: z.literal("faq"),
  heading: z.string().max(120).default("Ofte stilte spørsmål"),
  lead: z.string().max(300).optional(),
  items: z.array(faqItem).min(1).max(30),
});

export const contactFormBlock = blockBase.extend({
  _type: z.literal("contactForm"),
  heading: z.string().max(120).default("Kontakt oss"),
  lead: z.string().max(300).optional(),
  formId: z.string().min(1).default("contact"),
  fields: z
    .array(
      z.object({
        name: z.string().min(1),
        label: z.string().min(1),
        type: z.enum(["text", "email", "tel", "textarea", "select"]).default("text"),
        required: z.boolean().default(false),
        options: z.array(z.string()).optional(),
      }),
    )
    .min(1),
  submitLabel: z.string().default("Send"),
  successMessage: z.string().default("Takk! Vi tar kontakt snart."),
});

export const embedBlock = blockBase.extend({
  _type: z.literal("embed"),
  heading: z.string().max(120).optional(),
  provider: z.enum(["youtube", "vimeo", "map", "iframe"]),
  src: z.string().url(),
  title: z.string().min(1),
  aspect: z.enum(["16/9", "4/3", "1/1"]).default("16/9"),
});

export const ctaBlock = blockBase.extend({
  _type: z.literal("cta"),
  heading: z.string().min(1).max(120),
  text: z.string().max(300).optional(),
  links: z.array(linkRef).min(1).max(2),
});

export const statItem = z.object({
  id: z.string(),
  value: z.number(),
  suffix: z.string().max(10).optional(),
  prefix: z.string().max(10).optional(),
  label: z.string().min(1).max(60),
});

export const statsBlock = blockBase.extend({
  _type: z.literal("stats"),
  heading: z.string().max(120).optional(),
  items: z.array(statItem).min(2).max(6),
});

export const model3dBlock = blockBase.extend({
  _type: z.literal("model3d"),
  heading: z.string().max(120).optional(),
  lead: z.string().max(300).optional(),
  /** .glb/.gltf fra Cinema 4D-eksport (se src/design/3D-PIPELINE.md). Tom = demo-geometri. */
  src: z.string().optional(),
  alt: z.string().min(1).max(200),
  /** Statisk bilde for reduced motion, svake enheter og manglende WebGL. */
  poster: imageRef.optional(),
  autoRotate: z.boolean().default(true),
  interactive: z.boolean().default(true),
  height: z.enum(["medium", "tall"]).default("medium"),
  /** Uttrykksfull hero-variant med tekst over modellen. */
  layout: z.enum(["section", "hero"]).default("section"),
});

/**
 * Tabell med kilde – for sammenligninger, priser og nøkkeltall (siterbart innhold).
 * Hver rad må ha like mange celler som `columns`.
 */
export const dataTableBlock = blockBase
  .extend({
    _type: z.literal("dataTable"),
    heading: z.string().max(120).optional(),
    lead: z.string().max(300).optional(),
    /** Vises under tabellen, f.eks. «Priser eks. mva, oppdatert 2026-11». */
    caption: z.string().max(200).optional(),
    columns: z.array(z.string().max(60)).min(2).max(6),
    rows: z
      .array(z.array(z.string().max(200)))
      .min(1)
      .max(50),
    /** Første celle i hver rad rendres som <th scope="row">. */
    firstColumnIsHeader: z.boolean().default(true),
    /** Kildelenke, rendres som «Kilde: …». */
    source: linkRef.optional(),
    width: z.enum(["narrow", "wide"]).default("narrow"),
  })
  .superRefine((value, ctx) => {
    value.rows.forEach((row, i) => {
      if (row.length !== value.columns.length) {
        ctx.addIssue({
          code: "custom",
          path: ["rows", i],
          message: `Rad ${i + 1} har ${row.length} celler, men tabellen har ${value.columns.length} kolonner`,
        });
      }
    });
  });

export const block = z.discriminatedUnion("_type", [
  heroBlock,
  textBlock,
  textImageBlock,
  cardGridBlock,
  peopleBlock,
  latestArticlesBlock,
  galleryBlock,
  quoteBlock,
  faqBlock,
  contactFormBlock,
  embedBlock,
  ctaBlock,
  statsBlock,
  model3dBlock,
  dataTableBlock,
]);

export type Block = z.infer<typeof block>;
export type BlockType = Block["_type"];
export type BlockOf<T extends BlockType> = Extract<Block, { _type: T }>;

export const blockSchemas = {
  hero: heroBlock,
  text: textBlock,
  textImage: textImageBlock,
  cardGrid: cardGridBlock,
  people: peopleBlock,
  latestArticles: latestArticlesBlock,
  gallery: galleryBlock,
  quote: quoteBlock,
  faq: faqBlock,
  contactForm: contactFormBlock,
  embed: embedBlock,
  cta: ctaBlock,
  stats: statsBlock,
  model3d: model3dBlock,
  dataTable: dataTableBlock,
} as const;
