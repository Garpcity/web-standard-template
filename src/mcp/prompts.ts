/**
 * Oppgavemaler (MCP prompts). Vi skriver og versjonerer dem; kunden velger og fyller inn.
 * Hver mal har fast første steg (get_brand_guide) og fast siste steg (check_against_guide).
 * Output skal være strukturert (blokker/felter), ikke fri tekst – verktøyene validerer mot Zod.
 */
export type PromptTemplate = {
  name: string;
  version: string;
  title: string;
  description: string;
  args: { name: string; description: string; required?: boolean }[];
  build: (a: Record<string, string>) => string;
};

const header = (
  name: string,
  version: string,
) => `Du jobber på vegne av kunden gjennom nettsidens MCP-server. Mal: ${name} v${version}.
Regler som alltid gjelder:
1. Kall get_brand_guide først og følg identitet, tone, ord-lister, godkjente fakta og kanalregler.
2. Bruk kun fakta fra profilmanualen eller fra eksisterende innhold (get_content/search_content). Ingen tall uten kilde.
3. Skriv på ${"{language}"} med tiltaleform fra profilmanualen. Unngå ordene på unngå-listen.
4. Alt du lager er utkast. Du kan ikke publisere. Et menneske godkjenner.
5. Kjør check_against_guide på all tekst før du lagrer. Rett alle "error" og vurder alle "warning".
`;

export const prompts: PromptTemplate[] = [
  {
    name: "ny-artikkel",
    version: "1.0.0",
    title: "Ny artikkel",
    description:
      "Skriv et artikkelutkast etter reglene for siterbart innhold (svar først, faktatetthet, kilder).",
    args: [
      {
        name: "tema",
        description: "Hva artikkelen skal svare på (ett spørsmål kundene stiller)",
        required: true,
      },
      { name: "malgruppe", description: "Hvem som skal lese den" },
      {
        name: "fakta",
        description: "2–3 fakta eller kilder som skal brukes (valgfritt)",
      },
    ],
    build: (a) => `${header("ny-artikkel", "1.0.0")}
Oppgave: Skriv en artikkel som svarer på: "${a.tema}". Målgruppe: ${a.malgruppe ?? "fra profilmanualen"}.
${a.fakta ? `Fakta/kilder som skal inn: ${a.fakta}` : ""}
Steg:
1. get_brand_guide. 2. search_content med nøkkelord fra temaet – lenk til eksisterende relevante sider.
3. Struktur: "summary" = svaret i 40–60 ord. Brødtekst med H2-er formulert som spørsmål, ett konkret datapunkt per 150–200 ord, kilder inline, selvstående avsnitt.
4. check_against_guide på summary + brødtekst. 5. create_draft_article med tittel, slug, summary, body (RichText-noder), sources.
Svar til brukeren med: hva som ble laget, lenke/slug, og hvilke warnings som gjenstår.`,
  },
  {
    name: "ny-landingsside",
    version: "1.0.0",
    title: "Ny landingsside",
    description:
      "Komponer en side av godkjente blokker for ett formål og én ønsket handling.",
    args: [
      { name: "formal", description: "Hva siden skal oppnå", required: true },
      { name: "tilbud", description: "Hva som tilbys", required: true },
      {
        name: "handling",
        description: "Ønsket handling (f.eks. book møte, send skjema)",
        required: true,
      },
    ],
    build: (a) => `${header("ny-landingsside", "1.0.0")}
Oppgave: Lag en landingsside. Formål: ${a.formal}. Tilbud: ${a.tilbud}. Ønsket handling: ${a.handling}.
Steg:
1. get_brand_guide. 2. get_blocks for å se tilgjengelige blokker og feltene deres. 3. get_design_tokens er informasjon, ikke noe du endrer.
4. Komponer: hero (overskrift ≤ 8 ord, ingress ≤ 30 ord, én primærlenke til handlingen) → cardGrid eller stats med 3 konkrete punkter → textImage eller quote → faq med 3 spørsmål kunder faktisk stiller → cta.
5. Bruk bare blokker fra get_blocks og bare felt som finnes. Ikke sett tone/layout – de er låst.
6. check_against_guide på all tekst. 7. create_draft_page med tittel, slug og blokker.`,
  },
  {
    name: "some-serie",
    version: "1.0.0",
    title: "Serie av sosiale poster",
    description:
      "Lag poster per kanal fra en artikkel eller side, etter kanalreglene i profilmanualen.",
    args: [
      {
        name: "kilde",
        description: "Slug til artikkel eller side posten bygger på",
        required: true,
      },
      {
        name: "kanaler",
        description: "Kommaseparert liste, f.eks. LinkedIn, Instagram",
        required: true,
      },
      { name: "antall", description: "Antall poster per kanal (standard 1)" },
    ],
    build: (a) => `${header("some-serie", "1.0.0")}
Oppgave: Lag ${a.antall ?? "1"} post(er) per kanal (${a.kanaler}) basert på innholdet med slug "${a.kilde}".
Steg:
1. get_brand_guide – les kanalreglene (format, maks lengde, hashtags, frekvens). 2. get_content med slug "${a.kilde}".
3. Per post: ett poeng fra kilden, ikke et sammendrag. Lead med det mest konkrete. Avslutt med lenke til kilden.
4. check_against_guide med channel satt – lengdegrensen håndheves. 5. create_social_post per post (status draft).`,
  },
  {
    name: "oppdater-side",
    version: "1.0.0",
    title: "Oppdater en side",
    description: "Endre kun det som er bedt om på en eksisterende side.",
    args: [
      { name: "slug", description: "Siden som skal endres", required: true },
      { name: "endring", description: "Hva som skal endres, konkret", required: true },
    ],
    build: (a) => `${header("oppdater-side", "1.0.0")}
Oppgave: På siden "${a.slug}": ${a.endring}.
Steg: 1. get_brand_guide. 2. get_content med slug "${a.slug}" og les alle blokker. 3. Endre kun det som er bedt om; behold alle andre blokker og felt uendret, inkludert id-er.
4. check_against_guide på endret tekst. 5. create_draft_page med samme slug og hele blokklisten. Oppsummer diffen for brukeren.`,
  },
  {
    name: "kvalitetssjekk",
    version: "1.0.0",
    title: "Kvalitetssjekk",
    description:
      "Vurder en side eller et utkast mot profilmanual, E-E-A-T-sjekkliste og tilgjengelighet.",
    args: [
      {
        name: "slug",
        description: "Side eller artikkel som skal vurderes",
        required: true,
      },
    ],
    build: (a) => `${header("kvalitetssjekk", "1.0.0")}
Oppgave: Vurder innholdet med slug "${a.slug}".
Steg: 1. get_brand_guide. 2. get_content. 3. check_against_guide på all tekst.
4. Vurder i tillegg: Er svaret i de første 40–60 ordene? Er det ett datapunkt per 150–200 ord? Er kilder lenket inline? Er forfatter navngitt? Har alle bilder alt-tekst? Er underoverskrifter spørsmål?
5. Lever en rapport: liste over avvik (alvorlighet, hvor, forslag). Ikke endre noe.`,
  },
];

export const promptByName = Object.fromEntries(prompts.map((p) => [p.name, p]));
