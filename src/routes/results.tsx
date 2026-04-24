import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ShieldCheck,
  Pill,
  Leaf,
  Info,
  ArrowRight,
  Brain,
  HeartPulse,
  Network,
  Sparkles,
  Upload,
} from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { getReport, getReports, type Interaction, type Report } from "@/lib/store";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/results")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? (search.id as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Safety Report — AyurSafe" },
      { name: "description", content: "Detailed AI-generated safety report for your prescription." },
    ],
  }),
  component: Results,
});

function pickIcon(i: Interaction) {
  if (i.severity === "high") return HeartPulse;
  if (i.severity === "moderate") return Brain;
  return ShieldCheck;
}

function Results() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    const r = id ? getReport(id) : getReports()[0] ?? null;
    setReport(r);
  }, [id]);

  const ringColor = useMemo(() => {
    if (!report) return "var(--muted)";
    return report.level === "safe"
      ? "var(--safe)"
      : report.level === "moderate"
        ? "var(--warn)"
        : "var(--danger)";
  }, [report]);

  if (!report) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-10">
        <div className="glass shadow-elegant rounded-3xl p-10 text-center">
          <div className="bg-gradient-primary shadow-glow mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
            <Network className="text-primary-foreground h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">No report yet</h1>
          <p className="mt-2 text-muted-foreground">
            Upload a prescription to generate your first AI safety report.
          </p>
          <button
            onClick={() => navigate({ to: "/upload" })}
            className="bg-gradient-primary text-primary-foreground shadow-elegant transition-smooth mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-95"
          >
            <Upload className="h-4 w-4" /> Upload prescription
          </button>
        </div>
      </main>
    );
  }

  const counts = {
    safe: report.interactions.filter((i) => i.severity === "safe").length,
    moderate: report.interactions.filter((i) => i.severity === "moderate").length,
    high: report.interactions.filter((i) => i.severity === "high").length,
  };

  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (report.score / 100) * circumference;

  const headline =
    report.level === "high"
      ? "High risk — review urgently before dispensing."
      : report.level === "moderate"
        ? "Caution advised — review interactions before dispensing."
        : "Looks safe — no major interactions detected.";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="animate-fade-up mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="glass text-primary mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3 w-3" /> Report · {report.date}
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Safety Report</h1>
          <p className="mt-1 text-muted-foreground">
            AI analysis of <b>{report.fileName}</b> · {report.interactions.length} interaction
            {report.interactions.length === 1 ? "" : "s"} reviewed.
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
            <div className="text-5xl font-bold tracking-tight">{report.score}</div>
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
          <RiskBadge level={report.level} size="lg" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{headline}</h2>
          <p className="mt-2 text-muted-foreground">{report.explanation}</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Safe" value={counts.safe} tone="safe" />
            <Stat label="Moderate" value={counts.moderate} tone="warn" />
            <Stat label="High risk" value={counts.high} tone="danger" />
          </div>
        </div>
      </section>

      {/* Interactions */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Detected interactions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {report.interactions.map((i, idx) => {
            const Icon = pickIcon(i);
            const tone =
              i.severity === "high"
                ? "border-danger/30 bg-danger/5"
                : i.severity === "moderate"
                  ? "border-warn/40 bg-warn/10"
                  : "border-safe/30 bg-safe/5";
            return (
              <div
                key={`${i.a}-${i.b}-${idx}`}
                className={`glass shadow-card hover-lift rounded-3xl border p-6 ${tone}`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-card flex h-11 w-11 items-center justify-center rounded-xl shadow-card">
                      <Icon className="text-foreground h-5 w-5" strokeWidth={2.2} />
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
          {report.interactions.map((i, idx) => {
            const Icon =
              i.severity === "high" ? AlertTriangle : i.severity === "moderate" ? AlertTriangle : ShieldCheck;
            const color =
              i.severity === "high"
                ? "text-danger"
                : i.severity === "moderate"
                  ? "text-warn-foreground"
                  : "text-safe";
            return (
              <li key={`${i.a}-${i.b}-${idx}-x`} className="flex gap-3">
                <Icon className={`${color} mt-0.5 h-4 w-4 shrink-0`} />
                <span>
                  <b>
                    {i.a} + {i.b}:
                  </b>{" "}
                  {i.summary}
                </span>
              </li>
            );
          })}
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
