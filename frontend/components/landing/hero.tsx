"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const headingWords = ["DOCUMENT", "INTELLIGENCE,", "REDEFINED."];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-end pb-24 md:pb-32 pt-32 px-6 md:px-12 overflow-hidden">
      <div className="max-w-[1400px] mx-auto w-full">
        {/* Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-end">
          {/* Main heading — spans 8 cols */}
          <div className="md:col-span-8">
            {/* Overline */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="w-12 h-px bg-muted-foreground animate-line-expand delay-300" />
              <span className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
                AI-Powered Archive System
              </span>
            </motion.div>

            {/* Massive heading */}
            <h1 className="font-sans font-bold leading-[0.9] tracking-[-0.03em]">
              {headingWords.map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 60, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.9,
                    delay: 0.3 + i * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="block text-[clamp(3rem,8vw,7rem)] text-foreground"
                >
                  {word}
                </motion.span>
              ))}
            </h1>
          </div>

          {/* Right column — description + CTAs */}
          <div className="md:col-span-4 flex flex-col gap-8">
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="font-mono text-[13px] leading-relaxed text-muted-foreground max-w-sm"
            >
              Transform unstructured documents into structured, searchable
              knowledge. Extract, analyze, and retrieve with precision
              that redefines what an archive can be.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link
                href="/chat"
                className="brutalist-hover inline-flex items-center justify-center px-8 py-4 border border-foreground font-mono text-[11px] tracking-[0.2em] text-foreground transition-all duration-150"
              >
                BEGIN SESSION →
              </Link>
              <Link
                href="/documents"
                className="inline-flex items-center justify-center px-8 py-4 border border-border font-mono text-[11px] tracking-[0.2em] text-muted-foreground transition-all duration-150 hover:text-foreground hover:border-foreground"
              >
                VIEW ARCHIVE
              </Link>
            </motion.div>

            {/* Status line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] text-muted-foreground"
            >
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>SYSTEM ONLINE</span>
              <span className="text-border">|</span>
              <span>v2.0.0</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Decorative grid lines */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-px h-full bg-border/30" />
        <div className="absolute top-0 left-2/3 w-px h-full bg-border/20" />
        <div className="absolute bottom-32 left-0 w-full h-px bg-border/20" />
      </div>
    </section>
  );
}
