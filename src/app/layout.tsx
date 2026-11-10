import type { Metadata } from "next";
import localFont from "next/font/local";
import { getSiteSettings } from "@/content";
import { buildMetadata } from "@/seo/metadata";
import { RevealObserver } from "@/components/motion/RevealObserver";
import "./globals.css";

/**
 * Fonter selvhostes (ingen kall til Google Fonts – personvern og ytelse).
 * Bytt font per kunde her og i tokens.css. Filene kommer fra @fontsource-variable.
 */
const body = localFont({
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

const display = localFont({
  src: "../../node_modules/@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2",
  variable: "--font-display-loaded",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata({ settings, path: "/" });
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nb" className={`${body.variable} ${display.variable} h-full`}>
      <head>
        {/* Markerer at JS kjører, slik at reveal-overganger kun aktiveres da. Uten JS er alt synlig. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <RevealObserver />
      </body>
    </html>
  );
}
