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
  socialPost: "approval",
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
  model3d: ["tone", "layout", "height", "interactive"],
  dataTable: ["tone", "width"],
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

/**
 * Håndhev låste felt på serversiden. Brukes av /api/puck, MCP og Payload-hook, så
 * regelen gjelder uansett hvilken vei innholdet kommer. Ikke-owner får låste verdier
 * fra eksisterende blokk med samme id, ellers fjernes feltet (Zod setter standard).
 */
export function applyLockedFields<T extends { id?: string; _type?: string }>(
  role: Role,
  incoming: T[],
  existing: { id?: string; _type?: string }[] = [],
): T[] {
  if (roleCan[role].editStructure) return incoming;
  return incoming.map((block) => {
    const locked = lockedBlockFields[String(block._type ?? "")] ?? [];
    if (!locked.length) return block;
    const copy: Record<string, unknown> = { ...block };
    const prev = existing.find((b) => b.id && b.id === block.id) as
      Record<string, unknown> | undefined;
    for (const field of locked) {
      if (prev && field in prev) copy[field] = prev[field];
      else delete copy[field];
    }
    return copy as T;
  });
}
