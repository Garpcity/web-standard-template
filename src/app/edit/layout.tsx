/** Editoren har eget, minimalt layout uten header/footer. */
export default function EditLayout({ children }: LayoutProps<"/edit">) {
  return <div className="min-h-screen">{children}</div>;
}
