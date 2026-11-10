import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorClient } from "./EditorClient";
import { siteConfig } from "../../../../site.config";

export const metadata: Metadata = {
  title: "Rediger",
  robots: { index: false, follow: false },
};

/**
 * Visuell editor (Puck) på /edit/[slug].
 * Rolle: i template-modus er alle `editor` (låste felt skjult). Med WordPress/Payload
 * hentes rollen fra CMS-brukeren. `?role=owner` i utvikling viser alle felt.
 */
export default async function EditPage({
  params,
  searchParams,
}: PageProps<"/edit/[slug]">) {
  if (!siteConfig.editor.puck) notFound();
  const { slug } = await params;
  const sp = await searchParams;
  const role =
    process.env.NODE_ENV !== "production" && sp.role === "owner" ? "owner" : "editor";
  return <EditorClient slug={slug} role={role} />;
}
