import type { Thing, WithContext } from "schema-dts";

/** Rendrer JSON-LD. Tar kun objekter fra builders i src/seo/schema/. */
export function JsonLd({ data }: { data: WithContext<Thing> | WithContext<Thing>[] }) {
  const list = Array.isArray(data) ? data : [data];
  return (
    <>
      {list.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON-LD er data, ikke HTML; vi escaper < for sikkerhets skyld.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
