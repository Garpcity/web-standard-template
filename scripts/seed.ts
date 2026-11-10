/**
 * seed.ts – skriver eksempelinnhold til mock-adapteren og lager plassholderbilder.
 * Kjør: pnpm seed
 *
 * Innholdet er for pilot A: AD.Moment (org.nr. 838 722 822). Personnavn, roller og
 * bilder er plassholdere til kunden leverer reelle data. Fakta som ikke er
 * bekreftet er merket approved: false i profilmanualen. Det følger reglene for siterbart innhold: svar først, fakta, kilder.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  article,
  brandGuide,
  category,
  menu,
  page,
  person,
  redirect,
  siteSettings,
  type ImageRef,
  type RichText,
} from "../src/content/schema";

const root = process.cwd();
const dataDir = path.join(root, "src/content/adapters/mock/data");
const imgDir = path.join(root, "public/images");

const now = "2026-11-10T09:00:00.000Z";

function svg(
  name: string,
  w: number,
  h: number,
  from: string,
  to: string,
  label: string,
) {
  return {
    file: `${name}.svg`,
    content: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<circle cx="${w * 0.78}" cy="${h * 0.3}" r="${Math.min(w, h) * 0.22}" fill="rgba(255,255,255,0.12)"/>
<text x="${w / 2}" y="${h / 2}" font-family="system-ui, sans-serif" font-size="${Math.round(h * 0.06)}" fill="rgba(255,255,255,0.85)" text-anchor="middle" dominant-baseline="middle">${label}</text>
</svg>`,
    ref: (alt: string): ImageRef => ({
      url: `/images/${name}.svg`,
      alt,
      width: w,
      height: h,
    }),
  };
}

const images = {
  hero: svg("hero", 1600, 1200, "#0f4c5c", "#e36414", "Hero"),
  office: svg("office", 1600, 1067, "#0a3540", "#0f4c5c", "Kontor"),
  case1: svg("case-1", 1200, 800, "#1f7a4d", "#0f4c5c", "Case 1"),
  case2: svg("case-2", 1200, 800, "#e36414", "#b7791f", "Case 2"),
  case3: svg("case-3", 1200, 800, "#5c6068", "#16181d", "Case 3"),
  person1: svg("person-1", 800, 800, "#0f4c5c", "#5c6068", "KJ"),
  person2: svg("person-2", 800, 800, "#e36414", "#0f4c5c", "MH"),
  person3: svg("person-3", 800, 800, "#1f7a4d", "#16181d", "SA"),
  article1: svg("article-1", 1600, 900, "#0f4c5c", "#1f7a4d", "Artikkel"),
  article2: svg("article-2", 1600, 900, "#b7791f", "#e36414", "Artikkel"),
  article3: svg("article-3", 1600, 900, "#16181d", "#0f4c5c", "Artikkel"),
  og: svg("og-default", 1200, 630, "#0f4c5c", "#e36414", "AD.Moment"),
};

const p = (text: string, style: "normal" | "h2" | "h3" = "normal"): RichText[number] => ({
  _type: "block",
  style,
  children: [{ _type: "span", text, marks: [] }],
});
const li = (text: string): RichText[number] => ({
  _type: "block",
  style: "normal",
  listItem: "bullet",
  level: 1,
  children: [{ _type: "span", text, marks: [] }],
});

const site = siteSettings.parse({
  name: "AD.Moment",
  tagline: "Nettsider som blir funnet, lest og sitert",
  description:
    "AD.Moment bygger raske, åpne nettsider for norske bedrifter – med innhold som AI-søk og mennesker stoler på.",
  logo: undefined,
  defaultSeo: { image: images.og.ref("AD.Moment"), noindex: false },
  contact: {
    email: "post@admoment.example",
    phone: "+47 400 00 000",
    address: "Adresse fylles inn",
    orgNumber: "838 722 822",
  },
  social: [
    { platform: "linkedin", url: "https://www.linkedin.com/company/example" },
    { platform: "instagram", url: "https://www.instagram.com/example" },
  ],
  footerText: "© AD.Moment. Bygget på vår åpne standard for nettsideutvikling.",
  sameAs: ["https://www.linkedin.com/company/example", "https://www.proff.no/"],
});

const menus = [
  menu.parse({
    name: "main",
    items: [
      { id: "m1", label: "Tjenester", href: "/tjenester" },
      { id: "m2", label: "Om oss", href: "/om-oss" },
      { id: "m3", label: "Artikler", href: "/artikler" },
      { id: "m4", label: "Kontakt", href: "/kontakt" },
    ],
  }),
  menu.parse({
    name: "footer",
    items: [
      { id: "f1", label: "Tjenester", href: "/tjenester" },
      { id: "f2", label: "Om oss", href: "/om-oss" },
      { id: "f3", label: "Artikler", href: "/artikler" },
      { id: "f4", label: "Profilmanual", href: "/profil" },
    ],
  }),
  menu.parse({
    name: "legal",
    items: [{ id: "l1", label: "Personvern", href: "/personvern" }],
  }),
];

const people = [
  person.parse({
    id: "p-1",
    slug: "ansatt-1",
    createdAt: now,
    updatedAt: now,
    name: "Ansatt 1 (navn kommer)",
    role: "Daglig leder",
    image: images.person1.ref("Ansatt 1"),
    bio: [p("Leder AD.Moment og standardarbeidet. Bio fylles inn av kunden.")],
    knowsAbout: ["Headless CMS", "WordPress", "Søkemotoroptimalisering", "AI-synlighet"],
    credentials: [],
  }),
  person.parse({
    id: "p-2",
    slug: "ansatt-2",
    createdAt: now,
    updatedAt: now,
    name: "Ansatt 2 (navn kommer)",
    role: "Utvikler",
    image: images.person2.ref("Ansatt 2"),
    bio: [p("Bygger frontend og integrasjoner. Bio fylles inn av kunden.")],
    knowsAbout: ["Next.js", "TypeScript", "n8n", "Payload CMS"],
    credentials: [],
  }),
  person.parse({
    id: "p-3",
    slug: "ansatt-3",
    createdAt: now,
    updatedAt: now,
    name: "Ansatt 3 (navn kommer)",
    role: "Designer og 3D",
    image: images.person3.ref("Ansatt 3"),
    bio: [
      p(
        "Ansvar for estetikklaget, bevegelse og 3D-produksjon i Cinema 4D. Bio fylles inn av kunden.",
      ),
    ],
    knowsAbout: ["Visuell design", "Motion design", "Cinema 4D", "Tilgjengelighet"],
    credentials: [],
  }),
];

const categories = [
  category.parse({
    id: "c-seo",
    slug: "synlighet",
    name: "Synlighet",
    description: "SEO, AEO og GEO",
  }),
  category.parse({ id: "c-tech", slug: "teknologi", name: "Teknologi" }),
  category.parse({ id: "c-design", slug: "design", name: "Design" }),
];

const articles = [
  article.parse({
    id: "a-1",
    slug: "slik-blir-bedriften-din-sitert-av-ai",
    createdAt: now,
    updatedAt: now,
    publishedAt: "2026-11-03T08:00:00.000Z",
    title: "Slik blir bedriften din sitert av AI-søk",
    summary:
      "AI-motorer som ChatGPT, Perplexity og Google AI Overviews siterer kilder med dokumentert erfaring, navngitte fagpersoner og originale data. En analyse av 15 847 AI Overview-svar fant at 96 % av siteringene kom fra kilder med sterke E-E-A-T-signaler.",
    image: images.article1.ref("Illustrasjon: AI-søk og kilder"),
    authorId: "p-1",
    categoryIds: ["c-seo"],
    body: [
      p("Tre ting avgjør", "h2"),
      p(
        "Det er ikke domeneautoritet som avgjør om AI siterer deg. Korrelasjonen mellom domeneautoritet og sitering er svak (r=0,18), mens E-E-A-T-signaler korrelerer sterkt (r=0,81).",
      ),
      li("Navngitte fagpersoner med reell bakgrunn, ikke «Redaksjonen»."),
      li("Minst én side med originale data – egne tall, målinger eller priser."),
      li("Omtale utenfor eget domene: bransjeregistre, fagmedier, partnere."),
      p("Hva du gjør i dag", "h2"),
      p(
        "Start med forfattersidene. Legg inn hva hver person kan og hvor det er dokumentert. Deretter: finn ett spørsmål kundene dine stiller som ingen har svart godt på, og svar på det med tall.",
      ),
    ],
    sources: [
      {
        label: "LaunchCodex: E-E-A-T og AI Overviews",
        href: "https://launchcodex.com/?p=3403",
        external: true,
        variant: "ghost",
      },
    ],
    seo: { noindex: false },
  }),
  article.parse({
    id: "a-2",
    slug: "hvorfor-vi-bygger-pa-apen-kildekode",
    createdAt: now,
    updatedAt: now,
    publishedAt: "2026-10-20T08:00:00.000Z",
    title: "Hvorfor vi bygger på åpen kildekode",
    summary:
      "Alle kjernekomponenter i nettsidene våre har MIT- eller GPL-lisens og kan selvhostes. Da kan kunden flytte, forke og videreføre løsningen uansett hva som skjer med leverandøren – eller med oss.",
    image: images.article2.ref("Illustrasjon: åpen kildekode"),
    authorId: "p-2",
    categoryIds: ["c-tech"],
    body: [
      p("Eieren kan endre seg. Lisensen består.", "h2"),
      p(
        "I 2026 ble Payload CMS kjøpt av Figma, og WordPress-prosjektet har hatt en langvarig styringskrise. Ingen av delene har stoppet prosjektene, fordi koden er åpen og kan forkes.",
      ),
      p("Det vi gjør", "h2"),
      li("Next.js, Payload, Puck, Motion og Tailwind: alle MIT."),
      li("Kunden eier repo, database og domene. Vi har tilgang, ikke eierskap."),
      li("README beskriver hvordan en annen leverandør kan ta over."),
    ],
    sources: [],
    seo: { noindex: false },
  }),
  article.parse({
    id: "a-3",
    slug: "bevegelse-som-forklarer",
    createdAt: now,
    updatedAt: now,
    publishedAt: "2026-10-06T08:00:00.000Z",
    title: "Bevegelse som forklarer, ikke pynter",
    summary:
      "Animasjon på nettsider skal vise rekkefølge, retning eller respons. Vi bruker sju navngitte oppskrifter – fra reveal til countUp – og alle har en fallback for brukere som har skrudd av bevegelse.",
    image: images.article3.ref("Illustrasjon: bevegelse"),
    authorId: "p-3",
    categoryIds: ["c-design"],
    body: [
      p("Regelen", "h2"),
      p(
        "Hvis du ikke kan si hva en animasjon forklarer, fjern den. Det er den eneste regelen vi trenger.",
      ),
      p("Oppskriftene", "h2"),
      p(
        "Alle animasjoner i prosjektene våre kommer fra én fil, motion.ts. Det gjør at AI kan bruke dem riktig, og at hele siden beveger seg med samme rytme.",
      ),
    ],
    sources: [],
    seo: { noindex: false },
  }),
];

const pages = [
  page.parse({
    id: "pg-home",
    slug: "forside",
    createdAt: now,
    updatedAt: now,
    title: "AD.Moment – nettsider som blir funnet, lest og sitert",
    seo: {
      title: "AD.Moment – nettsider for norske bedrifter",
      description:
        "Raske, åpne nettsider med innhold AI-søk og mennesker stoler på. Bygget på vår standard, levert på dager.",
      noindex: false,
    },
    blocks: [
      {
        _type: "hero",
        id: "b1",
        tone: "default",
        eyebrow: "Nettsider for norske bedrifter",
        heading: "Bli funnet. Bli lest. Bli sitert.",
        lead: "Vi bygger nettsider på en åpen standard som gjør dem raske for mennesker og troverdige for AI-søk. Fra idé til lansert side på dager, ikke måneder.",
        image: images.hero.ref("Abstrakt illustrasjon i merkevarefarger"),
        links: [
          {
            label: "Se hva vi gjør",
            href: "/tjenester",
            external: false,
            variant: "primary",
          },
          {
            label: "Ta kontakt",
            href: "/kontakt",
            external: false,
            variant: "secondary",
          },
        ],
        layout: "split",
      },
      {
        _type: "stats",
        id: "b2",
        tone: "muted",
        heading: "Standarden i tall",
        items: [
          { id: "s1", value: 100, suffix: "%", label: "åpen kildekode i kjernen" },
          { id: "s2", value: 100, label: "Lighthouse-score på templaten" },
          { id: "s3", value: 13, label: "ferdige innholdsblokker" },
          { id: "s4", value: 3, label: "ansatte" },
        ],
      },
      {
        _type: "cardGrid",
        id: "b3",
        tone: "default",
        heading: "Det vi leverer",
        lead: "Tre ting, gjort ordentlig.",
        columns: 3,
        items: [
          {
            id: "c1",
            title: "Nettside på standarden",
            text: "Next.js-frontend, åpent CMS, visuell redigering. Du eier alt.",
            icon: "layout",
            link: {
              label: "Les mer",
              href: "/tjenester",
              external: false,
              variant: "ghost",
            },
          },
          {
            id: "c2",
            title: "Synlighet i AI-søk",
            text: "E-E-A-T-strukturert innhold, strukturerte data og månedlig måling av siteringer.",
            icon: "search",
            link: {
              label: "Les mer",
              href: "/tjenester",
              external: false,
              variant: "ghost",
            },
          },
          {
            id: "c3",
            title: "Dine egne agenter",
            text: "Koble din AI til nettsiden via MCP og produser innhold som følger profilen din.",
            icon: "bot",
            link: {
              label: "Les mer",
              href: "/tjenester",
              external: false,
              variant: "ghost",
            },
          },
        ],
      },
      {
        _type: "textImage",
        id: "b4",
        tone: "default",
        heading: "Åpen standard, ingen låsing",
        body: [
          p(
            "Alle kjernekomponenter er åpen kildekode og kan selvhostes. Kunden eier repo, database og domene.",
          ),
          p(
            "Det gjør at løsningen kan flyttes, forkes og videreføres – uansett hva som skjer med leverandøren.",
          ),
        ],
        image: images.office.ref("Kontoret vårt"),
        imagePosition: "left",
        link: {
          label: "Hvorfor åpen kildekode",
          href: "/artikler/hvorfor-vi-bygger-pa-apen-kildekode",
          external: false,
          variant: "secondary",
        },
      },
      {
        _type: "latestArticles",
        id: "b5",
        tone: "muted",
        heading: "Siste artikler",
        limit: 3,
        link: {
          label: "Alle artikler",
          href: "/artikler",
          external: false,
          variant: "ghost",
        },
      },
      {
        _type: "quote",
        id: "b6",
        tone: "brand",
        quote: "Sitat fra en kunde kommer her når det er godkjent.",
        author: "Kundenavn",
        role: "Rolle, bedrift",
      },
      {
        _type: "faq",
        id: "b7",
        tone: "default",
        heading: "Ofte stilte spørsmål",
        items: [
          {
            id: "q1",
            question: "Hvor lang tid tar det å lage en nettside?",
            answer: [
              p(
                "En standard bedriftsside med 8–12 sider tar typisk 10–15 arbeidsdager fra oppstart til lansering. Tiden går mest til innhold, ikke teknikk.",
              ),
            ],
          },
          {
            id: "q2",
            question: "Eier jeg nettsiden selv?",
            answer: [
              p(
                "Ja. Du eier kode, innhold, database og domene. Vi har tilgang, ikke eierskap, og dokumenterer hvordan andre kan ta over.",
              ),
            ],
          },
          {
            id: "q3",
            question: "Kan jeg redigere selv?",
            answer: [
              p(
                "Ja, i en visuell editor der du bygger sider av godkjente blokker. Utseendet er låst slik at profilen holder; innholdet er ditt.",
              ),
            ],
          },
        ],
      },
      {
        _type: "cta",
        id: "b8",
        tone: "dark",
        heading: "Klar for en nettside som jobber for deg?",
        text: "Fortell oss om bedriften din, så viser vi hvordan standarden passer.",
        links: [
          { label: "Ta kontakt", href: "/kontakt", external: false, variant: "primary" },
        ],
      },
    ],
  }),
  page.parse({
    id: "pg-services",
    slug: "tjenester",
    createdAt: now,
    updatedAt: now,
    title: "Tjenester",
    seo: {
      description:
        "Nettside på åpen standard, synlighet i AI-søk, og MCP-tilgang for dine egne agenter.",
      noindex: false,
    },
    blocks: [
      {
        _type: "hero",
        id: "t1",
        tone: "default",
        heading: "Tjenester",
        lead: "Vi gjør tre ting, og vi gjør dem på samme måte hver gang. Det er derfor det går fort.",
        links: [],
        layout: "centered",
      },
      {
        _type: "cardGrid",
        id: "t2",
        tone: "default",
        columns: 3,
        items: [
          {
            id: "t2a",
            title: "Nettside på standarden",
            text: "Frontend i Next.js, åpent CMS (WordPress eller Payload), visuell editor, SEO og analytics ferdig satt opp.",
            image: images.case1.ref("Case 1"),
          },
          {
            id: "t2b",
            title: "Synlighet i AI-søk",
            text: "Forfattersider, strukturerte data, siterbart innhold og månedlig måling mot ChatGPT, Perplexity og Gemini.",
            image: images.case2.ref("Case 2"),
          },
          {
            id: "t2c",
            title: "MCP for dine agenter",
            text: "Koble din egen AI til nettsiden og produser sider, poster og materiell som følger profilmanualen.",
            image: images.case3.ref("Case 3"),
          },
        ],
      },
      {
        _type: "model3d",
        id: "t2b",
        tone: "muted",
        heading: "3D rett fra Cinema 4D",
        lead: "Modeller eksporteres som glTF og lastes lazy med fallback. Her: demo-geometri i merkevarefargene.",
        alt: "Roterende abstrakt 3D-form i merkevarefarger",
        autoRotate: true,
        interactive: true,
        height: "medium",
        layout: "section",
      },
      {
        _type: "cta",
        id: "t3",
        tone: "brand",
        heading: "Vil du se standarden?",
        text: "Vi viser gjerne template-repoet og hvordan et prosjekt bygges.",
        links: [
          {
            label: "Book en gjennomgang",
            href: "/kontakt",
            external: false,
            variant: "primary",
          },
        ],
      },
    ],
  }),
  page.parse({
    id: "pg-about",
    slug: "om-oss",
    createdAt: now,
    updatedAt: now,
    title: "Om oss",
    seo: {
      description: "Teamet bak AD.Moment og standarden vi bygger på.",
      noindex: false,
    },
    blocks: [
      {
        _type: "hero",
        id: "o1",
        tone: "default",
        heading: "Om oss",
        lead: "Et lite team som har bestemt seg for å bygge nettsider på én måte – og gjøre den måten bedre hvert kvartal.",
        links: [],
        layout: "centered",
      },
      { _type: "people", id: "o2", tone: "default", heading: "Folkene", personIds: [] },
      {
        _type: "text",
        id: "o3",
        tone: "muted",
        heading: "Hvordan vi jobber",
        width: "narrow",
        body: [
          p(
            "Alt vi bygger starter fra samme template-repo. Hver forbedring i et kundeprosjekt føres tilbake, slik at neste prosjekt starter fra et bedre sted.",
          ),
          p(
            "Hvert kvartal evaluerer vi standarden mot bransjen, med en ekstern stemme som har i oppdrag å finne det svakeste leddet.",
          ),
        ],
      },
    ],
  }),
  page.parse({
    id: "pg-contact",
    slug: "kontakt",
    createdAt: now,
    updatedAt: now,
    title: "Kontakt",
    seo: { description: "Ta kontakt med AD.Moment.", noindex: false },
    blocks: [
      {
        _type: "hero",
        id: "k1",
        tone: "default",
        heading: "Kontakt",
        lead: "Fortell oss kort om bedriften og hva du trenger. Vi svarer innen én arbeidsdag.",
        links: [],
        layout: "centered",
      },
      {
        _type: "contactForm",
        id: "k2",
        tone: "default",
        heading: "Send en melding",
        formId: "contact",
        fields: [
          { name: "name", label: "Navn", type: "text", required: true },
          { name: "email", label: "E-post", type: "email", required: true },
          { name: "company", label: "Bedrift", type: "text", required: false },
          {
            name: "message",
            label: "Hva kan vi hjelpe med?",
            type: "textarea",
            required: true,
          },
        ],
        submitLabel: "Send melding",
        successMessage: "Takk! Vi tar kontakt innen én arbeidsdag.",
      },
    ],
  }),
  page.parse({
    id: "pg-privacy",
    slug: "personvern",
    createdAt: now,
    updatedAt: now,
    title: "Personvern",
    seo: { noindex: false },
    blocks: [
      {
        _type: "text",
        id: "pv1",
        tone: "default",
        heading: "Personvernerklæring",
        width: "narrow",
        body: [
          p(
            "Denne siden beskriver hvordan vi behandler personopplysninger. Teksten tilpasses per kunde ved oppsett.",
          ),
          p(
            "Vi bruker personvernvennlig analyse uten cookies. Skjemainnsendinger lagres i vårt CMS og behandles i henhold til GDPR.",
          ),
        ],
      },
    ],
  }),
];

const redirects = [redirect.parse({ from: "/home", to: "/", permanent: true })];

const guide = brandGuide.parse({
  identity: {
    name: "AD.Moment",
    oneLiner: "Nettsider som blir funnet, lest og sitert.",
    purpose:
      "Gi norske bedrifter nettsider de eier selv, som er raske for mennesker og troverdige for AI-søk.",
    values: ["Åpenhet", "Presisjon", "Ro"],
    audiences: ["Daglige ledere i SMB", "Markedsansvarlige"],
  },
  voice: {
    tone: ["Direkte", "Konkret", "Rolig"],
    language: "nb",
    addressForm: "du",
    useWords: ["bygge", "eie", "måle", "standard"],
    avoidWords: ["sømløs", "banebrytende", "løsning"],
    goodExamples: ["Du eier kode, innhold og domene."],
    badExamples: ["Vår banebrytende løsning gir sømløs synergi."],
  },
  facts: [
    {
      claim: "AD.Moment har organisasjonsnummer 838 722 822.",
      source: "Brønnøysundregistrene",
      approved: true,
    },
    { claim: "AD.Moment har tre ansatte.", source: "Kunden, 2026-11-10", approved: true },
    {
      claim: "Alle kjernekomponenter er MIT- eller GPL-lisensiert.",
      source: "Standard for nettsideutvikling",
      approved: true,
    },
  ],
  neverClaim: ["Garantert førsteplass i Google", "Kundetall vi ikke kan dokumentere"],
  channels: [
    {
      name: "LinkedIn",
      format: "Tekst + ett bilde",
      maxLength: 1300,
      frequency: "2 per uke",
      hashtags: ["#nettside", "#aisøk"],
    },
    {
      name: "Nyhetsbrev",
      format: "Én sak, én lenke",
      maxLength: 600,
      frequency: "Månedlig",
    },
  ],
  legal: {
    requiresApproval: ["Priser", "Kundenavn", "Tall om resultater"],
    forbiddenTopics: ["Politikk", "Konkurrenter ved navn"],
    imageRights: "Kun egne bilder eller bilder med dokumentert lisens.",
  },
  version: "1.0.0",
  updatedAt: now,
});

async function main() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(imgDir, { recursive: true });
  for (const img of Object.values(images)) {
    await fs.writeFile(path.join(imgDir, img.file), img.content);
  }
  const write = (file: string, data: unknown) =>
    fs.writeFile(path.join(dataDir, file), JSON.stringify(data, null, 2) + "\n");
  await write("site.json", site);
  await write("menus.json", menus);
  await write("pages.json", pages);
  await write("articles.json", articles);
  await write("people.json", people);
  await write("categories.json", categories);
  await write("redirects.json", redirects);
  await write("brand-guide.json", guide);
  console.log(
    `Seed skrevet: ${pages.length} sider, ${articles.length} artikler, ${people.length} personer, ${Object.keys(images).length} bilder.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
