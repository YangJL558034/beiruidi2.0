"use client";

import { useEffect, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <motion.div
      key={pathname}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.34, ease: [0.22, 1, 0.36, 1] }
      }
      className="min-h-screen"
    >
      {!reduceMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-[95] h-[2px] origin-left bg-gradient-to-r from-transparent via-[#0071e3] to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: [0, 1, 0] }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ) : null}
      {children}
    </motion.div>
  );
}
