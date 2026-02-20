/**
 * PharmaGuard — Main Dashboard Page
 * Orchestrates VCF upload, CPIC analysis, and results display.
 */

import { useState, useCallback } from "react";
import { Dna, Activity, ShieldAlert, Info } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { RiskCard } from "@/components/RiskCard";
import { ReportExport } from "@/components/ReportExport";
import { parseVCF } from "@/lib/vcf-parser";
import { analyzeVCF } from "@/lib/pharmacogenomics";
import type { ParseState, PharmacogenomicReport } from "@/lib/types";
import heroBanner from "@/assets/hero-banner.jpg";
import { cn } from "@/lib/utils";

// Gene order for consistent display
const GENE_ORDER = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"];

function sortReports(reports: PharmacogenomicReport[]): PharmacogenomicReport[] {
  const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3, none: 4 };
  return [...reports].sort((a, b) => {
    const sa = severityOrder[a.risk_assessment.severity] ?? 5;
    const sb = severityOrder[b.risk_assessment.severity] ?? 5;
    if (sa !== sb) return sa - sb;
    return GENE_ORDER.indexOf(a.pharmacogenomic_profile.primary_gene) -
      GENE_ORDER.indexOf(b.pharmacogenomic_profile.primary_gene);
  });
}

export default function Index() {
  const [parseState, setParseState] = useState<ParseState>({ status: "idle" });

  const handleAnalyze = useCallback(async (content: string, filename: string) => {
    setParseState({ status: "parsing" });

    // Simulate async processing (in production this would be an API call)
    await new Promise((r) => setTimeout(r, 600));

    try {
      const parseResult = parseVCF(content);
      const reports = analyzeVCF(parseResult);
      const sorted = sortReports(reports);

      setParseState({
        status: "success",
        reports: sorted,
        patientId: parseResult.sampleId,
        vcfVersion: parseResult.vcfVersion,
        totalVariants: parseResult.totalVariants,
      });
    } catch (err) {
      setParseState({
        status: "error",
        error: err instanceof Error ? err.message : "An unexpected error occurred during VCF parsing.",
      });
    }
  }, []);

  const hasResults = parseState.status === "success" && parseState.reports && parseState.reports.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Header ────────────────────────────────────────────── */}
      <header className="relative overflow-hidden" style={{ minHeight: "260px" }}>
        <img
          src={heroBanner}
          alt="PharmaGuard genomics visualization"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)", opacity: 0.85 }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-teal/20 border border-teal/30 flex items-center justify-center">
                <Dna className="h-5 w-5 text-teal" />
              </div>
              <div>
                <span className="text-white font-bold text-lg tracking-tight">PharmaGuard</span>
                <span className="block text-xs text-blue-200/70 -mt-0.5 font-mono">RIFT 2026 · Pharmacogenomics</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-blue-200/70 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Activity className="h-3 w-3" />
                CPIC Guidelines 2024
              </span>
              <span className="flex items-center gap-1.5 text-xs text-blue-200/70 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <ShieldAlert className="h-3 w-3" />
                6 Pharmacogenes
              </span>
            </div>
          </nav>

          {/* Title */}
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
              Precision Drug Safety
              <span className="block text-teal mt-1">from Your Genome</span>
            </h1>
            <p className="text-blue-100/80 text-base leading-relaxed">
              Upload a VCF file to identify pharmacogenomic variants and receive
              CPIC-guided drug risk assessments for 6 critical gene-drug pairs —
              instantly, privately, in your browser.
            </p>

            {/* Gene pills */}
            <div className="flex flex-wrap gap-2 mt-5">
              {["CYP2D6 · Codeine", "CYP2C19 · Clopidogrel", "CYP2C9 · Warfarin", "SLCO1B1 · Simvastatin", "TPMT · Azathioprine", "DPYD · Fluorouracil"].map((g) => (
                <span key={g} className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/10 text-blue-100/80 border border-white/10 backdrop-blur-sm">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className={cn("grid gap-8", hasResults ? "lg:grid-cols-[380px_1fr]" : "max-w-2xl mx-auto")}>

          {/* Left Panel: Upload + Export */}
          <div className="space-y-6">
            {/* Upload Card */}
            <div className="clinical-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-7 w-7 rounded-lg bg-gradient-clinical flex items-center justify-center">
                  <Dna className="h-4 w-4 text-primary-foreground" />
                </div>
                <h2 className="font-semibold text-foreground">VCF Analysis</h2>
              </div>
              <FileUpload onAnalyze={handleAnalyze} parseState={parseState} />
            </div>

            {/* Parse Error */}
            {parseState.status === "error" && (
              <div className="clinical-card p-4 border-risk-toxic bg-[hsl(var(--risk-toxic-bg))] animate-fade-in">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-risk-toxic flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-risk-toxic">Parse Error</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{parseState.error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Export Panel (when results available) */}
            {hasResults && parseState.reports && (
              <ReportExport reports={parseState.reports} patientId={parseState.patientId ?? "UNKNOWN"} />
            )}

            {/* VCF stats */}
            {hasResults && (
              <div className="clinical-card p-4 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Parse Statistics</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-secondary rounded-lg p-2.5">
                    <div className="text-muted-foreground">VCF Version</div>
                    <div className="font-mono font-semibold text-foreground">{parseState.vcfVersion ?? "—"}</div>
                  </div>
                  <div className="bg-secondary rounded-lg p-2.5">
                    <div className="text-muted-foreground">Total Variants</div>
                    <div className="font-mono font-semibold text-foreground">{parseState.totalVariants ?? 0}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Results Grid */}
          {hasResults && parseState.reports ? (
            <div className="space-y-4">
              {/* Results header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-foreground text-lg">Drug Risk Assessment</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Patient: <span className="font-mono">{parseState.patientId}</span> · 6 gene-drug pairs analyzed · Sorted by severity
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  <span className="hidden sm:block">Click any card for details</span>
                </div>
              </div>

              {/* Risk Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                {parseState.reports.map((report, i) => (
                  <RiskCard key={`${report.drug}-${report.pharmacogenomic_profile.primary_gene}`} report={report} index={i} />
                ))}
              </div>

              {/* CPIC Disclaimer */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary border border-border text-xs text-muted-foreground">
                <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
                <p>
                  <strong className="text-foreground">Clinical Disclaimer:</strong> This tool is for research and educational purposes only.
                  All CPIC guidelines are implemented as of 2024. Drug therapy decisions must be made by licensed healthcare providers
                  with full clinical context. PharmaGuard does not replace clinical pharmacogenomics testing (e.g., FDA-cleared PGx panels).
                </p>
              </div>
            </div>
          ) : parseState.status === "idle" ? (
            // Empty state — show how it works
            <div className="hidden lg:flex flex-col items-center justify-center py-16 space-y-6 max-w-md">
              <div className="text-center space-y-3">
                <div className="h-16 w-16 rounded-2xl bg-gradient-clinical flex items-center justify-center mx-auto shadow-primary">
                  <Activity className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg text-foreground">How PharmaGuard Works</h3>
              </div>
              <div className="space-y-3 w-full">
                {[
                  { step: "1", title: "Upload VCF", desc: "Drag & drop a VCF v4.1/4.2 file or load a demo scenario" },
                  { step: "2", title: "Parse & Identify", desc: "Variants are extracted and matched to 20+ pharmacogenomic RSIDs" },
                  { step: "3", title: "CPIC Analysis", desc: "Genotypes are mapped to phenotypes using CPIC 2024 guidelines" },
                  { step: "4", title: "Risk Report", desc: "6 drug risk cards generated with traffic-light severity scoring" },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex items-start gap-3 bg-card rounded-xl p-3 border border-border shadow-clinical-sm">
                    <span className="h-6 w-6 rounded-full bg-gradient-clinical text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-primary">
                      {step}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-6 mt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Dna className="h-3.5 w-3.5" />
            <span>PharmaGuard · RIFT 2026 Pharmacogenomics Track · Built on CPIC Guidelines</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://cpicpgx.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">CPIC</a>
            <a href="https://www.pharmvar.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">PharmVar</a>
            <a href="https://www.ncbi.nlm.nih.gov/clinvar" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">ClinVar</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
