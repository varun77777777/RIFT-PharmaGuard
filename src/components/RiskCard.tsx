/**
 * PharmaGuard — Individual Risk Card Component
 * Displays a single gene-drug pharmacogenomic report with traffic-light risk coloring.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check, AlertTriangle, ShieldCheck, XCircle, Ban, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PHENOTYPE_LABELS, RISK_LABEL_CONFIG, SEVERITY_CONFIG } from "@/lib/pharmacogenomics";
import type { PharmacogenomicReport, RiskLabel } from "@/lib/types";

interface RiskCardProps {
  report: PharmacogenomicReport;
  index: number;
}

const RISK_ICONS: Record<RiskLabel, React.ComponentType<{ className?: string }>> = {
  "Safe":          ShieldCheck,
  "Adjust Dosage": AlertTriangle,
  "Toxic":         XCircle,
  "Ineffective":   Ban,
  "Unknown":       HelpCircle,
};

function ConfidenceBar({ score }: { score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Confidence</span>
        <span className="font-mono font-medium">{(score * 100).toFixed(0)}%</span>
      </div>
      <div className="confidence-track">
        <div
          className="confidence-fill"
          style={{ width: `${score * 100}%` }}
        />
      </div>
    </div>
  );
}

export function RiskCard({ report, index }: RiskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const { risk_label, severity, confidence_score } = report.risk_assessment;
  const { primary_gene, diplotype, phenotype, detected_variants } = report.pharmacogenomic_profile;

  const riskConfig = RISK_LABEL_CONFIG[risk_label] ?? RISK_LABEL_CONFIG["Unknown"];
  const severityConfig = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG["none"];
  const RiskIcon = RISK_ICONS[risk_label] ?? HelpCircle;

  const copyJSON = async () => {
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "clinical-card border overflow-hidden animate-slide-up",
        riskConfig.borderClass,
        `delay-${Math.min(index * 100, 500)}`
      )}
    >
      {/* Card Header */}
      <div className={cn("px-5 py-4", riskConfig.bgClass)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Risk icon */}
            <div className={cn("p-2 rounded-lg", riskConfig.bgClass)}>
              <RiskIcon className={cn("h-5 w-5", riskConfig.colorClass)} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-foreground text-lg">{report.drug}</span>
                <span className="gene-label">{primary_gene}</span>
              </div>

              {/* Risk badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("risk-badge", riskConfig.colorClass, riskConfig.bgClass)}>
                  <span className="severity-dot" style={{
                    backgroundColor: `hsl(var(--risk-${severity === "none" ? "safe" : severity === "moderate" || severity === "low" ? "adjust" : "critical"}))`
                  }} />
                  {risk_label}
                </span>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", severityConfig.bgClass, severityConfig.colorClass)}>
                  {severityConfig.label} severity
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={copyJSON}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-secondary transition-colors"
            title="Copy JSON"
            aria-label="Copy report JSON"
          >
            {copied ? (
              <Check className="h-4 w-4 text-risk-safe" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Genomic Profile Summary */}
      <div className="px-5 py-4 border-t border-border space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Diplotype</p>
            <p className="font-mono text-sm font-semibold text-foreground">{diplotype}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Phenotype</p>
            <p className="text-sm font-semibold text-foreground">{phenotype}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Full Label</p>
            <p className="text-xs text-muted-foreground">{PHENOTYPE_LABELS[phenotype]}</p>
          </div>
        </div>

        <ConfidenceBar score={confidence_score} />

        {/* Detected Variants */}
        {detected_variants.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Detected Variants</p>
            <div className="flex flex-wrap gap-1.5">
              {detected_variants.map((v) => (
                <div key={v.rsid} className="flex items-center gap-1 bg-secondary rounded-lg px-2 py-1" title={`Star allele: ${v.starAllele}`}>
                  <span className="rsid-chip">{v.rsid}</span>
                  <span className="text-xs text-foreground font-mono">{v.genotype}</span>
                  {v.starAllele && (
                    <span className="text-xs text-primary font-mono font-medium">{v.starAllele}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {detected_variants.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
            <ShieldCheck className="h-3.5 w-3.5 text-risk-safe" />
            <span>No actionable variants detected — wildtype assumed</span>
          </div>
        )}
      </div>

      {/* Clinical Recommendation (always visible) */}
      <div className="px-5 py-3 bg-muted/40 border-t border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Clinical Action</p>
        <p className="text-sm text-foreground font-medium leading-relaxed">{report.clinical_recommendation.action}</p>
      </div>

      {/* Expandable: Full Details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 flex items-center justify-between text-xs text-muted-foreground hover:bg-secondary/50 transition-colors border-t border-border"
      >
        <span className="font-medium">{expanded ? "Hide" : "Show"} clinical details &amp; mechanism</span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-3 space-y-4 border-t border-border animate-fade-in">
          {/* Dosage Adjustment */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dosage Adjustment</p>
            <p className="text-sm text-foreground leading-relaxed">{report.clinical_recommendation.dosage_adjustment}</p>
          </div>

          {/* LLM Summary */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Clinical Summary</p>
            <p className="text-sm text-foreground leading-relaxed">{report.llm_generated_explanation.summary}</p>
          </div>

          {/* Mechanism */}
          <div className="rounded-xl bg-secondary/60 p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Molecular Mechanism</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{report.llm_generated_explanation.mechanism}</p>
          </div>

          {/* Timestamp & QC */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
            <span>Analyzed: {new Date(report.timestamp).toLocaleString()}</span>
            <span className="flex items-center gap-1">
              <span className={cn("h-1.5 w-1.5 rounded-full", report.quality_metrics.vcf_parsing_success ? "bg-risk-safe" : "bg-risk-toxic")} />
              {report.quality_metrics.target_variants_found ?? 0} variant(s) interrogated
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
