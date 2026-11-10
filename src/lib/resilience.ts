/**
 * Sist kjente verdi ved CMS-nedetid. Brukes for globale data (innstillinger, menyer) som
 * hver side trenger: feiler CMS-et, serveres forrige vellykkede svar og feilen rapporteres.
 * Sider og artikler trenger ikke dette: Next serverer cachet HTML og revaliderer i bakgrunnen.
 */
import { reportError } from "./report-error";

const lastGood = new Map<string, unknown>();

export async function withLastKnownGood<T>(
  key: string,
  load: () => Promise<T>,
): Promise<T> {
  try {
    const value = await load();
    lastGood.set(key, value);
    return value;
  } catch (err) {
    if (lastGood.has(key)) {
      reportError({
        metric: "cms_fallback",
        message: err instanceof Error ? err.message : String(err),
        detail: { key },
      });
      return lastGood.get(key) as T;
    }
    throw err;
  }
}
