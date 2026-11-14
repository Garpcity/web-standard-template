import { nodemailerAdapter } from "@payloadcms/email-nodemailer";

/**
 * E-post (glemt passord, invitasjoner). Aktiv når SMTP_HOST er satt; ellers skriver Payload
 * e-posten til loggen, og «glemt passord» virker ikke for brukerne.
 *   SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASS, SMTP_FROM (avsenderadresse), SMTP_FROM_NAME
 */
export function emailFromEnv(defaultName: string) {
  const host = process.env.SMTP_HOST;
  if (!host) return undefined;
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailerAdapter({
    defaultFromAddress:
      process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@example.com",
    defaultFromName: process.env.SMTP_FROM_NAME ?? defaultName,
    transportOptions: {
      host,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
        : undefined,
    },
  });
}
