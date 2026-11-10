"use client";

import { useEffect, useMemo, useState } from "react";
import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { buildPuckConfig } from "@/puck/config";
import type { Role } from "@/content/permissions";

type Props = { slug: string; role: Role };

export function EditorClient({ slug, role }: Props) {
  const config = useMemo(() => buildPuckConfig(role), [role]);
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState<string>("Laster …");
  const [key, setKey] = useState<string>(() =>
    typeof window === "undefined" ? "" : (sessionStorage.getItem("editor-key") ?? ""),
  );

  useEffect(() => {
    const headers = key ? { "x-editor-key": key } : undefined;
    fetch(`/api/puck?slug=${encodeURIComponent(slug)}`, { headers })
      .then(async (r) => {
        if (r.status === 401) {
          const k = window.prompt("Editor-nøkkel");
          if (k) {
            sessionStorage.setItem("editor-key", k);
            setKey(k);
          }
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (!json) return;
        setData(json.data ?? { content: [], root: { props: { title: slug } } });
        setStatus("");
      })
      .catch(() => setStatus("Kunne ikke laste siden."));
  }, [slug, key]);

  async function publish(next: Data) {
    setStatus("Lagrer …");
    const res = await fetch("/api/puck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { "x-editor-key": key } : {}),
      },
      body: JSON.stringify({ slug, data: next }),
    });
    setStatus(res.ok ? "Lagret." : "Lagring feilet.");
    if (res.ok) setTimeout(() => setStatus(""), 2000);
  }

  if (!data) return <p style={{ padding: 24 }}>{status}</p>;

  return (
    <>
      {status && (
        <p
          role="status"
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 100,
            background: "#111",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {status}
        </p>
      )}
      <Puck
        config={config}
        data={data}
        onPublish={publish}
        headerTitle={`Rediger: ${slug}`}
        headerPath={slug === "forside" ? "/" : `/${slug}`}
        viewports={[
          { width: 390, height: "auto", label: "Mobil" },
          { width: 1024, height: "auto", label: "Nettbrett" },
          { width: 1440, height: "auto", label: "Desktop" },
        ]}
      />
    </>
  );
}
