import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";
import { collections } from "./payload/collections";
import { globals } from "./payload/globals";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Database: Postgres i produksjon (DATABASE_URL=postgres://…).
 * SQLite lokalt og i CI når DATABASE_URL er tom eller starter med file:.
 */
const databaseUrl = process.env.DATABASE_URL ?? "";
const db = databaseUrl.startsWith("postgres")
  ? postgresAdapter({ pool: { connectionString: databaseUrl } })
  : sqliteAdapter({ client: { url: databaseUrl || "file:./payload.db" }, push: true });

export default buildConfig({
  secret:
    process.env.PAYLOAD_SECRET ??
    (() => {
      // Kreves bare der Payload faktisk er CMS; mock/WordPress-bygg laster config uten å bruke den.
      if (process.env.NODE_ENV === "production" && process.env.CMS_PROVIDER === "payload")
        throw new Error("PAYLOAD_SECRET mangler");
      return "dev-only-secret-change-me";
    })(),
  serverURL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  admin: {
    user: "users",
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: " – Admin" },
  },
  collections,
  globals,
  editor: lexicalEditor(),
  db,
  sharp,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  graphQL: { disable: false },
  localization: false,
  telemetry: false,
});
