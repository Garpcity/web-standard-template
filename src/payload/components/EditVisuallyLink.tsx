"use client";

import { useFormFields } from "@payloadcms/ui";

/**
 * «Rediger visuelt»-lenke i sidebaren på Sider i Payload-admin. Åpner Puck på /edit/<slug>.
 * Samme Payload-sesjon gir tilgang, så ingen ekstra innlogging.
 */
export function EditVisuallyLink() {
  const slug = useFormFields(([fields]) => fields?.slug?.value as string | undefined);
  const target = slug === "forside" || slug === "" ? "forside" : slug;
  if (!target) return null;
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <a
        href={`/edit/${encodeURIComponent(target)}`}
        target="_blank"
        rel="noopener"
        className="btn btn--style-primary btn--size-medium"
        style={{
          display: "inline-block",
          width: "100%",
          textAlign: "center",
          textDecoration: "none",
        }}
      >
        Rediger visuelt (Puck) ↗
      </a>
      <p style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "0.4rem" }}>
        Lagre siden her først hvis slugen er ny.
      </p>
    </div>
  );
}
