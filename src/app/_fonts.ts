import localFont from "next/font/local";

/**
 * Fonter selvhostes (ingen kall til Google Fonts – personvern og ytelse).
 * Bytt font per kunde her og i tokens.css. Filene kommer fra @fontsource-variable.
 */
export const bodyFont = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2",
      style: "normal",
    },
  ],
  variable: "--font-body-loaded",
  display: "swap",
});

export const displayFont = localFont({
  src: "../../node_modules/@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2",
  variable: "--font-display-loaded",
  display: "swap",
});

export const fontClassName = `${bodyFont.variable} ${displayFont.variable}`;
