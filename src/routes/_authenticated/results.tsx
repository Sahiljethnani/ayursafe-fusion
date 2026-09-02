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
  User,
  FileText,
  HelpCircle,
  Activity,
} from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { getReport, getReports, type Interaction, type Report } from "@/lib/store";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/results")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? (search.id as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Safety Report — AyurSafe" },
      { name: "description", content: "Detailed AI-generated herb-drug safety report for your prescription." },
      { property: "og:title", content: "Safety Report — AyurSafe" },
      { property: "og:description", content: "Safety score, detected interactions and clinical explanations." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Results,
});

function pickIcon(i: Interaction) {
  if (i.kind === "allergy") return AlertTriangle;
  if (i.severity === "high") return HeartPulse;
  if (i.severity === "moderate") return Brain;
  return ShieldCheck;
}

function Results() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const r = id ? await getReport(id) : ((await getReports())[0] ?? null);
      if (!active) return;
      setReport(r);
      setReady(true);
    })();
    return () => {
      active = false;
    };
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
          <h1 className="text-2xl font-bold tracking-tight">{ready ? "No report yet" : "Loading report…"}</h1>
          <p className="mt-2 text-muted-foreground">
            Upload a prescription to generate an AI safety report from its actual contents.
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

  const patient = report.patient;
  const patientBits = [
    patient.name && { label: "Patient", value: patient.name },
    patient.age && { label: "Age", value: patient.age },
    patient.gender && { label: "Gender", value: patient.gender },
    patient.diagnosis && { label: "Diagnosis", value: patient.diagnosis },
    patient.allergies.length > 0 && { label: "Allergies", value: patient.allergies.join(", ") },
    patient.prescriber && { label: "Prescriber", value: patient.prescriber },
    patient.date && { label: "Prescribed", value: patient.date },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="animate-fade-up mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="glass text-primary mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3 w-3" /> Report · {report.date}
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Safety Report</h1>
          <p className="mt-1 text-muted-foreground">
            AI analysis of <b>{report.fileName}</b> · {report.medicines.length} medicine
            {report.medicines.length === 1 ? "" : "s"} extracted · {report.interactions.length} finding
            {report.interactions.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link
          to="/recommendations"
          search={{ id: report.id }}
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
          {report.scoreBreakdown.length > 0 && (
            <p className="text-muted-foreground mt-4 text-xs">
              How this score was calculated: {report.scoreBreakdown.join(" · ")}
            </p>
          )}
        </div>
      </section>

      {/* Warnings */}
      {report.warnings.length > 0 && (
        <section className="glass border-warn/40 bg-warn/10 shadow-card mb-8 rounded-3xl border p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="text-warn-foreground h-4 w-4" />
            <h2 className="text-sm font-semibold">Analysis notes</h2>
          </div>
          <ul className="space-y-2 text-sm text-foreground/85">
            {report.warnings.map((w, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-warn-foreground">·</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Extracted prescription data */}
      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="glass shadow-card rounded-3xl p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-trust/12 text-trust flex h-10 w-10 items-center justify-center rounded-xl">
              <User className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <h2 className="text-lg font-semibold">Patient details</h2>
          </div>
          {patientBits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No patient details were printed on this prescription.
            </p>
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2">
              {patientBits.map((b) => (
                <div key={b.label}>
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {b.label}
                  </dt>
                  <dd className="text-sm font-medium">{b.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="glass shadow-card rounded-3xl p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-primary/12 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <FileText className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <h2 className="text-lg font-semibold">Extracted medicines</h2>
          </div>
          <ul className="divide-border/60 divide-y">
            {report.medicines.map((m, idx) => (
              <li key={`${m.raw}-${idx}`} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {m.kind === "herb" ? (
                      <Leaf className="text-primary h-3.5 w-3.5 shrink-0" />
                    ) : m.kind === "drug" ? (
                      <Pill className="text-trust h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <HelpCircle className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">{m.canonical ?? m.raw}</span>
                    {m.strength && <span className="text-muted-foreground font-normal">{m.strength}</span>}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {[m.dosage, m.frequency, m.route, m.duration].filter(Boolean).join(" · ") ||
                      "No dosage instructions detected"}
                    {m.canonical && m.canonical.toLowerCase() !== m.raw.toLowerCase() && (
                      <> · written as “{m.raw}”</>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    m.kind === "unknown"
                      ? "bg-muted text-muted-foreground"
                      : m.kind === "herb"
                        ? "bg-primary/12 text-primary"
                        : "bg-trust/12 text-trust"
                  }`}
                >
                  {m.kind === "unknown" ? "Unmatched" : m.kind === "herb" ? "Herbal" : "Drug"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Interactions */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Detected interactions</h2>
        {report.interactions.length === 0 ? (
          <div className="glass border-safe/30 bg-safe/5 shadow-card rounded-3xl border p-8 text-center">
            <ShieldCheck className="text-safe mx-auto mb-3 h-8 w-8" />
            <p className="text-sm font-semibold">No interactions detected</p>
            <p className="text-muted-foreground mt-1 text-sm">
              None of the extracted medicines matched a known interaction in our knowledge base or the AI
              clinical review.
            </p>
          </div>
        ) : (
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
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <SideLabel name={i.a} report={report} />
                        <span className="text-muted-foreground">×</span>
                        <SideLabel name={i.b} report={report} />
                      </div>
                    </div>
                    <RiskBadge level={i.severity} size="sm" />
                  </div>
                  <p className="text-sm text-foreground/80">{i.summary}</p>
                  <p className="mt-3 text-sm font-medium">
                    <span className="text-muted-foreground">Action: </span>
                    {i.advice}
                  </p>
                  <div className="text-muted-foreground mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
                    <span>{i.kind.replace("-", " ")}</span>
                    <span>·</span>
                    <span>{i.source === "knowledge-base" ? "Knowledge base" : "AI clinical review"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Explanation */}
      {report.interactions.length > 0 && (
        <section className="glass shadow-card rounded-3xl p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-primary/12 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <Info className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <h2 className="text-lg font-semibold">Why is this risky?</h2>
          </div>
          <ul className="space-y-3 text-sm text-foreground/85">
            {report.interactions.map((i, idx) => {
              const Icon = i.severity === "safe" ? ShieldCheck : AlertTriangle;
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
      )}

      {report.extractedText && (
        <details className="glass shadow-card mt-8 rounded-3xl p-6">
          <summary className="cursor-pointer text-sm font-semibold">View raw extracted text (OCR)</summary>
          <pre className="text-muted-foreground mt-4 max-h-80 overflow-auto whitespace-pre-wrap text-xs">
            {report.extractedText}
          </pre>
        </details>
      )}
    </main>
  );
}

function SideLabel({ name, report }: { name: string; report: Report }) {
  const med = report.medicines.find(
    (m) => (m.canonical ?? m.raw).toLowerCase() === name.toLowerCase(),
  );
  const Icon = med?.kind === "herb" ? Leaf : med?.kind === "drug" ? Pill : Activity;
  const color = med?.kind === "herb" ? "text-primary" : med?.kind === "drug" ? "text-trust" : "text-foreground/70";
  return (
    <span className={`${color} inline-flex items-center gap-1 font-semibold`}>
      <Icon className="h-3.5 w-3.5" /> {name}
    </span>
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
