/**
 * seed-payload.mts – kjør Payload-seed utenfor Next.js.
 * Krever Node 24 (tsx + undici-feil på Node 22). På Node 22: bruk POST /api/seed i dev.
 */
import { getPayload } from "payload";
import config from "../src/payload.config";
import { seedPayload } from "../src/payload/seed";

const payload = await getPayload({ config });
await seedPayload(payload);
process.exit(0);
