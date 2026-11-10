import Link from "next/link";
import type { Menu, SiteSettings } from "@/content";

type Props = { settings: SiteSettings; menu: Menu; legal: Menu };

export function Footer({ settings, menu, legal }: Props) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-surface-muted">
      <div className="container-site grid gap-10 py-16 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold">{settings.name}</p>
          {settings.tagline && <p className="mt-2 text-fg-muted">{settings.tagline}</p>}
          {settings.social.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-4 text-sm">
              {settings.social.map((s) => (
                <li key={s.platform}>
                  <a
                    href={s.url}
                    className="text-fg-muted capitalize hover:text-fg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.platform}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label="Bunnmeny">
          <ul className="space-y-2 text-sm">
            {menu.items.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="text-fg-muted hover:text-fg">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <address className="text-sm text-fg-muted not-italic">
          {settings.contact.address && <p>{settings.contact.address}</p>}
          {settings.contact.email && (
            <p>
              <a
                href={`mailto:${settings.contact.email}`}
                className="inline-block py-1 hover:text-fg"
              >
                {settings.contact.email}
              </a>
            </p>
          )}
          {settings.contact.phone && (
            <p>
              <a
                href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}
                className="inline-block py-1 hover:text-fg"
              >
                {settings.contact.phone}
              </a>
            </p>
          )}
          {settings.contact.orgNumber && (
            <p className="mt-2">Org.nr. {settings.contact.orgNumber}</p>
          )}
        </address>
      </div>
      <div className="border-t border-border">
        <div className="container-site flex flex-col gap-2 py-6 text-xs text-fg-muted md:flex-row md:items-center md:justify-between">
          <p>{settings.footerText ?? `© ${year} ${settings.name}`}</p>
          <ul className="flex gap-4">
            {legal.items.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="inline-block py-1 hover:text-fg">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
