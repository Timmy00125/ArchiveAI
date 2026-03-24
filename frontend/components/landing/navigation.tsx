"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const navLinks = [
  { label: "CHAT", href: "/chat" },
  { label: "DOCUMENTS", href: "/documents" },
  { label: "SEARCH", href: "/search" },
];

export function Navigation() {
  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border"
      style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(5, 5, 5, 0.8)" }}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-2 h-2 bg-foreground transition-all duration-300 group-hover:w-4" />
          <span className="font-sans font-bold text-sm tracking-[0.2em] uppercase text-foreground">
            Archive<span className="text-muted-foreground">AI</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link, i) => (
            <motion.div
              key={link.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.3 + i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Link
                href={link.href}
                className="relative px-4 py-2 font-mono text-[11px] tracking-[0.15em] text-muted-foreground transition-colors duration-150 hover:text-foreground border-expand-hover"
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Link
            href="/chat"
            className="brutalist-hover px-5 py-2 border border-foreground font-mono text-[11px] tracking-[0.15em] text-foreground transition-all duration-150"
          >
            LAUNCH
          </Link>
        </motion.div>
      </div>
    </motion.nav>
  );
}
