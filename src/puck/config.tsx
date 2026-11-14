"use client";

/**
 * Puck-konfigurasjon: registrerer blokkene våre som visuelle komponenter.
 * Én registrering per blokk. Feltene speiler Zod-skjemaet i schema/blocks.ts.
 * Låste felt (permissions.ts) skjules for roller under `owner`.
 */
import { iconNames } from "@/design/icons";
import type { Config, Fields } from "@puckeditor/core";
import type { Block, BlockOf, ImageRef, LinkRef } from "@/content/schema";
import { lockedBlockFields, type Role } from "@/content/permissions";
import { Hero } from "@/components/blocks/Hero";
import { Text } from "@/components/blocks/Text";
import { TextImage } from "@/components/blocks/TextImage";
import { CardGrid } from "@/components/blocks/CardGrid";
import { Gallery } from "@/components/blocks/Gallery";
import { Quote } from "@/components/blocks/Quote";
import { Faq } from "@/components/blocks/Faq";
import { ContactForm } from "@/components/blocks/ContactForm";
import { Embed } from "@/components/blocks/Embed";
import { Cta } from "@/components/blocks/Cta";
import { Stats } from "@/components/blocks/Stats";
import { Model3d } from "@/components/blocks/Model3d";
import { DataTable } from "@/components/blocks/DataTable";
import { Section, SectionHeading } from "@/components/ui/Section";
import {
  cellsToText,
  plainToRichText,
  richTextToPlain,
  rowsToText,
  textToCells,
  textToRows,
} from "./convert";
import { RevealObserver } from "@/components/motion/RevealObserver";

type Props<T extends Block["_type"]> = Omit<BlockOf<T>, "_type">;
type Defaults<T extends Block["_type"]> = Omit<Props<T>, "id">;

/* ---------- Gjenbrukbare feltdefinisjoner ---------- */

const toneField = {
  type: "select" as const,
  label: "Bakgrunn",
  options: [
    { label: "Standard", value: "default" },
    { label: "Dempet", value: "muted" },
    { label: "Merkevare", value: "brand" },
    { label: "Mørk", value: "dark" },
  ],
};

const imageField = {
  type: "object" as const,
  label: "Bilde",
  objectFields: {
    url: { type: "text" as const, label: "URL" },
    alt: { type: "text" as const, label: "Alt-tekst" },
    width: { type: "number" as const, label: "Bredde (px)" },
    height: { type: "number" as const, label: "Høyde (px)" },
    caption: { type: "text" as const, label: "Bildetekst" },
  },
};

const linkFields = {
  label: { type: "text" as const, label: "Tekst" },
  href: { type: "text" as const, label: "Lenke" },
  external: {
    type: "radio" as const,
    label: "Ekstern",
    options: [
      { label: "Ja", value: true },
      { label: "Nei", value: false },
    ],
  },
  variant: {
    type: "select" as const,
    label: "Stil",
    options: [
      { label: "Primær", value: "primary" },
      { label: "Sekundær", value: "secondary" },
      { label: "Tekstlenke", value: "ghost" },
    ],
  },
};

const linkField = { type: "object" as const, label: "Lenke", objectFields: linkFields };
const linksField = {
  type: "array" as const,
  label: "Lenker",
  arrayFields: linkFields,
  getItemSummary: (i: LinkRef) => i.label || "Lenke",
};

/** Rik tekst som tekstfelt med enkel syntaks (## overskrift, - punkt). Lagres som RichText. */
const richTextField = {
  type: "custom" as const,
  label: "Tekst",
  render: ({
    value,
    onChange,
    field,
  }: {
    value: unknown;
    onChange: (v: unknown) => void;
    field: { label?: string };
  }) => (
    <label className="puck-field">
      <span style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
        {field.label}
      </span>
      <textarea
        rows={8}
        style={{
          width: "100%",
          fontFamily: "inherit",
          fontSize: 14,
          padding: 8,
          border: "1px solid #ddd",
          borderRadius: 6,
        }}
        defaultValue={Array.isArray(value) ? richTextToPlain(value) : ""}
        onBlur={(e) => onChange(plainToRichText(e.target.value))}
        placeholder={"Avsnitt per linje.\n## Overskrift\n- Punkt\n> Sitat"}
      />
    </label>
  ),
};

/**
 * Tabellfelt for dataTable. Valg: i stedet for `array` av tekstfelt (kolonner) og
 * `array` av objekter med ett felt per celle (rader) – tungvint å redigere – bruker vi
 * ett tekstfelt for kolonner og ett textarea for rader, med `|` som celleskille.
 * Konverteringen skjer i feltet (samme mønster som richTextField), så Puck-data
 * lagrer `columns: string[]` og `rows: string[][]` direkte. Da trengs ingen
 * skyggeprop + resolveData, og blocksToPuck/puckToBlocks er tapsfri.
 * Ulik radlengde avvises av Zod-skjemaet ved lagring.
 */
const pipeFieldStyle = {
  width: "100%",
  fontFamily: "inherit",
  fontSize: 14,
  padding: 8,
  border: "1px solid #ddd",
  borderRadius: 6,
};

const columnsField = {
  type: "custom" as const,
  label: "Kolonneoverskrifter (skilt med |)",
  render: ({
    value,
    onChange,
    field,
  }: {
    value: unknown;
    onChange: (v: unknown) => void;
    field: { label?: string };
  }) => (
    <label className="puck-field">
      <span style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
        {field.label}
      </span>
      <input
        type="text"
        style={pipeFieldStyle}
        defaultValue={cellsToText(value)}
        onBlur={(e) => onChange(textToCells(e.target.value))}
        placeholder="Pakke | Inkluderer | Pris"
      />
    </label>
  ),
};

const rowsField = {
  type: "custom" as const,
  label: "Rader (én rad per linje, celler skilt med |)",
  render: ({
    value,
    onChange,
    field,
  }: {
    value: unknown;
    onChange: (v: unknown) => void;
    field: { label?: string };
  }) => (
    <label className="puck-field">
      <span style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
        {field.label}
      </span>
      <textarea
        rows={8}
        style={pipeFieldStyle}
        defaultValue={rowsToText(value)}
        onBlur={(e) => onChange(textToRows(e.target.value))}
        placeholder={"Basis | Én side | 15 000\nPluss | Fem sider | 45 000"}
      />
    </label>
  ),
};

/* ---------- Komponenter ---------- */

function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <Section tone="muted">
      <SectionHeading heading={title} lead={note} />
    </Section>
  );
}

const defaultImage: ImageRef = {
  url: "/images/case-1.svg",
  alt: "",
  width: 1200,
  height: 800,
};

export function buildPuckConfig(role: Role = "editor"): Config {
  const config: Config = {
    categories: {
      innhold: {
        title: "Innhold",
        components: ["Hero", "Text", "TextImage", "Quote", "Faq", "Cta"],
      },
      lister: {
        title: "Lister og kort",
        components: [
          "CardGrid",
          "Stats",
          "DataTable",
          "Gallery",
          "People",
          "LatestArticles",
        ],
      },
      funksjon: { title: "Funksjon", components: ["ContactForm", "Embed"] },
    },
    root: {
      fields: { title: { type: "text", label: "Sidetittel" } },
      render: ({ children }: { children?: React.ReactNode }) => (
        <div>
          {children}
          <RevealObserver />
        </div>
      ),
    },
    components: {
      Hero: {
        label: "Hero",
        fields: {
          eyebrow: { type: "text", label: "Liten overtekst" },
          heading: { type: "text", label: "Overskrift" },
          lead: { type: "textarea", label: "Ingress" },
          image: imageField,
          links: linksField,
          layout: {
            type: "select",
            label: "Layout",
            options: [
              { label: "Delt", value: "split" },
              { label: "Sentrert", value: "centered" },
              { label: "Fullbredde", value: "fullBleed" },
            ],
          },
          tone: toneField,
        },
        defaultProps: {
          heading: "Overskrift",
          lead: "Ingress",
          links: [],
          layout: "split",
          tone: "default",
        } as Defaults<"hero">,
        render: (props) => (
          <Hero block={{ _type: "hero", ...(props as unknown as Props<"hero">) }} />
        ),
      },
      Text: {
        label: "Tekst",
        fields: {
          heading: { type: "text", label: "Overskrift" },
          body: richTextField,
          width: {
            type: "radio",
            label: "Bredde",
            options: [
              { label: "Smal", value: "narrow" },
              { label: "Bred", value: "wide" },
            ],
          },
          tone: toneField,
        },
        defaultProps: {
          body: plainToRichText("Skriv teksten her."),
          width: "narrow",
          tone: "default",
        } as Defaults<"text">,
        render: (props) => (
          <Text block={{ _type: "text", ...(props as unknown as Props<"text">) }} />
        ),
      },
      TextImage: {
        label: "Tekst og bilde",
        fields: {
          heading: { type: "text", label: "Overskrift" },
          body: richTextField,
          image: imageField,
          imagePosition: {
            type: "radio",
            label: "Bilde",
            options: [
              { label: "Venstre", value: "left" },
              { label: "Høyre", value: "right" },
            ],
          },
          link: linkField,
          tone: toneField,
        },
        defaultProps: {
          body: plainToRichText("Tekst ved siden av bildet."),
          image: defaultImage,
          imagePosition: "right",
          tone: "default",
        } as Defaults<"textImage">,
        render: (props) => (
          <TextImage
            block={{ _type: "textImage", ...(props as unknown as Props<"textImage">) }}
          />
        ),
      },
      CardGrid: {
        label: "Kort-rutenett",
        fields: {
          heading: { type: "text", label: "Overskrift" },
          lead: { type: "textarea", label: "Ingress" },
          columns: {
            type: "select",
            label: "Kolonner",
            options: [
              { label: "2", value: 2 },
              { label: "3", value: 3 },
              { label: "4", value: 4 },
            ],
          },
          items: {
            type: "array",
            label: "Kort",
            getItemSummary: (i: { title?: string }) => i.title || "Kort",
            arrayFields: {
              id: { type: "text", label: "ID" },
              title: { type: "text", label: "Tittel" },
              text: { type: "textarea", label: "Tekst" },
              icon: {
                type: "select",
                label: "Ikon",
                options: [
                  { label: "Ingen", value: "" },
                  ...iconNames.map((n) => ({ label: n, value: n })),
                ],
              },
              image: imageField,
              link: linkField,
            },
          },
          tone: toneField,
        },
        defaultProps: {
          columns: 3,
          items: [
            { id: "k1", title: "Kort 1", text: "Tekst" },
            { id: "k2", title: "Kort 2", text: "Tekst" },
            { id: "k3", title: "Kort 3", text: "Tekst" },
          ],
          tone: "default",
        } as Defaults<"cardGrid">,
        render: (props) => (
          <CardGrid
            block={{ _type: "cardGrid", ...(props as unknown as Props<"cardGrid">) }}
          />
        ),
      },
      People: {
        label: "Ansatte",
        fields: {
          heading: { type: "text", label: "Overskrift" },
          lead: { type: "textarea", label: "Ingress" },
          tone: toneField,
        },
        defaultProps: {
          heading: "Folkene",
          personIds: [],
          tone: "default",
        } as Defaults<"people">,
        render: (props) => (
          <Placeholder
            title={(props as unknown as Props<"people">).heading ?? "Ansatte"}
            note="Ansatte hentes fra CMS når siden vises."
          />
        ),
      },
      LatestArticles: {
        label: "Siste artikler",
        fields: {
          heading: { type: "text", label: "Overskrift" },
          limit: { type: "number", label: "Antall", min: 1, max: 12 },
          link: linkField,
          tone: toneField,
        },
        defaultProps: {
          heading: "Siste nytt",
          limit: 3,
          tone: "default",
        } as Defaults<"latestArticles">,
        render: (props) => (
          <Placeholder
            title={(props as unknown as Props<"latestArticles">).heading}
            note="Artikler hentes fra CMS når siden vises."
          />
        ),
      },
      Gallery: {
        label: "Galleri",
        fields: {
          heading: { type: "text", label: "Overskrift" },
          images: {
            type: "array",
            label: "Bilder",
            arrayFields: imageField.objectFields,
            getItemSummary: (i: ImageRef) => i.alt || i.url,
          },
          layout: {
            type: "radio",
            label: "Layout",
            options: [
              { label: "Rutenett", value: "grid" },
              { label: "Masonry", value: "masonry" },
            ],
          },
          tone: toneField,
        },
        defaultProps: {
          images: [defaultImage],
          layout: "grid",
          tone: "default",
        } as Defaults<"gallery">,
        render: (props) => (
          <Gallery
            block={{ _type: "gallery", ...(props as unknown as Props<"gallery">) }}
          />
        ),
      },
      Quote: {
        label: "Sitat",
        fields: {
          quote: { type: "textarea", label: "Sitat" },
          author: { type: "text", label: "Navn" },
          role: { type: "text", label: "Rolle" },
          tone: toneField,
        },
        defaultProps: {
          quote: "Et sitat som sier noe viktig.",
          tone: "brand",
        } as Defaults<"quote">,
        render: (props) => (
          <Quote block={{ _type: "quote", ...(props as unknown as Props<"quote">) }} />
        ),
      },
      Faq: {
        label: "Ofte stilte spørsmål",
        fields: {
          heading: { type: "text", label: "Overskrift" },
          lead: { type: "textarea", label: "Ingress" },
          items: {
            type: "array",
            label: "Spørsmål",
            getItemSummary: (i: { question?: string }) => i.question || "Spørsmål",
            arrayFields: {
              id: { type: "text", label: "ID" },
              question: { type: "text", label: "Spørsmål" },
              answer: { ...richTextField, label: "Svar" },
            },
          },
          tone: toneField,
        },
        defaultProps: {
          heading: "Ofte stilte spørsmål",
          items: [{ id: "q1", question: "Spørsmål?", answer: plainToRichText("Svar.") }],
          tone: "default",
        } as Defaults<"faq">,
        render: (props) => (
          <Faq block={{ _type: "faq", ...(props as unknown as Props<"faq">) }} />
        ),
      },
      ContactForm: {
        label: "Kontaktskjema",
        fields: {
          heading: { type: "text", label: "Overskrift" },
          lead: { type: "textarea", label: "Ingress" },
          submitLabel: { type: "text", label: "Knappetekst" },
          successMessage: { type: "text", label: "Takkemelding" },
          tone: toneField,
        },
        defaultProps: {
          heading: "Kontakt oss",
          formId: "contact",
          fields: [
            { name: "name", label: "Navn", type: "text", required: true },
            { name: "email", label: "E-post", type: "email", required: true },
            { name: "message", label: "Melding", type: "textarea", required: true },
          ],
          submitLabel: "Send",
          successMessage: "Takk! Vi tar kontakt snart.",
          tone: "default",
        } as Defaults<"contactForm">,
        render: (props) => (
          <ContactForm
            block={{
              _type: "contactForm",
              ...(props as unknown as Props<"contactForm">),
            }}
          />
        ),
      },
      Embed: {
        label: "Innbygging",
        fields: {
          heading: { type: "text", label: "Overskrift" },
          provider: {
            type: "select",
            label: "Kilde",
            options: [
              { label: "YouTube", value: "youtube" },
              { label: "Vimeo", value: "vimeo" },
              { label: "Kart", value: "map" },
              { label: "Iframe", value: "iframe" },
            ],
          },
          src: { type: "text", label: "URL" },
          title: { type: "text", label: "Tittel (tilgjengelighet)" },
          aspect: {
            type: "select",
            label: "Format",
            options: [
              { label: "16:9", value: "16/9" },
              { label: "4:3", value: "4/3" },
              { label: "1:1", value: "1/1" },
            ],
          },
          tone: toneField,
        },
        defaultProps: {
          provider: "youtube",
          src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Video",
          aspect: "16/9",
          tone: "default",
        } as Defaults<"embed">,
        render: (props) => (
          <Embed block={{ _type: "embed", ...(props as unknown as Props<"embed">) }} />
        ),
      },
      Cta: {
        label: "Call to action",
        fields: {
          heading: { type: "text", label: "Overskrift" },
          text: { type: "textarea", label: "Tekst" },
          links: linksField,
          tone: toneField,
        },
        defaultProps: {
          heading: "Klar til å komme i gang?",
          links: [
            {
              label: "Ta kontakt",
              href: "/kontakt",
              external: false,
              variant: "primary",
            },
          ],
          tone: "dark",
        } as Defaults<"cta">,
        render: (props) => (
          <Cta block={{ _type: "cta", ...(props as unknown as Props<"cta">) }} />
        ),
      },
      Stats: {
        label: "Nøkkeltall",
        fields: {
          heading: { type: "text", label: "Overskrift" },
          items: {
            type: "array",
            label: "Tall",
            getItemSummary: (i: { label?: string }) => i.label || "Tall",
            arrayFields: {
              id: { type: "text", label: "ID" },
              value: { type: "number", label: "Verdi" },
              prefix: { type: "text", label: "Prefiks" },
              suffix: { type: "text", label: "Suffiks" },
              label: { type: "text", label: "Etikett" },
            },
          },
          tone: toneField,
        },
        defaultProps: {
          items: [
            { id: "s1", value: 100, suffix: "%", label: "Fornøyde kunder" },
            { id: "s2", value: 24, label: "Prosjekter" },
          ],
          tone: "muted",
        } as Defaults<"stats">,
        render: (props) => (
          <Stats block={{ _type: "stats", ...(props as unknown as Props<"stats">) }} />
        ),
      },
      DataTable: {
        label: "Tabell",
        fields: {
          heading: { type: "text", label: "Overskrift" },
          lead: { type: "textarea", label: "Ingress" },
          columns: columnsField,
          rows: rowsField,
          firstColumnIsHeader: {
            type: "radio",
            label: "Første kolonne er radoverskrift",
            options: [
              { label: "Ja", value: true },
              { label: "Nei", value: false },
            ],
          },
          caption: { type: "text", label: "Tabelltekst (f.eks. «oppdatert 2026-11»)" },
          source: { ...linkField, label: "Kilde" },
          width: {
            type: "radio",
            label: "Bredde",
            options: [
              { label: "Smal", value: "narrow" },
              { label: "Bred", value: "wide" },
            ],
          },
          tone: toneField,
        },
        defaultProps: {
          heading: "Sammenligning",
          columns: ["Pakke", "Inkluderer", "Pris"],
          rows: [
            ["Basis", "Én side", "15 000"],
            ["Pluss", "Fem sider", "45 000"],
          ],
          firstColumnIsHeader: true,
          width: "narrow",
          tone: "default",
        } as Defaults<"dataTable">,
        render: (props) => (
          <DataTable
            block={{ _type: "dataTable", ...(props as unknown as Props<"dataTable">) }}
          />
        ),
      },
      Model3d: {
        label: "3D-modell",
        fields: {
          heading: { type: "text", label: "Overskrift" },
          lead: { type: "textarea", label: "Ingress" },
          src: { type: "text", label: "Modell (.glb-URL). Tom = demo" },
          alt: { type: "text", label: "Beskrivelse (tilgjengelighet)" },
          poster: imageField,
          autoRotate: {
            type: "radio",
            label: "Auto-rotasjon",
            options: [
              { label: "På", value: true },
              { label: "Av", value: false },
            ],
          },
          interactive: {
            type: "radio",
            label: "Kan dreies",
            options: [
              { label: "Ja", value: true },
              { label: "Nei", value: false },
            ],
          },
          height: {
            type: "radio",
            label: "Høyde",
            options: [
              { label: "Middels", value: "medium" },
              { label: "Høy", value: "tall" },
            ],
          },
          layout: {
            type: "radio",
            label: "Layout",
            options: [
              { label: "Seksjon", value: "section" },
              { label: "Hero", value: "hero" },
            ],
          },
          tone: toneField,
        },
        defaultProps: {
          alt: "3D-modell",
          autoRotate: true,
          interactive: true,
          height: "medium",
          layout: "section",
          tone: "default",
        } as Defaults<"model3d">,
        render: (props) => (
          <Model3d
            block={{ _type: "model3d", ...(props as unknown as Props<"model3d">) }}
          />
        ),
      },
    },
  };

  // Skjul låste felt for roller under owner (permissions.ts er kilden).
  if (role !== "owner") {
    for (const [name, def] of Object.entries(config.components)) {
      const key = name.charAt(0).toLowerCase() + name.slice(1);
      const locked = lockedBlockFields[key] ?? [];
      if (def.fields) {
        def.fields = Object.fromEntries(
          Object.entries(def.fields as Fields).filter(([f]) => !locked.includes(f)),
        ) as Fields;
      }
    }
  }
  return config;
}
