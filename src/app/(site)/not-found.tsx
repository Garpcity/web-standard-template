import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Section narrow>
      <p className="text-sm text-fg-muted">404</p>
      <h1 className="mt-2 text-4xl font-semibold">Siden finnes ikke</h1>
      <p className="mt-4 text-lg text-fg-muted">
        Lenken kan være feil, eller siden kan være flyttet. Prøv forsiden eller artiklene.
      </p>
      <div className="mt-8 flex gap-3">
        <Button href="/">Til forsiden</Button>
        <Button href="/artikler" variant="secondary">
          Artikler
        </Button>
      </div>
    </Section>
  );
}
