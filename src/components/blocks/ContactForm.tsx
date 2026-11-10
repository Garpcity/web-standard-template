"use client";

import { useState } from "react";
import type { BlockOf } from "@/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

type State = "idle" | "sending" | "done" | "error";

const inputClass =
  "w-full rounded-md border border-border bg-surface px-4 py-3 text-base text-fg placeholder:text-fg-muted/60";

export function ContactForm({ block }: { block: BlockOf<"contactForm"> }) {
  const [state, setState] = useState<State>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: block.formId,
          fields: data,
          pageUrl: location.href,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("done");
      form.reset();
    } catch {
      setState("error");
    }
  }

  return (
    <Section tone={block.tone} id={block.anchor} narrow>
      <SectionHeading heading={block.heading} lead={block.lead} />
      {state === "done" ? (
        <p
          role="status"
          className="rounded-card border border-success/30 bg-surface p-6 text-success"
        >
          {block.successMessage}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-5" noValidate={false}>
          {/* Honeypot mot spam. Skjult for mennesker. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden
          />
          {block.fields.map((f) => (
            <div key={f.name} className="grid gap-1.5">
              <label htmlFor={`f-${f.name}`} className="text-sm font-medium">
                {f.label}
                {f.required && <span aria-hidden> *</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  id={`f-${f.name}`}
                  name={f.name}
                  required={f.required}
                  rows={5}
                  className={inputClass}
                />
              ) : f.type === "select" ? (
                <select
                  id={`f-${f.name}`}
                  name={f.name}
                  required={f.required}
                  className={inputClass}
                >
                  <option value="">Velg …</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`f-${f.name}`}
                  name={f.name}
                  type={f.type}
                  required={f.required}
                  className={inputClass}
                />
              )}
            </div>
          ))}
          {state === "error" && (
            <p role="alert" className="text-danger">
              Noe gikk galt. Prøv igjen, eller send oss en e-post.
            </p>
          )}
          <div>
            <Button type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Sender …" : block.submitLabel}
            </Button>
          </div>
        </form>
      )}
    </Section>
  );
}
