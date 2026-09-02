import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ScanLine, Pill, Network, Sparkles, CheckCircle2, Loader2, AlertTriangle, Upload } from "lucide-react";
import {
  getPendingFile,
  clearPendingFile,
  saveReport,
  getSession,
  fileToDataUrl,
  toReport,
} from "@/lib/store";
import { analyzePrescription } from "@/lib/analysis.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/processing")({
  head: () => ({
    meta: [
      { title: "Analyzing prescription — AyurSafe" },
      { name: "description", content: "AyurSafe is running OCR, entity extraction and interaction analysis." },
      { property: "og:title", content: "Analyzing prescription — AyurSafe" },
      { property: "og:description", content: "OCR, entity extraction and herb-drug interaction analysis in progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Processing,
});

const steps = [
  { icon: ScanLine, title: "Extracting prescription", desc: "OCR · reading text from your document" },
  { icon: Pill, title: "Identifying drugs & herbs", desc: "Normalizing to clinical entities" },
  { icon: Network, title: "Checking interactions", desc: "Knowledge base + clinical reasoning" },
  { icon: Sparkles, title: "Generating recommendations", desc: "Scoring and safer alternatives" },
] as const;

function Processing() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzePrescription);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const doneIdRef = useRef<string | null>(null);
  const [finished, setFinished] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const pending = getPendingFile();
    if (!pending) {
      setError("No prescription file found. Please upload a prescription to analyze.");
      return;
    }

    (async () => {
      try {
        const dataUrl = await fileToDataUrl(pending.file);
        const result = await analyze({
          data: { fileName: pending.name, mimeType: pending.type || "application/octet-stream", dataUrl },
        });
        const report = toReport(result);
        saveReport(report);
        clearPendingFile();
        doneIdRef.current = report.id;
        setFinished(true);
      } catch (err) {
        clearPendingFile();
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Analysis failed. Please try again with a clearer prescription image.";
        setError(message);
      }
    })();
  }, [navigate, analyze]);

  // Step animation: hold on the last step until the real analysis resolves.
  useEffect(() => {
    if (error) return;
    if (finished && active >= steps.length) {
      const t = setTimeout(() => {
        toast.success("Analysis complete.");
        navigate({ to: "/results", search: { id: doneIdRef.current ?? undefined } });
      }, 500);
      return () => clearTimeout(t);
    }
    const cap = finished ? steps.length : steps.length - 1;
    if (active >= cap) return;
    const t = setTimeout(() => setActive((i) => i + 1), finished ? 350 : 1200);
    return () => clearTimeout(t);
  }, [active, finished, error, navigate]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-4 py-10">
        <div className="glass shadow-elegant animate-scale-in w-full rounded-3xl p-8 text-center sm:p-12">
          <div className="bg-danger/15 text-danger mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
            <AlertTriangle className="h-7 w-7" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">We couldn't analyze this prescription</h1>
          <p className="mt-3 text-sm text-muted-foreground">{error}</p>
          <ul className="text-muted-foreground mx-auto mt-5 max-w-sm space-y-1.5 text-left text-xs">
            <li>· Capture the entire prescription, edge to edge.</li>
            <li>· Avoid glare, shadows and blur — good lighting helps OCR.</li>
            <li>· PDFs should contain the prescription page, not a cover sheet.</li>
          </ul>
          <button
            onClick={() => navigate({ to: "/upload" })}
            className="bg-gradient-primary text-primary-foreground shadow-elegant transition-smooth mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-95"
          >
            <Upload className="h-4 w-4" /> Try another upload
          </button>
        </div>
      </main>
    );
  }

  const progress = Math.min(100, (active / steps.length) * 100);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-4 py-10">
      <div className="glass shadow-elegant animate-scale-in w-full rounded-3xl p-8 text-center sm:p-12">
        <div className="relative mx-auto mb-8 h-32 w-32">
          <svg className="-rotate-90 h-32 w-32" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" stroke="var(--muted)" strokeWidth="10" fill="none" />
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="url(#grad)"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)" }}
            />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.58 0.14 155)" />
                <stop offset="100%" stopColor="oklch(0.62 0.13 230)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold tracking-tight">{Math.round(progress)}%</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Analyzing
            </div>
          </div>
          <div className="bg-primary/20 absolute inset-0 -z-10 animate-pulse-glow rounded-full blur-2xl" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          AyurSafe AI is analyzing your prescription
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reading the document, matching medicines and checking every combination. Please don't close the
          window.
        </p>

        <div className="mt-8 space-y-3 text-left">
          {steps.map((s, i) => {
            const done = i < active;
            const current = i === active;
            return (
              <div
                key={s.title}
                className={`transition-smooth flex items-center gap-4 rounded-2xl border p-4 ${
                  done
                    ? "border-safe/30 bg-safe/5"
                    : current
                      ? "border-primary/40 bg-primary/5 shadow-glow"
                      : "border-border bg-card/40 opacity-60"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    done
                      ? "bg-safe/15 text-safe"
                      : current
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5" strokeWidth={2.4} />
                  ) : current ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <s.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
