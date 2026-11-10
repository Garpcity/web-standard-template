import type { Field, GlobalConfig } from "payload";
import { revalidateContent, type ContentKind } from "@/lib/revalidate";

const revalidateGlobal = (kind: ContentKind) => ({
  afterChange: [
    ({ doc }: { doc: unknown }) => {
      revalidateContent(kind);
      return doc;
    },
  ],
});
import { isOwner, isOwnerOrAdmin } from "../access";
import { linkFields, seoGroup } from "../fields";

const stringArray = (name: string, label: string) => ({
  name,
  type: "array" as const,
  label,
  fields: [{ name: "value", type: "text" as const, required: true }],
});

/** Globale innstillinger: locked for alle unntatt owner (permissions.ts). */
export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  hooks: revalidateGlobal("settings"),
  label: "Nettsted",
  admin: { group: "Innstillinger" },
  access: { read: () => true, update: isOwner },
  fields: [
    { name: "name", type: "text", required: true, label: "Navn" },
    { name: "tagline", type: "text", label: "Slagord" },
    { name: "description", type: "textarea", required: true, label: "Beskrivelse" },
    { name: "logo", type: "upload", relationTo: "media", label: "Logo" },
    { name: "logoDark", type: "upload", relationTo: "media", label: "Logo (mørk)" },
    { ...seoGroup, name: "defaultSeo", label: "Standard SEO" } as Field,
    {
      name: "contact",
      type: "group",
      label: "Kontakt",
      fields: [
        { name: "email", type: "email" },
        { name: "phone", type: "text" },
        { name: "address", type: "text" },
        { name: "orgNumber", type: "text", label: "Org.nr." },
      ],
    },
    {
      name: "social",
      type: "array",
      label: "Sosiale medier",
      fields: [
        {
          name: "platform",
          type: "select",
          required: true,
          options: [
            "linkedin",
            "instagram",
            "facebook",
            "youtube",
            "x",
            "tiktok",
            "github",
          ].map((v) => ({ label: v, value: v })),
        },
        { name: "url", type: "text", required: true },
      ],
    },
    { name: "footerText", type: "text", label: "Bunntekst" },
    stringArray("sameAs", "Offisielle profiler (sameAs)"),
  ],
};

const menuItems = (name: string, label: string) => ({
  name,
  type: "array" as const,
  label,
  fields: [
    { name: "label", type: "text" as const, required: true },
    { name: "href", type: "text" as const, required: true },
    { name: "external", type: "checkbox" as const, defaultValue: false },
    {
      name: "children",
      type: "array" as const,
      label: "Undermeny",
      fields: [
        { name: "label", type: "text" as const, required: true },
        { name: "href", type: "text" as const, required: true },
      ],
    },
  ],
});

export const Menus: GlobalConfig = {
  slug: "menus",
  hooks: revalidateGlobal("menu"),
  label: "Menyer",
  admin: { group: "Innstillinger" },
  access: { read: () => true, update: isOwnerOrAdmin },
  fields: [
    menuItems("main", "Hovedmeny"),
    menuItems("footer", "Bunnmeny"),
    menuItems("legal", "Juridisk"),
  ],
};

/** Profilmanualen – kilden for kundens agenter. `approval`-nivå: admin redigerer, versjoneres. */
export const BrandGuide: GlobalConfig = {
  slug: "brand-guide",
  hooks: revalidateGlobal("brandGuide"),
  label: "Profilmanual",
  admin: { group: "Innstillinger" },
  access: { read: () => true, update: isOwnerOrAdmin },
  versions: { max: 50 },
  fields: [
    {
      name: "version",
      type: "text",
      defaultValue: "1.0.0",
      label: "Versjon",
      admin: { position: "sidebar" },
    },
    {
      name: "identity",
      type: "group",
      label: "Identitet",
      fields: [
        { name: "name", type: "text", required: true },
        {
          name: "oneLiner",
          type: "text",
          required: true,
          maxLength: 200,
          label: "Én setning",
        },
        {
          name: "purpose",
          type: "textarea",
          required: true,
          maxLength: 600,
          label: "Formål",
        },
        stringArray("values", "Verdier"),
        stringArray("audiences", "Målgrupper"),
      ],
    },
    {
      name: "voice",
      type: "group",
      label: "Språk og tone",
      fields: [
        stringArray("tone", "Tone"),
        {
          name: "language",
          type: "select",
          defaultValue: "nb",
          options: [
            { label: "Bokmål", value: "nb" },
            { label: "Nynorsk", value: "nn" },
            { label: "Engelsk", value: "en" },
          ],
        },
        {
          name: "addressForm",
          type: "select",
          defaultValue: "du",
          options: ["du", "dere", "De"].map((v) => ({ label: v, value: v })),
        },
        stringArray("useWords", "Ord vi bruker"),
        stringArray("avoidWords", "Ord vi unngår"),
        stringArray("goodExamples", "Gode eksempler"),
        stringArray("badExamples", "Dårlige eksempler"),
      ],
    },
    {
      name: "facts",
      type: "array",
      label: "Godkjente fakta",
      fields: [
        { name: "claim", type: "text", required: true, label: "Påstand" },
        { name: "source", type: "text", label: "Kilde" },
        { name: "approved", type: "checkbox", defaultValue: true, label: "Godkjent" },
      ],
    },
    stringArray("neverClaim", "Påstår aldri"),
    {
      name: "channels",
      type: "array",
      label: "Kanaler",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "format", type: "text", required: true },
        { name: "maxLength", type: "number" },
        { name: "frequency", type: "text" },
        stringArray("hashtags", "Hashtags"),
      ],
    },
    {
      name: "legal",
      type: "group",
      label: "Juridisk og trygghet",
      fields: [
        stringArray("requiresApproval", "Krever godkjenning"),
        stringArray("forbiddenTopics", "Forbudte emner"),
        { name: "imageRights", type: "textarea", label: "Bilderettigheter" },
      ],
    },
  ],
};

export const globals = [SiteSettings, Menus, BrandGuide];

// linkFields brukes av Articles.sources; eksporteres videre for adapter-typer.
export { linkFields };
