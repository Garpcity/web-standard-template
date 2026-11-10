import { NextResponse } from "next/server";
import { getBrandGuide } from "@/content";

/** Maskinlesbar profilmanual. Fase 6: eksponeres også via MCP (`get_brand_guide`). */
export async function GET() {
  const guide = await getBrandGuide();
  if (!guide) return NextResponse.json({ error: "Ingen profilmanual" }, { status: 404 });
  return NextResponse.json(guide, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
