/**
 * PharmaGuard — Report Export Component
 * Download full JSON report and copy individual drug reports.
 */

import { useState } from "react";
import { Download, Copy, Check, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PharmacogenomicReport } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ReportExportProps {
  reports: PharmacogenomicReport[];
  patientId: string;
}

export function ReportExport({ reports, patientId }: ReportExportProps) {
  const [copied, setCopied] = useState(false);

  const exportData = {
    schema_version: "1.0.0",
    generator: "PharmaGuard v1.0 — RIFT 2026 Pharmacogenomics Track",
    cpic_version: "CPIC 2024",
    patient_id: patientId,
    export_timestamp: new Date().toISOString(),
    reports,
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pharmaguard_${patientId}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Risk summary counts
  const riskCounts = reports.reduce(
    (acc, r) => {
      const label = r.risk_assessment.risk_label;
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const criticalCount = (riskCounts["Toxic"] ?? 0) + (riskCounts["Ineffective"] ?? 0);
  const adjustCount = riskCounts["Adjust Dosage"] ?? 0;
  const safeCount = riskCounts["Safe"] ?? 0;

  return (
    <div className="clinical-card p-5 space-y-4">
      {/* Summary stats */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Assessment Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[hsl(var(--risk-safe-bg))] p-3 text-center">
            <div className="text-2xl font-bold text-risk-safe">{safeCount}</div>
            <div className="text-xs text-[hsl(var(--risk-safe-foreground))] mt-0.5">Safe</div>
          </div>
          <div className="rounded-xl bg-[hsl(var(--risk-adjust-bg))] p-3 text-center">
            <div className="text-2xl font-bold text-risk-adjust">{adjustCount}</div>
            <div className="text-xs text-[hsl(var(--risk-adjust-foreground))] mt-0.5">Adjust Dose</div>
          </div>
          <div className="rounded-xl bg-[hsl(var(--risk-critical-bg))] p-3 text-center">
            <div className="text-2xl font-bold text-risk-critical">{criticalCount}</div>
            <div className="text-xs text-[hsl(var(--risk-critical-foreground))] mt-0.5">High Risk</div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-xl bg-secondary p-3 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Patient ID</span>
          <span className="font-mono font-medium text-foreground">{patientId}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Genes Analyzed</span>
          <span className="font-medium text-foreground">{reports.length} / 6</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">CPIC Version</span>
          <span className="font-medium text-foreground">2024</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Report Generated</span>
          <span className="font-medium text-foreground">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Export buttons */}
      <div className="space-y-2">
        <Button
          onClick={handleDownload}
          className="w-full gap-2 bg-gradient-clinical text-primary-foreground hover:opacity-90 shadow-primary"
        >
          <Download className="h-4 w-4" />
          Download Full Report (.json)
        </Button>
        <Button
          onClick={handleCopy}
          variant="outline"
          className={cn("w-full gap-2 transition-colors", copied && "border-risk-safe text-risk-safe")}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied to Clipboard!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy JSON to Clipboard
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
        <FileJson className="h-3.5 w-3.5" />
        <span>Output conforms to RIFT 2026 mandatory schema v1.0</span>
      </div>
    </div>
  );
}
