"use client";

import { useEffect, useState } from "react";
import { useMotionValue, animate, useReducedMotion } from "motion/react";

interface CountUpProps {
  to: number;
  formatter: (v: number) => string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function CountUp({
  to,
  formatter,
  duration = 1.4,
  className,
  style,
}: CountUpProps) {
  const prefersReduced = useReducedMotion();
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(() => formatter(0));

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(formatter(to));
      return;
    }
    const ctrl = animate(mv, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = mv.on("change", (v) => setDisplay(formatter(v)));
    return () => {
      ctrl.stop();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, prefersReduced]);

  return (
    <span className={className} style={style}>
      {display}
    </span>
  );
}
