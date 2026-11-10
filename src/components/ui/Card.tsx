import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "hover-lift rounded-card border border-border bg-surface p-6 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
