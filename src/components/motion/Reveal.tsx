/**
 * Reveal/Stagger – scroll-inntreden uten JS-avhengighet for synlighet.
 *
 * Server-HTML er alltid synlig (SEO, LCP, no-JS). Når JS kjører, legger
 * <RevealObserver> på `is-visible` når elementet kommer i viewport, og CSS i
 * globals.css gjør overgangen. Reduced motion: ingen overgang.
 *
 * Disse er Server Components – ingen klientbundle for vanlige seksjoner.
 */
import { cn } from "@/lib/utils";

type Tag = "div" | "section" | "li" | "article" | "span" | "ul" | "ol";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Forsinkelse i ms, brukes sjelden – Stagger håndterer lister. */
  delay?: number;
  as?: Tag;
};

export function Reveal({ children, className, delay, as = "div" }: RevealProps) {
  const Tag = as;
  return (
    <Tag
      data-reveal=""
      className={className}
      style={
        delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined
      }
    >
      {children}
    </Tag>
  );
}

/** Forelder som forskyver barna 60 ms hver (CSS nth-child). Barna bruker <RevealChild>. */
export function Stagger({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol";
}) {
  const Tag = as;
  return (
    <Tag data-stagger="" className={className}>
      {children}
    </Tag>
  );
}

export function RevealChild({
  children,
  className,
  scale,
  eager,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** Oppskrift scaleIn i stedet for reveal. */
  scale?: boolean;
  /**
   * Over folden: animer inn med én gang via CSS-keyframes, uten å vente på JS/observer.
   * Bruk på første element i lister som kan være LCP (artikkelkort, kortgrid).
   */
  eager?: boolean;
  as?: "div" | "li" | "article";
}) {
  const Tag = as;
  return (
    <Tag data-reveal={eager ? "eager" : scale ? "scale" : ""} className={cn(className)}>
      {children}
    </Tag>
  );
}
