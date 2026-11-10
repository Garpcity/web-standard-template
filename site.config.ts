/**
 * site.config.ts – grunnstrukturen for denne nettsiden.
 *
 * Dette er filen Studio skriver til når innstillinger endres. Alt her er
 * strukturelle valg som ikke hører hjemme i CMS-innhold.
 */
export const siteConfig = {
  /** Kort teknisk navn, brukes i logger og generert kode. */
  slug: "admoment",

  /** Standardspråk og eventuelle flere språk. */
  locale: "nb-NO" as const,
  locales: ["nb-NO"] as const,

  /** Hvilke innholdstyper som er aktive på denne siden. */
  contentTypes: {
    articles: true,
    people: true,
    categories: true,
  },

  /** Hvilke blokker redaktøren kan bruke. Navnene matcher `schema/blocks.ts`. */
  enabledBlocks: [
    "hero",
    "text",
    "textImage",
    "cardGrid",
    "people",
    "latestArticles",
    "gallery",
    "quote",
    "faq",
    "contactForm",
    "embed",
    "cta",
    "stats",
    "model3d",
  ] as const,

  /**
   * AI-crawlere. Standard: alle slippes inn – vi optimaliserer for synlighet.
   * Endres kun etter beslutning fra kunden. Dokumenter beslutningen i README.
   */
  aiCrawlers: {
    allow: true,
    agents: [
      "GPTBot",
      "OAI-SearchBot",
      "ChatGPT-User",
      "ClaudeBot",
      "Claude-SearchBot",
      "anthropic-ai",
      "PerplexityBot",
      "Google-Extended",
      "Bingbot",
      "Applebot-Extended",
      "CCBot",
    ],
  },

  /** Integrasjoner som er på. */
  integrations: {
    analytics: "plausible" as "plausible" | "umami" | "none",
    forms: "webhook" as const,
  },

  /** Puck-editor tilgjengelig på /edit/[slug]. Slås av i produksjon for WP/Payload med egen editor. */
  editor: {
    puck: true,
  },
} as const;

export type SiteConfig = typeof siteConfig;
export type BlockName = (typeof siteConfig.enabledBlocks)[number];
