import { NextResponse } from "next/server";
import { getPage, savePage } from "@/content";
import { applyLockedFields, roleCan } from "@/content/permissions";
import { identifyEditor } from "@/lib/editor-auth";
import { blocksToPuck, puckToBlocks } from "@/puck/convert";
import type { Data } from "@puckeditor/core";

/**
 * Lagring/lasting for Puck-editoren. Identitet fra identifyEditor (Payload-bruker eller EDITOR_PASSWORD).
 * Låste felt håndheves her på serversiden med samme funksjon som MCP og Payload-hooken;
 * UI-filtreringen i Puck er bare bekvemmelighet.
 */
export async function GET(req: Request) {
  const who = await identifyEditor(req.headers);
  if (!who) return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug mangler" }, { status: 400 });
  const page = await getPage(slug, { includeDrafts: true });
  if (!page) return NextResponse.json({ data: null, slug, role: who.role });
  return NextResponse.json({ data: blocksToPuck(page), slug, page, role: who.role });
}

export async function POST(req: Request) {
  const who = await identifyEditor(req.headers);
  if (!who) return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  const body = (await req.json()) as { slug: string; data: Data };
  if (!body?.slug || !body?.data)
    return NextResponse.json({ error: "Ugyldig" }, { status: 400 });
  const existing = await getPage(body.slug, { includeDrafts: true });
  const { title, blocks: incoming } = puckToBlocks(body.data);
  const blocks = applyLockedFields(who.role, incoming, existing?.blocks ?? []);
  const now = new Date().toISOString();
  // Uten publish-rett forblir siden utkast (ny side) eller beholder status (eksisterende).
  const status = existing?.status ?? (roleCan[who.role].publish ? "published" : "draft");
  await savePage({
    id: existing?.id ?? `pg-${body.slug}`,
    slug: body.slug,
    _type: "page",
    title: title ?? existing?.title ?? body.slug,
    blocks,
    seo: existing?.seo ?? { noindex: false },
    status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ownerId: existing?.ownerId,
  });
  return NextResponse.json({ ok: true, role: who.role, status });
}
