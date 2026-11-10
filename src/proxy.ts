import { NextResponse, type NextRequest } from "next/server";

/**
 * Testdomene-vern. Nettsiden bygges først på et testdomene (f.eks. kunde.preikestol.no) og
 * flyttes til ekte domene senere. Alle forespørsler som ikke kommer via det kanoniske
 * domenet (NEXT_PUBLIC_SITE_URL) får `X-Robots-Tag: noindex`, så testdomenet aldri indekseres
 * – også etter flytting, når det gamle testdomenet fortsatt svarer. Canonical-lenker og
 * sitemap peker alltid på NEXT_PUBLIC_SITE_URL, så søkemotorer samler på rett sted.
 */
const canonicalHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").host;
  } catch {
    return "";
  }
})();

export function proxy(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const res = NextResponse.next();
  if (canonicalHost && host && host !== canonicalHost) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("X-Canonical-Host", canonicalHost);
  }
  return res;
}

export const config = {
  // Ikke på statiske filer og Next-interne ruter.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|avif|woff2?)$).*)",
  ],
};
