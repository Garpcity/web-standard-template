import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { seedPayload } from "@/payload/seed";

/**
 * Seed i utvikling: POST /api/seed med header `x-payload-secret: <PAYLOAD_SECRET>`.
 * Avslått i produksjon.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
    return NextResponse.json(
      { error: "Ikke tilgjengelig i produksjon" },
      { status: 403 },
    );
  }
  if (req.headers.get("x-payload-secret") !== process.env.PAYLOAD_SECRET) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }
  const log: string[] = [];
  const payload = await getPayload({ config });
  await seedPayload(payload, (m) => log.push(m));
  return NextResponse.json({ ok: true, log });
}
