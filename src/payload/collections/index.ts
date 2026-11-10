import type { CollectionConfig } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { applyLockedFields, roles, type Role } from "@/content/permissions";
import { block as blockSchema } from "@/content/schema";
import {
  canEditContent,
  enforcePublishRight,
  isOwner,
  isOwnerOrAdmin,
  publishedOrLoggedIn,
} from "../access";
import { blocksJsonField, linkFields, seoGroup, slugField, statusField } from "../fields";

const statusWithHook = { ...statusField, hooks: { beforeChange: [enforcePublishRight] } };

const agentMetaField = {
  name: "agentMeta",
  type: "json" as const,
  label: "Agent-spor",
  admin: {
    readOnly: true,
    description: "Satt automatisk når innholdet er laget via MCP.",
  },
};

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email", group: "System" },
  access: {
    read: isOwnerOrAdmin,
    create: isOwnerOrAdmin,
    update: isOwnerOrAdmin,
    delete: isOwner,
  },
  fields: [
    { name: "name", type: "text", label: "Navn" },
    {
      name: "role",
      type: "select",
      label: "Rolle",
      required: true,
      defaultValue: "editor",
      options: roles.map((r) => ({ label: r, value: r })),
      access: {
        update: ({ req }) =>
          ["owner", "admin"].includes((req.user as { role?: string })?.role ?? ""),
      },
    },
  ],
};

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Media", plural: "Media" },
  admin: { group: "Innhold" },
  access: {
    read: () => true,
    create: canEditContent,
    update: canEditContent,
    delete: isOwnerOrAdmin,
  },
  upload: {
    staticDir: "public/media",
    mimeTypes: ["image/*", "application/pdf"],
    imageSizes: [
      { name: "thumb", width: 400 },
      { name: "card", width: 800 },
      { name: "hero", width: 1600 },
    ],
    focalPoint: true,
  },
  fields: [
    { name: "alt", type: "text", label: "Alt-tekst", required: true },
    { name: "caption", type: "text", label: "Bildetekst" },
  ],
};

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: { singular: "Kategori", plural: "Kategorier" },
  admin: { useAsTitle: "name", group: "Innhold" },
  access: {
    read: () => true,
    create: canEditContent,
    update: canEditContent,
    delete: isOwnerOrAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true, label: "Navn" },
    slugField,
    { name: "description", type: "textarea", label: "Beskrivelse" },
  ],
};

export const People: CollectionConfig = {
  slug: "people",
  labels: { singular: "Person", plural: "Personer" },
  admin: {
    useAsTitle: "name",
    group: "Innhold",
    defaultColumns: ["name", "role", "status"],
  },
  access: {
    read: publishedOrLoggedIn,
    create: canEditContent,
    update: canEditContent,
    delete: isOwnerOrAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true, label: "Navn" },
    slugField,
    { name: "role", type: "text", label: "Rolle/tittel" },
    { name: "image", type: "upload", relationTo: "media", label: "Bilde" },
    { name: "bio", type: "richText", label: "Bio", editor: lexicalEditor() },
    { name: "email", type: "email", label: "E-post" },
    { name: "phone", type: "text", label: "Telefon" },
    {
      name: "knowsAbout",
      type: "array",
      label: "Fagområder (E-E-A-T)",
      fields: [{ name: "value", type: "text", required: true }],
    },
    {
      name: "credentials",
      type: "array",
      label: "Kvalifikasjoner",
      fields: [{ name: "value", type: "text", required: true }],
    },
    {
      name: "sameAs",
      type: "array",
      label: "Offisielle profiler (URL)",
      fields: [{ name: "value", type: "text", required: true }],
    },
    statusWithHook,
  ],
};

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: { singular: "Side", plural: "Sider" },
  admin: {
    useAsTitle: "title",
    group: "Innhold",
    defaultColumns: ["title", "slug", "status", "updatedAt"],
  },
  access: {
    read: publishedOrLoggedIn,
    create: canEditContent,
    update: canEditContent,
    delete: isOwnerOrAdmin,
  },
  versions: { drafts: false, maxPerDoc: 20 },
  hooks: {
    beforeValidate: [
      ({ data, req, originalDoc }) => {
        // Låste felt håndheves også her (admin, REST), med samme funksjon som /api/puck og MCP.
        // Uten bruker (seed, system) gjelder ingen begrensning.
        if (req.user && data?.blocks && Array.isArray(data.blocks)) {
          const role = ((req.user as { role?: Role }).role ?? "contributor") as Role;
          data.blocks = applyLockedFields(role, data.blocks, originalDoc?.blocks ?? []);
        }
        // Kontrakten håndhever blokkene: ugyldige blokker stoppes før lagring.
        if (data?.blocks && Array.isArray(data.blocks)) {
          data.blocks.forEach((b: unknown, i: number) => {
            const r = blockSchema.safeParse(b);
            if (!r.success)
              throw new Error(`Blokk ${i + 1} er ugyldig: ${r.error.issues[0]?.message}`);
          });
        }
        return data;
      },
    ],
  },
  fields: [
    { name: "title", type: "text", required: true, label: "Tittel" },
    slugField,
    blocksJsonField,
    seoGroup,
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      label: "Innholdsansvarlig",
      admin: { position: "sidebar" },
    },
    agentMetaField,
    statusWithHook,
  ],
};

export const Articles: CollectionConfig = {
  slug: "articles",
  labels: { singular: "Artikkel", plural: "Artikler" },
  admin: {
    useAsTitle: "title",
    group: "Innhold",
    defaultColumns: ["title", "author", "publishedAt", "status"],
  },
  access: {
    read: publishedOrLoggedIn,
    create: canEditContent,
    update: canEditContent,
    delete: isOwnerOrAdmin,
  },
  versions: { drafts: false, maxPerDoc: 20 },
  fields: [
    { name: "title", type: "text", required: true, label: "Tittel" },
    slugField,
    {
      name: "summary",
      type: "textarea",
      required: true,
      maxLength: 400,
      label: "Kort svar (40–60 ord)",
      admin: {
        description:
          "Vises øverst og brukes av AI-søk. Svar på spørsmålet artikkelen handler om.",
      },
    },
    { name: "image", type: "upload", relationTo: "media", label: "Hovedbilde" },
    {
      name: "author",
      type: "relationship",
      relationTo: "people",
      required: true,
      label: "Forfatter",
    },
    {
      name: "publishedAt",
      type: "date",
      required: true,
      label: "Publisert",
      admin: { position: "sidebar" },
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      label: "Kategorier",
    },
    {
      name: "body",
      type: "richText",
      required: true,
      label: "Brødtekst",
      editor: lexicalEditor(),
    },
    { name: "sources", type: "array", label: "Kilder", fields: linkFields },
    seoGroup,
    agentMetaField,
    statusWithHook,
  ],
};

export const SocialPosts: CollectionConfig = {
  slug: "social-posts",
  labels: { singular: "Sosial post", plural: "Sosiale poster" },
  admin: {
    useAsTitle: "text",
    group: "Innhold",
    defaultColumns: ["channel", "status", "scheduledFor", "updatedAt"],
  },
  access: {
    read: canEditContent,
    create: canEditContent,
    update: canEditContent,
    delete: isOwnerOrAdmin,
  },
  fields: [
    slugField,
    { name: "channel", type: "text", required: true, label: "Kanal" },
    { name: "text", type: "textarea", required: true, maxLength: 5000, label: "Tekst" },
    {
      name: "hashtags",
      type: "array",
      label: "Hashtags",
      fields: [{ name: "value", type: "text", required: true }],
    },
    { name: "image", type: "upload", relationTo: "media", label: "Bilde" },
    { name: "sourceSlug", type: "text", label: "Bygger på (slug)" },
    {
      name: "scheduledFor",
      type: "date",
      label: "Planlagt",
      admin: { position: "sidebar" },
    },
    agentMetaField,
    statusWithHook,
  ],
};

export const FormSubmissions: CollectionConfig = {
  slug: "form-submissions",
  labels: { singular: "Skjemainnsending", plural: "Skjemainnsendinger" },
  admin: { group: "System", defaultColumns: ["formId", "submittedAt"] },
  access: {
    read: isOwnerOrAdmin,
    create: () => true,
    update: () => false,
    delete: isOwnerOrAdmin,
  },
  fields: [
    { name: "formId", type: "text", required: true },
    { name: "fields", type: "json", required: true },
    { name: "submittedAt", type: "date", required: true },
    { name: "ipHash", type: "text" },
    { name: "pageUrl", type: "text" },
  ],
};

export const Redirects: CollectionConfig = {
  slug: "redirects",
  labels: { singular: "Redirect", plural: "Redirects" },
  admin: { useAsTitle: "from", group: "System" },
  access: {
    read: () => true,
    create: isOwnerOrAdmin,
    update: isOwnerOrAdmin,
    delete: isOwnerOrAdmin,
  },
  fields: [
    { name: "from", type: "text", required: true, label: "Fra (sti)" },
    { name: "to", type: "text", required: true, label: "Til" },
    { name: "permanent", type: "checkbox", defaultValue: true, label: "Permanent (301)" },
  ],
};

export const collections = [
  Users,
  Media,
  Categories,
  People,
  Pages,
  Articles,
  FormSubmissions,
  Redirects,
];
