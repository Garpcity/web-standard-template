"use client";

import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Section narrow>
      <p className="text-sm text-fg-muted">500</p>
      <h1 className="mt-2 text-4xl font-semibold">Noe gikk galt</h1>
      <p className="mt-4 text-lg text-fg-muted">
        Vi har fått beskjed. Prøv igjen om et øyeblikk.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Prøv igjen</Button>
        <Button href="/" variant="secondary">
          Til forsiden
        </Button>
      </div>
    </Section>
  );
}
