"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu as MenuIcon, X } from "lucide-react";
import type { MenuItem } from "@/content";

function MobileNavInner({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Lukk meny" : "Åpne meny"}
        className="inline-flex size-11 items-center justify-center rounded-md"
      >
        {open ? <X /> : <MenuIcon />}
      </button>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 z-40 bg-bg">
          <nav className="container-site flex flex-col gap-2 py-6" aria-label="Mobilmeny">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-xl font-medium hover:bg-surface-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

/** Nøkkel på pathname nullstiller menyen ved navigasjon uten setState i effekt. */
export function MobileNav({ items }: { items: MenuItem[] }) {
  const pathname = usePathname();
  return <MobileNavInner key={pathname} items={items} />;
}
