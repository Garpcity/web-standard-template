/**
 * Roller og redigeringsnivåer. Én kilde; speiles til CMS, Puck og MCP.
 */
export const roles = [
  "owner",
  "admin",
  "editor",
  "contributor",
  "reviewer",
  "agent",
] as const;
export type Role = (typeof roles)[number];

export const editLevels = [
  "locked",
  "structured",
  "composable",
  "free",
  "approval",
] as const;
export type EditLevel = (typeof editLevels)[number];

/** Standardprofil for en ny kunde. Justeres per prosjekt. */
export const contentTypeLevels: Record<string, EditLevel> = {
  siteSettings: "locked",
  menu: "locked",
  brandGuide: "approval",
  page: "composable",
  article: "free",
  person: "structured",
  category: "structured",
  redirect: "locked",
};

/**
 * Felter som er låst per blokk: kunden kan endre innhold, ikke utseende.
 * Dette er den viktigste mekanismen for å sikre estetikk.
 */
export const lockedBlockFields: Record<string, string[]> = {
  hero: ["tone", "layout"],
  text: ["tone", "width"],
  textImage: ["tone"],
  cardGrid: ["tone", "columns"],
  people: ["tone"],
  latestArticles: ["tone"],
  gallery: ["tone", "layout"],
  quote: ["tone"],
  faq: ["tone"],
  contactForm: ["tone", "formId", "fields"],
  embed: ["tone", "aspect"],
  cta: ["tone"],
  stats: ["tone"],
};

export const roleCan: Record<
  Role,
  { publish: boolean; editStructure: boolean; approve: boolean }
> = {
  owner: { publish: true, editStructure: true, approve: true },
  admin: { publish: true, editStructure: false, approve: true },
  editor: { publish: false, editStructure: false, approve: false },
  contributor: { publish: false, editStructure: false, approve: false },
  reviewer: { publish: false, editStructure: false, approve: true },
  agent: { publish: false, editStructure: false, approve: false },
};

export function canEditField(role: Role, blockType: string, field: string): boolean {
  if (role === "owner") return true;
  return !(lockedBlockFields[blockType] ?? []).includes(field);
}
