"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "CHAT", href: "/chat" },
  { label: "DOCUMENTS", href: "/documents" },
  { label: "SEARCH", href: "/search" },
];

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-2 h-2 bg-foreground transition-all duration-300 group-hover:w-4" />
            <span className="font-sans font-bold text-sm tracking-[0.2em] uppercase text-foreground">
              Archive<span className="text-muted-foreground">AI</span>
            </span>
          </Link>

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

          <div className="hidden md:block">
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

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border p-6 md:hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-mono text-sm tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/chat"
                onClick={() => setMobileOpen(false)}
                className="brutalist-hover mt-2 px-5 py-3 border border-foreground font-mono text-[11px] tracking-[0.15em] text-foreground text-center transition-all duration-150"
              >
                LAUNCH
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
