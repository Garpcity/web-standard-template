/**
 * Innholdstypene (dokumenter). Speiles til CMS-definisjoner via
 * `pnpm generate:schema`.
 */
import { z } from "zod";
import {
  documentBase,
  imageRef,
  linkRef,
  richText,
  seoFields,
  slugSchema,
} from "./common";
import { block } from "./blocks";

export const siteSettings = z.object({
  name: z.string().min(1),
  tagline: z.string().max(160).optional(),
  description: z.string().max(300),
  logo: imageRef.optional(),
  logoDark: imageRef.optional(),
  defaultSeo: seoFields.default({ noindex: false }),
  contact: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    orgNumber: z.string().optional(),
  }),
  social: z
    .array(
      z.object({
        platform: z.enum([
          "linkedin",
          "instagram",
          "facebook",
          "youtube",
          "x",
          "tiktok",
          "github",
        ]),
        url: z.string().url(),
      }),
    )
    .default([]),
  footerText: z.string().optional(),
  /** Offisielle profiler brukt som sameAs i Organization-skjema. */
  sameAs: z.array(z.string().url()).default([]),
});
export type SiteSettings = z.infer<typeof siteSettings>;

export const menuItem = z.object({
  id: z.string(),
  label: z.string().min(1),
  href: z.string().min(1),
  external: z.boolean().default(false),
  children: z
    .array(z.object({ id: z.string(), label: z.string(), href: z.string() }))
    .default([]),
});

export const menu = z.object({
  name: z.enum(["main", "footer", "legal"]),
  items: z.array(menuItem),
});
export type Menu = z.infer<typeof menu>;
export type MenuItem = z.infer<typeof menuItem>;

/** Spor på hva som er laget av en agent via MCP, og med hvilken mal. */
export const agentMeta = z.object({
  createdBy: z.string().optional(),
  template: z.string().optional(),
  templateVersion: z.string().optional(),
  checkedAt: z.string().datetime().optional(),
  issues: z.number().int().optional(),
});
export type AgentMeta = z.infer<typeof agentMeta>;

export const page = documentBase.extend({
  _type: z.literal("page").default("page"),
  slug: slugSchema,
  title: z.string().min(1).max(120),
  blocks: z.array(block).default([]),
  seo: seoFields.default({ noindex: false }),
  /** Eier av siden (for rettigheter og innholdsansvar). */
  ownerId: z.string().optional(),
  agentMeta: agentMeta.optional(),
});
export type Page = z.infer<typeof page>;

export const category = z.object({
  id: z.string(),
  slug: slugSchema,
  name: z.string().min(1),
  description: z.string().optional(),
});
export type Category = z.infer<typeof category>;

export const person = documentBase.extend({
  _type: z.literal("person").default("person"),
  slug: slugSchema,
  name: z.string().min(1),
  role: z.string().optional(),
  image: imageRef.optional(),
  bio: richText.default([]),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  /** E-E-A-T: hva personen kan, og hvor det er dokumentert. */
  knowsAbout: z.array(z.string()).default([]),
  credentials: z.array(z.string()).default([]),
  sameAs: z.array(z.string().url()).default([]),
});
export type Person = z.infer<typeof person>;

export const article = documentBase.extend({
  _type: z.literal("article").default("article"),
  slug: slugSchema,
  title: z.string().min(1).max(140),
  /** Kort svar øverst (40–60 ord). AEO. */
  summary: z.string().min(1).max(400),
  image: imageRef.optional(),
  authorId: z.string(),
  publishedAt: z.string().datetime(),
  categoryIds: z.array(z.string()).default([]),
  body: richText,
  /** Kilder påstandene bygger på. GEO. */
  sources: z.array(linkRef).default([]),
  seo: seoFields.default({ noindex: false }),
  agentMeta: agentMeta.optional(),
});
export type Article = z.infer<typeof article>;

/** Utkast til sosiale medier, laget av redaktør eller agent. Publiseres via n8n etter godkjenning. */
export const socialPost = documentBase.extend({
  _type: z.literal("socialPost").default("socialPost"),
  channel: z.string().min(1),
  text: z.string().min(1).max(5000),
  hashtags: z.array(z.string()).default([]),
  image: imageRef.optional(),
  /** Slug til artikkelen/siden posten bygger på. */
  sourceSlug: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  agentMeta: agentMeta.optional(),
});
export type SocialPost = z.infer<typeof socialPost>;

export const media = z.object({
  id: z.string(),
  image: imageRef,
  tags: z.array(z.string()).default([]),
});
export type Media = z.infer<typeof media>;

export const formSubmission = z.object({
  id: z.string(),
  formId: z.string(),
  fields: z.record(z.string(), z.string()),
  submittedAt: z.string().datetime(),
  ipHash: z.string().optional(),
  pageUrl: z.string().optional(),
});
export type FormSubmission = z.infer<typeof formSubmission>;

export const redirect = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  permanent: z.boolean().default(true),
});
export type Redirect = z.infer<typeof redirect>;

/**
 * Profilmanualen – én kilde til sannhet for identitet. Eksponeres som /profil
 * og som maskinlesbart endepunkt for kundens agenter (MCP).
 */
export const brandGuide = z.object({
  identity: z.object({
    name: z.string(),
    oneLiner: z.string().max(200),
    purpose: z.string().max(600),
    values: z.array(z.string()).default([]),
    audiences: z.array(z.string()).default([]),
  }),
  voice: z.object({
    tone: z.array(z.string()).default([]),
    language: z.enum(["nb", "nn", "en"]).default("nb"),
    addressForm: z.enum(["du", "dere", "De"]).default("du"),
    useWords: z.array(z.string()).default([]),
    avoidWords: z.array(z.string()).default([]),
    goodExamples: z.array(z.string()).default([]),
    badExamples: z.array(z.string()).default([]),
  }),
  facts: z
    .array(
      z.object({
        claim: z.string(),
        source: z.string().optional(),
        approved: z.boolean().default(true),
      }),
    )
    .default([]),
  neverClaim: z.array(z.string()).default([]),
  channels: z
    .array(
      z.object({
        name: z.string(),
        format: z.string(),
        maxLength: z.number().int().optional(),
        frequency: z.string().optional(),
        hashtags: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  legal: z.object({
    requiresApproval: z.array(z.string()).default([]),
    forbiddenTopics: z.array(z.string()).default([]),
    imageRights: z.string().optional(),
  }),
  version: z.string().default("1.0.0"),
  updatedAt: z.string().datetime(),
});
export type BrandGuide = z.infer<typeof brandGuide>;
