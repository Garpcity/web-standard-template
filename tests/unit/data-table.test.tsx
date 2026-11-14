import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { block as blockSchema, type BlockOf } from "@/content/schema";
import { DataTable } from "@/components/blocks/DataTable";

const make = (input: Record<string, unknown>) =>
  blockSchema.parse({
    _type: "dataTable",
    id: "dt",
    columns: ["Pakke", "Inkluderer", "Pris"],
    rows: [
      ["Start", "Fem sider", "25 000"],
      ["Vekst", "Femten sider", "60 000"],
    ],
    ...input,
  }) as BlockOf<"dataTable">;

describe("DataTable", () => {
  it("rendrer semantisk tabell med caption, kolonne- og radoverskrifter", () => {
    render(<DataTable block={make({ heading: "Priser" })} />);
    const table = screen.getByRole("table", { name: "Priser" });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(3);
    const rowHeaders = within(table).getAllByRole("rowheader");
    expect(rowHeaders.map((h) => h.textContent)).toEqual(["Start", "Vekst"]);
    expect(rowHeaders[0]).toHaveAttribute("scope", "row");
    expect(table.parentElement).toHaveClass("overflow-x-auto");
  });

  it("har caption for skjermlesere også uten overskrift", () => {
    const { container } = render(<DataTable block={make({ caption: "Eks. mva" })} />);
    const caption = container.querySelector("caption");
    expect(caption).toHaveTextContent("Eks. mva");
    expect(caption).toHaveClass("sr-only");
  });

  it("høyrejusterer tallceller og ikke tekstceller", () => {
    render(<DataTable block={make({})} />);
    expect(screen.getByText("25 000")).toHaveClass("text-right");
    expect(screen.getByText("Fem sider")).not.toHaveClass("text-right");
  });

  it("rendrer td i første kolonne når firstColumnIsHeader er av", () => {
    render(<DataTable block={make({ firstColumnIsHeader: false })} />);
    expect(screen.queryAllByRole("rowheader")).toHaveLength(0);
  });

  it("viser ekstern kilde med rel=noopener", () => {
    render(
      <DataTable
        block={make({
          source: { label: "SSB", href: "https://www.ssb.no", external: true },
        })}
      />,
    );
    expect(screen.getByText(/Kilde:/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "SSB" });
    expect(link).toHaveAttribute("rel", "noopener");
    expect(link).toHaveAttribute("href", "https://www.ssb.no");
  });
});
