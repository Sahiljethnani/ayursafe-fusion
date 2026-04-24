import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ShieldCheck,
  Pill,
  Leaf,
  Info,
  ArrowRight,
  Brain,
  HeartPulse,
} from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Safety Report — AyurSafe" },
      { name: "description", content: "Detailed AI-generated safety report for your prescription." },
    ],
  }),
  component: Results,
});

const interactions = [
  {
    a: "Ashwagandha",
    b: "Sertraline",
    severity: "moderate" as const,
    icon: Brain,
    summary:
      "Ashwagandha may potentiate serotonergic effects, slightly increasing the risk of serotonin syndrome.",
  },
  {
    a: "Brahmi",
    b: "Phenytoin",
    severity: "high" as const,
    icon: HeartPulse,
    summary:
      "Brahmi can reduce phenytoin plasma levels via CYP induction, potentially causing breakthrough seizures.",
  },
  {
    a: "Triphala",
    b: "Metformin",
    severity: "safe" as const,
    icon: ShieldCheck,
    summary: "No clinically significant interaction observed at standard doses.",
  },
];

const score = 72;
const level: "safe" | "moderate" | "high" = score >= 80 ? "safe" : score >= 50 ? "moderate" : "high";
const ringColor =
  level === "safe" ? "var(--safe)" : level === "moderate" ? "var(--warn)" : "var(--danger)";

function Results() {
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (score / 100) * circumference;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="animate-fade-up mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="glass text-primary mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            Report · Apr 24, 2026
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Safety Report</h1>
          <p className="mt-1 text-muted-foreground">
            AI analysis of 5 medications and 3 herbal supplements.
          </p>
        </div>
        <Link
          to="/recommendations"
          className="bg-gradient-primary text-primary-foreground shadow-elegant transition-smooth inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold hover:opacity-95"
        >
          View recommendations <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Score hero */}
      <section className="glass shadow-elegant animate-scale-in mb-8 grid gap-6 rounded-3xl p-8 sm:p-10 md:grid-cols-[auto_1fr] md:items-center md:gap-12">
        <div className="relative mx-auto h-48 w-48">
          <svg className="-rotate-90 h-48 w-48" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" stroke="var(--muted)" strokeWidth="14" fill="none" />
            <circle
              cx="100"
              cy="100"
              r="80"
              stroke={ringColor}
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold tracking-tight">{score}</div>
            <div className="text-sm text-muted-foreground">/ 100</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Safety Score
            </div>
          </div>
          <div
            className="absolute inset-0 -z-10 rounded-full blur-2xl opacity-40"
            style={{ background: ringColor }}
          />
        </div>

        <div>
          <RiskBadge level={level} size="lg" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Caution advised — review interactions before dispensing.
          </h2>
          <p className="mt-2 text-muted-foreground">
            We detected <b>3 potential interactions</b> across this prescription. One requires immediate
            attention. Please review the explanations and recommended substitutions below.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Safe" value={1} tone="safe" />
            <Stat label="Moderate" value={1} tone="warn" />
            <Stat label="High risk" value={1} tone="danger" />
          </div>
        </div>
      </section>

      {/* Interactions */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Detected interactions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {interactions.map((i) => {
            const tone =
              i.severity === "high"
                ? "border-danger/30 bg-danger/5"
                : i.severity === "moderate"
                  ? "border-warn/40 bg-warn/10"
                  : "border-safe/30 bg-safe/5";
            return (
              <div
                key={`${i.a}-${i.b}`}
                className={`glass shadow-card hover-lift rounded-3xl border p-6 ${tone}`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-card flex h-11 w-11 items-center justify-center rounded-xl shadow-card">
                      <i.icon className="text-foreground h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-primary inline-flex items-center gap-1 font-semibold">
                        <Leaf className="h-3.5 w-3.5" /> {i.a}
                      </span>
                      <span className="text-muted-foreground">×</span>
                      <span className="text-trust inline-flex items-center gap-1 font-semibold">
                        <Pill className="h-3.5 w-3.5" /> {i.b}
                      </span>
                    </div>
                  </div>
                  <RiskBadge level={i.severity} size="sm" />
                </div>
                <p className="text-sm text-foreground/80">{i.summary}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Explanation */}
      <section className="glass shadow-card rounded-3xl p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-primary/12 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
            <Info className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <h2 className="text-lg font-semibold">Why is this risky?</h2>
        </div>
        <ul className="space-y-3 text-sm text-foreground/85">
          <li className="flex gap-3">
            <AlertTriangle className="text-danger mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <b>Brahmi + Phenytoin:</b> Brahmi induces hepatic CYP3A4, accelerating phenytoin
              metabolism. Plasma levels can fall below the therapeutic window within 2 weeks.
            </span>
          </li>
          <li className="flex gap-3">
            <AlertTriangle className="text-warn mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <b>Ashwagandha + Sertraline:</b> Both modulate serotonergic pathways. Combined use
              warrants monitoring for tremor, agitation, or hyperreflexia.
            </span>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="text-safe mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <b>Triphala + Metformin:</b> Co-administration is well-tolerated. Some studies suggest
              modest glycemic benefit.
            </span>
          </li>
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "safe" | "warn" | "danger" }) {
  const cls = {
    safe: "bg-safe/15 text-safe",
    warn: "bg-warn/20 text-warn-foreground",
    danger: "bg-danger/15 text-danger",
  }[tone];
  return (
    <div className={`rounded-2xl px-3 py-3 text-center ${cls}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-80">{label}</div>
    </div>
  );
}
