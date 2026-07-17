"use client";

import { motion } from "motion/react";

type FadeInProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
};

export const FadeIn = ({
  children,
  delay = 0,
  className = "",
}: FadeInProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
