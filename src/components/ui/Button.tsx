import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

type Props = {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  href?: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<ComponentProps<"button">, "children">;

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-[transform,background-color,box-shadow] duration-150 ease-out hover:-translate-y-0.5 focus-visible:outline-accent disabled:opacity-50 disabled:hover:translate-y-0";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-fg-inverse shadow-sm hover:shadow-md",
  secondary: "border border-border bg-surface text-fg hover:bg-surface-muted",
  ghost: "text-brand underline-offset-4 hover:underline",
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-base",
  lg: "h-13 px-8 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  external,
  className,
  children,
  ...rest
}: Props) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if (href) {
    if (external) {
      return (
        <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
