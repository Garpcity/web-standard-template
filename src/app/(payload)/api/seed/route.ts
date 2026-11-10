import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { seedPayload } from "@/payload/seed";

/**
 * Seed: POST /api/seed med header `x-payload-secret: <PAYLOAD_SECRET>`.
 * I produksjon bare når databasen er tom (første oppstart) eller ALLOW_SEED=true.
 */
export async function POST(req: Request) {
  if (req.headers.get("x-payload-secret") !== process.env.PAYLOAD_SECRET) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }
  const payload = await getPayload({ config });
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
    const users = await payload.count({ collection: "users" });
    if (users.totalDocs > 0)
      return NextResponse.json(
        {
          error:
            "Databasen har allerede innhold. Sett ALLOW_SEED=true for å seede på nytt.",
        },
        { status: 403 },
      );
  }
  const log: string[] = [];
  await seedPayload(payload, (m) => log.push(m));
  return NextResponse.json({ ok: true, log });
}
