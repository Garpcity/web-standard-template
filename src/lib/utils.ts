import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string, locale = "nb-NO") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function siteUrl(path = "/") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Tone -> bakgrunns- og tekstklasser. Én kilde for seksjonsfarger. */
export const toneClasses: Record<"default" | "muted" | "brand" | "dark", string> = {
  default: "bg-bg text-fg",
  muted: "bg-surface-muted text-fg",
  brand: "bg-brand text-fg-inverse",
  dark: "bg-fg text-fg-inverse",
};
