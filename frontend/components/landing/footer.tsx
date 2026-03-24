"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const footerLinks = [
  { label: "CHAT", href: "/chat" },
  { label: "DOCUMENTS", href: "/documents" },
  { label: "SEARCH", href: "/search" },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Main footer */}
        <div className="grid grid-cols-1 md:grid-cols-12 py-16 md:py-24 gap-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-foreground" />
                <span className="font-sans font-bold text-sm tracking-[0.2em] uppercase text-foreground">
                  Archive<span className="text-muted-foreground">AI</span>
                </span>
              </div>
              <p className="font-mono text-[12px] leading-relaxed text-muted-foreground max-w-sm">
                An AI-powered document intelligence system built for
                precision extraction, semantic search, and contextual
                analysis across unstructured data.
              </p>
            </motion.div>
          </div>

          {/* Spacer */}
          <div className="hidden md:block md:col-span-4" />

          {/* Navigation */}
          <div className="md:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground mb-6">
                NAVIGATION
              </div>
              <div className="flex flex-col gap-3">
                {footerLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="font-mono text-[12px] tracking-[0.1em] text-muted-foreground transition-colors duration-150 hover:text-foreground border-expand-hover w-fit"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground">
            © 2026 ARCHIVEAI. ALL RIGHTS RESERVED.
          </span>
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] text-muted-foreground">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
