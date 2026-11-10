import type { Metadata } from "next";
import { fontClassName } from "../_fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "Rediger",
  robots: { index: false, follow: false },
};

/** Eget rot-layout for Puck-editoren: ingen header/footer. */
export default function EditLayout({ children }: LayoutProps<"/edit">) {
  return (
    <html lang="nb" className={`${fontClassName} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
