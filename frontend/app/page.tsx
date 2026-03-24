import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      {/* Noise grain overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Page content */}
      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Hero />
        <Stats />
        <Features />

        {/* Interstitial quote */}
        <section className="relative border-y border-border py-20 md:py-28 px-6 md:px-12">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-2">
              <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
                PHILOSOPHY
              </div>
            </div>
            <div className="md:col-span-8">
              <blockquote className="font-sans font-light text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.3] tracking-[-0.02em] text-foreground/90">
                &ldquo;The archive is not a place of preservation — it is a
                system of intelligence. Every document holds structure,
                waiting to be understood.&rdquo;
              </blockquote>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 md:py-32 px-6 md:px-12">
          <div className="max-w-[1400px] mx-auto text-center">
            <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground mb-8">
              READY TO BEGIN?
            </div>
            <h2 className="font-sans font-bold text-[clamp(2rem,5vw,4rem)] tracking-[-0.03em] text-foreground leading-[0.95] mb-12">
              START YOUR<br />FIRST SESSION.
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/chat"
                className="brutalist-hover inline-flex items-center justify-center px-10 py-5 border border-foreground font-mono text-[11px] tracking-[0.2em] text-foreground transition-all duration-150"
              >
                LAUNCH ARCHIVEAI →
              </a>
              <a
                href="/documents"
                className="inline-flex items-center justify-center px-10 py-5 border border-border font-mono text-[11px] tracking-[0.2em] text-muted-foreground transition-all duration-150 hover:text-foreground hover:border-foreground"
              >
                UPLOAD DOCUMENTS
              </a>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
