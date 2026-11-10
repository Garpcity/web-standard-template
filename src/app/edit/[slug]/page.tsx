import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { EditorClient } from "./EditorClient";
import { identifyEditor } from "@/lib/editor-auth";
import { siteConfig } from "../../../../site.config";

/**
 * Visuell editor (Puck) på /edit/[slug].
 * Rollen kommer fra identifyEditor: Payload-brukeren når CMS er Payload (ikke innlogget → /admin/login),
 * ellers EDITOR_PASSWORD (rolle editor). Låste felt skjules i UI etter rolle, og håndheves
 * uansett på serversiden i /api/puck.
 */
export default async function EditPage({ params }: PageProps<"/edit/[slug]">) {
  if (!siteConfig.editor.puck) notFound();
  const { slug } = await params;
  const who = await identifyEditor(await headers());
  if (!who && process.env.CMS_PROVIDER === "payload")
    redirect(`/admin/login?redirect=${encodeURIComponent(`/edit/${slug}`)}`);
  return <EditorClient slug={slug} role={who?.role ?? "editor"} />;
}
