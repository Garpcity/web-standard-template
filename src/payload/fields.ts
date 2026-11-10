/**
 * Gjenbrukbare Payload-felt som speiler common.ts i Zod-skjemaet.
 */
import type { Field } from "payload";

export const slugField: Field = {
  name: "slug",
  type: "text",
  required: true,
  unique: true,
  index: true,
  label: "Slug",
  admin: { description: "Små bokstaver, tall og bindestrek. Brukes i URL." },
  validate: (val: unknown) =>
    typeof val === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val)
      ? true
      : "Slug: små bokstaver, tall og bindestrek",
};

export const seoGroup: Field = {
  name: "seo",
  type: "group",
  label: "SEO",
  fields: [
    { name: "title", type: "text", label: "Metatittel", maxLength: 70 },
    { name: "description", type: "textarea", label: "Metabeskrivelse", maxLength: 170 },
    { name: "image", type: "upload", relationTo: "media", label: "Delingsbilde" },
    {
      name: "noindex",
      type: "checkbox",
      label: "Skjul for søkemotorer (noindex)",
      defaultValue: false,
    },
    { name: "canonical", type: "text", label: "Kanonisk URL" },
  ],
};

export const linkFields: Field[] = [
  { name: "label", type: "text", required: true, label: "Tekst" },
  { name: "href", type: "text", required: true, label: "Lenke" },
  { name: "external", type: "checkbox", label: "Ekstern", defaultValue: false },
  {
    name: "variant",
    type: "select",
    label: "Stil",
    defaultValue: "primary",
    options: [
      { label: "Primær", value: "primary" },
      { label: "Sekundær", value: "secondary" },
      { label: "Tekstlenke", value: "ghost" },
    ],
  },
];

/** Innholdsblokker lagres som JSON (Puck-format = kontraktens Block[]) og valideres med Zod i hook. */
export const blocksJsonField: Field = {
  name: "blocks",
  type: "json",
  label: "Innholdsblokker",
  admin: {
    description: "Redigeres visuelt i /edit/[slug]. Rå JSON her er for feilsøking.",
  },
  defaultValue: [],
};

export const statusField: Field = {
  name: "status",
  type: "select",
  label: "Status",
  defaultValue: "draft",
  options: [
    { label: "Utkast", value: "draft" },
    { label: "Publisert", value: "published" },
  ],
  admin: { position: "sidebar" },
};
