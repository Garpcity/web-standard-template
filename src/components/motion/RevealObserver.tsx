"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Observerer alle [data-reveal] og setter `is-visible` når de kommer i viewport.
 * Monteres én gang i layout. Håndterer nye elementer via MutationObserver.
 */
export function RevealObserver() {
  const pathname = usePathname();
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // ownerDocument gjør at dette også virker inni Puck-editorens iframe.
    const document = anchor.current?.ownerDocument ?? window.document;
    document.documentElement.classList.add("js");
    if (!("IntersectionObserver" in window)) {
      document
        .querySelectorAll("[data-reveal]")
        .forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      {
        root: document === window.document ? null : document,
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.15,
      },
    );
    const observe = (root: ParentNode) =>
      root
        .querySelectorAll("[data-reveal]:not(.is-visible)")
        .forEach((el) => io.observe(el));
    observe(document);

    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (n instanceof Element) {
            if (n.matches("[data-reveal]")) io.observe(n);
            observe(n);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return <span ref={anchor} hidden />;
}
