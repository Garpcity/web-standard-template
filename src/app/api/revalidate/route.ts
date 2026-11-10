import { NextResponse } from "next/server";
import { revalidateContent, type ContentKind } from "@/lib/revalidate";

/**
 * On-demand revalidering for eksterne CMS (WordPress-pluginen kaller ved save_post/option-endring).
 * POST { kind, slug? } med header x-revalidate-secret = REVALIDATE_SECRET.
 * Payload trenger ikke dette: hooks kaller revalidateContent direkte.
 */
const kinds: ContentKind[] = [
  "page",
  "article",
  "person",
  "category",
  "media",
  "settings",
  "menu",
  "brandGuide",
  "redirect",
  "all",
];

export async function POST(req: Request) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || req.headers.get("x-revalidate-secret") !== expected)
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { kind?: string; slug?: string };
  const kind = kinds.includes(body.kind as ContentKind)
    ? (body.kind as ContentKind)
    : "all";
  const paths = revalidateContent(kind, body.slug);
  return NextResponse.json({ ok: true, kind, paths });
}
