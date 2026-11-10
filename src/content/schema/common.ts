/**
 * Felles byggeklosser som brukes av flere innholdstyper.
 * Alt innhold fra alle CMS normaliseres til disse formene.
 */
import { z } from "zod";

/** Normalisert bildereferanse. Rendres alltid med next/image. */
export const imageRef = z.object({
  url: z.string().min(1),
  alt: z.string().default(""),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  caption: z.string().optional(),
  blurDataURL: z.string().optional(),
  /** 0–1, hvor i bildet fokus ligger. Brukes til object-position. */
  focal: z
    .object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
    .optional(),
});
export type ImageRef = z.infer<typeof imageRef>;

/** Lenke: enten intern (slug) eller ekstern (url). */
export const linkRef = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  external: z.boolean().default(false),
  /** Visuell variant for knapper. */
  variant: z.enum(["primary", "secondary", "ghost"]).default("primary"),
});
export type LinkRef = z.infer<typeof linkRef>;

/**
 * Rik tekst, normalisert til et lite Portable Text-lignende format.
 * Alle adaptere oversetter til dette; én <RichText>-komponent rendrer alt.
 */
export const richTextMark = z.enum(["strong", "em", "code", "underline"]);

export const richTextSpan = z.object({
  _type: z.literal("span"),
  text: z.string(),
  marks: z.array(richTextMark).default([]),
  href: z.string().optional(),
});

export const richTextBlock = z.object({
  _type: z.literal("block"),
  style: z.enum(["normal", "h2", "h3", "h4", "blockquote"]).default("normal"),
  listItem: z.enum(["bullet", "number"]).optional(),
  level: z.number().int().min(1).max(3).optional(),
  children: z.array(richTextSpan),
});

export const richTextImage = z.object({
  _type: z.literal("image"),
  image: imageRef,
});

export const richTextNode = z.discriminatedUnion("_type", [richTextBlock, richTextImage]);
export type RichTextNode = z.infer<typeof richTextNode>;
export const richText = z.array(richTextNode);
export type RichText = z.infer<typeof richText>;

/** Gjenbrukbart SEO-feltsett på alle sidetyper. */
export const seoFields = z.object({
  title: z.string().max(70).optional(),
  description: z.string().max(170).optional(),
  image: imageRef.optional(),
  noindex: z.boolean().default(false),
  canonical: z.string().url().optional(),
});
export type SeoFields = z.infer<typeof seoFields>;

/** Felter alle dokumenter har. */
export const documentBase = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: z.enum(["draft", "published"]).default("published"),
});

export const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: små bokstaver, tall og bindestrek");
