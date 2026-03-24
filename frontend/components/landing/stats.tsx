"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "12K+", label: "DOCUMENTS PROCESSED" },
  { value: "0.3s", label: "AVG. RETRIEVAL TIME" },
  { value: "99.2%", label: "EXTRACTION ACCURACY" },
  { value: "24/7", label: "SYSTEM UPTIME" },
];

export function Stats() {
  return (
    <section className="relative border-y border-border">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.7,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`group px-6 md:px-10 py-12 md:py-16 ${
                i < stats.length - 1 ? "border-r border-border" : ""
              } transition-colors duration-150 hover:bg-foreground/[0.03]`}
            >
              <div className="font-sans font-bold text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] text-foreground leading-none mb-3">
                {stat.value}
              </div>
              <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
