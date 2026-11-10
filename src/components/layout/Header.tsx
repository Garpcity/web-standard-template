import Link from "next/link";
import type { Menu, SiteSettings } from "@/content";
import { SmartImage } from "@/components/ui/SmartImage";
import { Button } from "@/components/ui/Button";
import { MobileNav } from "./MobileNav";

type Props = { settings: SiteSettings; menu: Menu };

export function Header({ settings, menu }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/85 backdrop-blur">
      <div className="container-site flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-3 font-display text-lg font-semibold"
          aria-label={settings.name}
        >
          {settings.logo ? (
            <SmartImage image={settings.logo} className="h-8 w-auto" sizes="160px" />
          ) : (
            <>
              <span className="inline-block size-3 rounded-full bg-accent" aria-hidden />
              {settings.name}
            </>
          )}
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Hovedmeny">
          {menu.items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {item.label}
            </Link>
          ))}
          <Button href="/kontakt" size="sm">
            Ta kontakt
          </Button>
        </nav>
        <MobileNav items={menu.items} />
      </div>
    </header>
  );
}
