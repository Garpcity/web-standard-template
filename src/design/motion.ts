/**
 * motion.ts – navngitte bevegelsesoppskrifter.
 *
 * Alle animasjoner i prosjektet bruker disse. Ikke skriv ad hoc-varianter i
 * komponenter. Ny oppskrift: legg til her med JSDoc + rad i DESIGN.md.
 *
 * To lag:
 * 1. CSS-oppskrifter (globals.css, @layer utilities): reveal, stagger, scaleIn,
 *    heroIn, hoverLift. Brukes via <Reveal>/<Stagger>/<RevealChild> og klassene
 *    .hero-in/.hover-lift. Server-HTML er alltid synlig; overgangen kjører kun
 *    når JS har lagt `js` på <html> og RevealObserver setter `is-visible`.
 *    Grunn: innhold må aldri være skjult for crawlere, LCP eller brukere uten JS.
 * 2. Motion-oppskrifter (denne filen): countUp, heroParallax, pageTransition –
 *    ting som trenger JS uansett. Reduced motion håndteres i komponentene.
 */
import type { Variants, Transition } from "motion/react";

export const easeOut: Transition["ease"] = [0.22, 1, 0.36, 1];

const base: Transition = { duration: 0.5, ease: easeOut };

/** Standard inntreden: fade + 16px opp. Bruk på nesten alle seksjoner. */
export const reveal: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: base },
};

/** Foreldre-variant som forskyver barnas `reveal` med 60 ms. */
export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

/** Tall, ikoner, badges: fra 0,9 til 1 med lett overshoot. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

/** Kort crossfade mellom ruter. Aldri lengre enn 200 ms. */
export const pageTransition: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Hover på kort og knapper: 2px opp. Brukes som `whileHover`. */
export const hoverLift = { y: -2, transition: { duration: 0.15 } };

/** Hero-bilde beveger seg saktere enn scroll. Faktor brukt i <HeroParallax>. */
export const heroParallaxFactor = 0.85;

/** Varighet for tall som teller opp (<CountUp>). */
export const countUpDuration = 1.2;

/** Viewport-innstilling for alle scroll-utløste oppskrifter. */
export const viewportOnce = { once: true, amount: 0.2 } as const;
