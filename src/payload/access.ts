/**
 * Tilgang speiler src/content/permissions.ts.
 * Roller: owner, admin, editor, contributor, reviewer, agent.
 */
import type { Access, FieldHook } from "payload";
import { roleCan, type Role } from "@/content/permissions";

type User = { role?: Role; id: string | number } | null | undefined;

const role = (user: User): Role => user?.role ?? "contributor";

export const isLoggedIn: Access = ({ req }) => Boolean(req.user);
export const isOwner: Access = ({ req }) => role(req.user as User) === "owner";
export const isOwnerOrAdmin: Access = ({ req }) =>
  ["owner", "admin"].includes(role(req.user as User));

/** Offentlig lesing av publisert innhold; innloggede ser alt. */
export const publishedOrLoggedIn: Access = ({ req }) =>
  req.user ? true : { status: { equals: "published" } };

/** Alle innloggede kan lage utkast og redigere; publisering sjekkes i hook under. */
export const canEditContent: Access = ({ req }) => Boolean(req.user);

/** Bare roller med publish-rett kan sette status=published. Agent kan aldri. */
export const enforcePublishRight: FieldHook = ({ value, req, previousValue }) => {
  // Lokalt API uten bruker (seed, systemjobber) er system og får publisere.
  if (!req.user) return value;
  if (value === "published" && previousValue !== "published") {
    const r = role(req.user as User);
    if (!roleCan[r].publish) {
      throw new Error(`Rollen ${r} kan ikke publisere. Send til godkjenning.`);
    }
  }
  return value;
};
