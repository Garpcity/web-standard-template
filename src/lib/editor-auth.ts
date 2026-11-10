/**
 * Hvem redigerer? Én kilde for /edit og /api/puck.
 * - CMS_PROVIDER=payload: Payload-sesjonen (cookie/JWT) bestemmer bruker og rolle. Ingen delt passord.
 * - mock/wordpress: EDITOR_PASSWORD (header x-editor-key) gir rollen `editor`; i utvikling uten passord: owner.
 */
import type { Role } from "@/content/permissions";

export type EditorIdentity = { name: string; role: Role } | null;

export async function identifyEditor(headers: Headers): Promise<EditorIdentity> {
  if (process.env.CMS_PROVIDER === "payload") {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers });
    if (!user) return null;
    const role = ((user as { role?: Role }).role ?? "contributor") as Role;
    return { name: (user as { email?: string }).email ?? String(user.id), role };
  }
  const expected = process.env.EDITOR_PASSWORD;
  if (!expected)
    return process.env.NODE_ENV !== "production" ? { name: "dev", role: "owner" } : null;
  return headers.get("x-editor-key") === expected
    ? { name: "editor", role: "editor" }
    : null;
}
