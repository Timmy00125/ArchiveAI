"use client";

import { motion } from "framer-motion";

const features = [
  {
    index: "01",
    title: "Intelligent Extraction",
    description:
      "Advanced AI models parse and extract structured data from PDFs, images, and handwritten documents with surgical precision.",
    detail: "OCR + NLP PIPELINE",
  },
  {
    index: "02",
    title: "Semantic Search",
    description:
      "Go beyond keyword matching. Query your entire archive with natural language and receive contextually relevant results in milliseconds.",
    detail: "VECTOR EMBEDDINGS",
  },
  {
    index: "03",
    title: "Conversational Analysis",
    description:
      "Engage directly with your documents through an AI assistant that understands context, draws connections, and surfaces insights.",
    detail: "RAG ARCHITECTURE",
  },
];

export function Features() {
  return (
    <section className="relative py-24 md:py-32 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-4 mb-16 md:mb-24"
        >
          <div className="w-12 h-px bg-muted-foreground" />
          <span className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
            Core Capabilities
          </span>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-border">
          {features.map((feature, i) => (
            <motion.div
              key={feature.index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.7,
                delay: i * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`group relative border-b border-border ${
                i < features.length - 1 ? "md:border-r" : ""
              } p-8 md:p-10 transition-colors duration-150 hover:bg-foreground/[0.02]`}
            >
              {/* Index */}
              <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mb-8">
                {feature.index}
              </div>

              {/* Title */}
              <h3 className="font-sans font-bold text-xl md:text-2xl tracking-[-0.02em] text-foreground mb-4 leading-tight">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="font-mono text-[12px] leading-relaxed text-muted-foreground mb-8">
                {feature.description}
              </p>

              {/* Detail tag */}
              <div className="flex items-center gap-3">
                <div className="w-6 h-px bg-muted-foreground/50 transition-all duration-300 group-hover:w-10 group-hover:bg-foreground" />
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                  {feature.detail}
                </span>
              </div>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
