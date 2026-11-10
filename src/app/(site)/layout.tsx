import type { Metadata } from "next";
import { getMenu, getSiteSettings } from "@/content";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { JsonLd } from "@/seo/JsonLd";
import { organization, webSite } from "@/seo/schema";
import { buildMetadata } from "@/seo/metadata";
import { siteConfig } from "../../../site.config";
import { fontClassName } from "../_fonts";
import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata({ settings, path: "/" });
}

/** Rot-layout for den offentlige siden. Payload-admin har eget rot-layout i (payload). */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [settings, main, footer, legal] = await Promise.all([
    getSiteSettings(),
    getMenu("main"),
    getMenu("footer"),
    getMenu("legal"),
  ]);
  const analytics = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT;
  const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;

  return (
    <html lang="nb" className={`${fontClassName} h-full`}>
      <head>
        {/* Markerer at JS kjører, slik at reveal-overganger kun aktiveres da. Uten JS er alt synlig. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#innhold"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
        >
          Hopp til innhold
        </a>
        <JsonLd data={[organization(settings), webSite(settings)]} />
        <Header settings={settings} menu={main} />
        <main id="innhold" className="flex-1">
          {children}
        </main>
        <Footer settings={settings} menu={footer} legal={legal} />
        {siteConfig.integrations.analytics !== "none" && analytics && domain && (
          <script defer data-domain={domain} src={analytics} />
        )}
        <RevealObserver />
      </body>
    </html>
  );
}
