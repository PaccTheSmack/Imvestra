"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();

  return (
    <motion.main
      key={pathname}
      initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="flex-1 overflow-y-auto bg-[#080808] min-h-screen min-w-0"
    >
      {children}
    </motion.main>
  );
}
