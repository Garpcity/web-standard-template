"use client";

/**
 * Model3dViewer – eneste inngang til 3D fra blokker.
 * Regler (DESIGN.md / 3D-PIPELINE.md):
 * - Lastes lazy og aldri før innhold er synlig (IntersectionObserver).
 * - Fallback til poster-bilde ved reduced motion, manglende WebGL eller svak enhet.
 * - Three/R3F havner i egen chunk; blokken koster ingenting for sider uten 3D.
 */
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { ImageRef } from "@/content";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils";

const Scene = lazy(() => import("./Scene").then((m) => ({ default: m.Scene })));
const Model = lazy(() => import("./Model").then((m) => ({ default: m.Model })));

type Props = {
  src?: string;
  alt: string;
  poster?: ImageRef;
  autoRotate?: boolean;
  interactive?: boolean;
  className?: string;
};

function canRender3D(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    if (!gl) return false;
  } catch {
    return false;
  }
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.deviceMemory && nav.deviceMemory < 2) return false;
  if (nav.connection?.saveData) return false;
  return true;
}

export function Model3dViewer({
  src,
  alt,
  poster,
  autoRotate = true,
  interactive = true,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // Starter som "idle" (poster). Går til "3d" når synlig og enheten kan rendre; ellers forblir poster.
  const [state, setState] = useState<"idle" | "3d">("idle");

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          if (canRender3D()) setState("3d");
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <div
      ref={ref}
      className={cn("relative size-full overflow-hidden", className)}
      role="img"
      aria-label={alt}
    >
      {state === "3d" ? (
        <Suspense fallback={<Poster poster={poster} />}>
          <Scene interactive={interactive} autoRotate={autoRotate}>
            <Model src={src} />
          </Scene>
        </Suspense>
      ) : (
        <Poster poster={poster} />
      )}
    </div>
  );
}

function Poster({ poster }: { poster?: ImageRef }) {
  if (poster)
    return <SmartImage image={poster} fill sizes="(min-width: 1024px) 50vw, 100vw" />;
  return (
    <div className="size-full bg-[radial-gradient(circle_at_30%_30%,var(--brand-soft),transparent_60%),radial-gradient(circle_at_70%_70%,var(--accent-soft),transparent_55%)]" />
  );
}
