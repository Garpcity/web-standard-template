import { NextResponse } from "next/server";
import { getPage, savePage } from "@/content";
import { blocksToPuck, puckToBlocks } from "@/puck/convert";
import type { Data } from "@puckeditor/core";

/**
 * Lagring/lasting for Puck-editoren i template-modus (mock-adapter).
 * Enkel nøkkelbeskyttelse via EDITOR_PASSWORD. WordPress/Payload bruker egen auth.
 */
function authorized(req: Request) {
  const expected = process.env.EDITOR_PASSWORD;
  if (!expected) return process.env.NODE_ENV !== "production";
  return req.headers.get("x-editor-key") === expected;
}

export async function GET(req: Request) {
  if (!authorized(req))
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug mangler" }, { status: 400 });
  const page = await getPage(slug, { includeDrafts: true });
  if (!page) return NextResponse.json({ data: null, slug });
  return NextResponse.json({ data: blocksToPuck(page), slug, page });
}

export async function POST(req: Request) {
  if (!authorized(req))
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  const body = (await req.json()) as { slug: string; data: Data };
  if (!body?.slug || !body?.data)
    return NextResponse.json({ error: "Ugyldig" }, { status: 400 });
  const existing = await getPage(body.slug, { includeDrafts: true });
  const { title, blocks } = puckToBlocks(body.data);
  const now = new Date().toISOString();
  await savePage({
    id: existing?.id ?? `pg-${body.slug}`,
    slug: body.slug,
    _type: "page",
    title: title ?? existing?.title ?? body.slug,
    blocks,
    seo: existing?.seo ?? { noindex: false },
    status: existing?.status ?? "published",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ownerId: existing?.ownerId,
  });
  return NextResponse.json({ ok: true });
}
