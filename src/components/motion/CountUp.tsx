"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { countUpDuration } from "@/design/motion";

type Props = { value: number; prefix?: string; suffix?: string; className?: string };

/** Teller fra 0 til verdi når synlig. Oppskrift: countUp. */
export function CountUp({ value, prefix = "", suffix = "", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration: countUpDuration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString("nb-NO")}
      {suffix}
    </span>
  );
}
