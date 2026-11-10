/**
 * API-nøkler for agenter. AGENT_API_KEYS="navn:nøkkel[:rolle],navn2:nøkkel2"
 * Rolle er `agent` som standard (lese + utkast). `admin`/`owner` gir også publisering via API,
 * men MCP-verktøyene publiserer aldri uansett rolle.
 */
import type { Role } from "@/content/permissions";

export type AgentIdentity = { name: string; role: Role };

export function parseAgentKeys(
  env = process.env.AGENT_API_KEYS ?? "",
): Map<string, AgentIdentity> {
  const map = new Map<string, AgentIdentity>();
  for (const entry of env
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)) {
    const [name, key, role] = entry.split(":");
    // Bare «agent» og «editor» kan gis via nøkkel; owner/admin krever innlogging i CMS.
    const allowed: Role[] = ["agent", "editor"];
    const safeRole = allowed.includes(role as Role) ? (role as Role) : "agent";
    if (name && key) map.set(key, { name, role: safeRole });
  }
  return map;
}

export function identify(req: Request, keys = parseAgentKeys()): AgentIdentity | null {
  const auth = req.headers.get("authorization");
  const bearer = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  const key = req.headers.get("x-agent-key") ?? bearer;
  if (!key) return null;
  return keys.get(key) ?? null;
}
