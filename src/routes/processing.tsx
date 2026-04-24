import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ScanLine, Pill, Network, Sparkles, CheckCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/processing")({
  head: () => ({
    meta: [{ title: "Analyzing — AyurSafe" }],
  }),
  component: Processing,
});

const steps = [
  { icon: ScanLine, title: "Extracting prescription", desc: "OCR · reading text from your image" },
  { icon: Pill, title: "Identifying drugs & herbs", desc: "NLP · matching to clinical entities" },
  { icon: Network, title: "Checking interactions", desc: "Knowledge graph traversal" },
  { icon: Sparkles, title: "Generating recommendations", desc: "AI clinical reasoning" },
] as const;

function Processing() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= steps.length) {
      const t = setTimeout(() => navigate({ to: "/results" }), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive((i) => i + 1), 1100);
    return () => clearTimeout(t);
  }, [active, navigate]);

  const progress = Math.min(100, (active / steps.length) * 100);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-4 py-10">
      <div className="glass shadow-elegant animate-scale-in w-full rounded-3xl p-8 text-center sm:p-12">
        <div className="relative mx-auto mb-8 h-32 w-32">
          <svg className="-rotate-90 h-32 w-32" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="var(--muted)"
              strokeWidth="10"
              fill="none"
            />
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
          This usually takes a few seconds. Please don't close the window.
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
