import { getMenu, getSiteSettings } from "@/content";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/seo/JsonLd";
import { organization, webSite } from "@/seo/schema";
import { siteConfig } from "../../../site.config";

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
    <>
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
    </>
  );
}
