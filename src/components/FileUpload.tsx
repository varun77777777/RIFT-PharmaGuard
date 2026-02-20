/**
 * PharmaGuard — File Upload Component
 * Drag-and-drop VCF file uploader with validation and demo scenarios.
 */

import React, { useCallback, useState, useRef } from "react";
import { Upload, FileText, AlertCircle, Zap, FlaskConical, Dna } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateVCFFile, readFileAsText, generateDemoVCF } from "@/lib/vcf-parser";
import type { ParseState } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onAnalyze: (content: string, filename: string) => void;
  parseState: ParseState;
}

const DEMO_SCENARIOS = [
  { key: "mixed",     label: "Mixed Risk",   icon: FlaskConical, desc: "Realistic clinical scenario with multiple variants" },
  { key: "high-risk", label: "High Risk",    icon: AlertCircle,  desc: "All Poor Metabolizer — max toxicity alerts" },
  { key: "normal",    label: "Normal",       icon: Zap,          desc: "All wildtype — safe baseline assessment" },
] as const;

export function FileUpload({ onAnalyze, parseState }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setFileError(null);
      const validation = validateVCFFile(file);
      if (!validation.valid) {
        setFileError(validation.error ?? "Invalid file.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      const content = await readFileAsText(file);
      onAnalyze(content, file.name);
    },
    [onAnalyze]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };
  const onDragLeave = () => setDragActive(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const loadDemo = (scenario: "normal" | "high-risk" | "mixed") => {
    const content = generateDemoVCF(scenario);
    const filename = `demo_${scenario}.vcf`;
    setSelectedFile(new File([content], filename, { type: "text/plain" }));
    setFileError(null);
    onAnalyze(content, filename);
  };

  const isLoading = parseState.status === "parsing";

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        className={cn(
          "drop-zone p-10 text-center transition-all duration-200",
          dragActive && "drag-active scale-[1.01]",
          isLoading && "pointer-events-none opacity-60"
        )}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !isLoading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        aria-label="Upload VCF file"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".vcf"
          className="hidden"
          onChange={onInputChange}
          aria-hidden="true"
        />

        <div className="flex flex-col items-center gap-4">
          {isLoading ? (
            <div className="relative">
              <Dna className="h-12 w-12 text-primary animate-spin" style={{ animationDuration: "2s" }} />
            </div>
          ) : selectedFile ? (
            <div className="flex items-center gap-3 bg-secondary px-4 py-3 rounded-xl">
              <FileText className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-gradient-clinical flex items-center justify-center shadow-primary">
              <Upload className="h-7 w-7 text-primary-foreground" />
            </div>
          )}

          {isLoading ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-primary">Parsing VCF & Running CPIC Analysis…</p>
              <p className="text-xs text-muted-foreground">Identifying variants across 6 pharmacogenes</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {selectedFile ? "Drop another file or click to replace" : "Drag & drop your VCF file here"}
              </p>
              <p className="text-xs text-muted-foreground">
                VCF v4.1/v4.2 · Maximum 5 MB · Analyzed locally in your browser
              </p>
            </div>
          )}

          {!isLoading && !selectedFile && (
            <Button variant="outline" size="sm" className="mt-1 pointer-events-none">
              Browse Files
            </Button>
          )}
        </div>
      </div>

      {/* File Error */}
      {fileError && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[hsl(var(--risk-toxic-bg))] border border-risk-toxic text-risk-toxic text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{fileError}</span>
        </div>
      )}

      {/* Demo Scenarios */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground font-medium px-2">Or load a demo scenario</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {DEMO_SCENARIOS.map(({ key, label, icon: Icon, desc }) => (
            <button
              key={key}
              onClick={() => !isLoading && loadDemo(key)}
              disabled={isLoading}
              className={cn(
                "group flex flex-col items-center gap-2 p-3 rounded-xl border border-border",
                "bg-card hover:bg-secondary hover:border-primary/30 transition-all duration-150",
                "text-center disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              title={desc}
            >
              <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Privacy note */}
      <p className="text-center text-xs text-muted-foreground">
        🔒 All analysis runs locally in your browser. No genomic data is transmitted.
      </p>
    </div>
  );
}
