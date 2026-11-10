import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Tar imot skjemainnsendinger. Nettsiden eier: validering, honeypot, logg.
 * n8n eier alt etterpå: FORMS_WEBHOOK_URL får hele innsendingen.
 */
const payload = z.object({
  formId: z.string().min(1).max(60),
  fields: z.record(z.string(), z.string().max(5000)),
  pageUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  const parsed = payload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ugyldig innsending" }, { status: 400 });
  }
  const { formId, fields, pageUrl } = parsed.data;

  // Honeypot: feltet "website" er skjult; mennesker fyller det ikke ut.
  if (fields.website) return NextResponse.json({ ok: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  const submission = {
    id: crypto.randomUUID(),
    formId,
    fields: Object.fromEntries(Object.entries(fields).filter(([k]) => k !== "website")),
    submittedAt: new Date().toISOString(),
    ipHash,
    pageUrl,
  };

  // Lagres i CMS når det støtter det (Payload). WordPress: kun webhook (n8n lagrer).
  if (process.env.CMS_PROVIDER === "payload") {
    try {
      const [{ getPayload }, { default: config }] = await Promise.all([
        import("payload"),
        import("@payload-config"),
      ]);
      const payload = await getPayload({ config });
      await payload.create({
        collection: "form-submissions",
        data: submission,
        overrideAccess: true,
      });
    } catch (err) {
      console.error("Kunne ikke lagre innsending i Payload", err);
    }
  }

  const webhook = process.env.FORMS_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.FORMS_WEBHOOK_SECRET
            ? { "X-Webhook-Secret": process.env.FORMS_WEBHOOK_SECRET }
            : {}),
        },
        body: JSON.stringify(submission),
      });
    } catch (err) {
      console.error("Webhook feilet", err);
      return NextResponse.json({ error: "Kunne ikke levere" }, { status: 502 });
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.log("[forms] (ingen FORMS_WEBHOOK_URL) innsending:", submission);
  }

  return NextResponse.json({ ok: true, id: submission.id });
}
