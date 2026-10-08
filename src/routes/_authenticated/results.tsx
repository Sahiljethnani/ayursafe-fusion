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
import { summarizeClinicalRisk } from "@/lib/medical";
import { HdiEvidenceSummary } from "@/components/HdiEvidenceSummary";
import { PatientContext } from "@/components/PatientContext";
import { sanitizeAgeNotes } from "@/lib/ageContext";
import { isEvidenceHerb, evidenceStatus, HDI_SOURCE_LABEL } from "@/lib/hdi";
import { EvidenceChip } from "@/components/EvidenceChip";
import { EvidenceChainGraph } from "@/components/EvidenceChainGraph";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
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
  const [showGraph, setShowGraph] = useState(false);

  const graphHerbs = useMemo(
    () =>
      Array.from(
        new Set(
          (report?.medicines ?? [])
            .filter((m) => m.kind === "herb" || isEvidenceHerb(m.canonical ?? m.raw))
            .map((m) => m.canonical ?? m.raw),
        ),
      ),
    [report],
  );
  const graphDrugs = useMemo(
    () =>
      Array.from(
        new Set(
          (report?.medicines ?? [])
            .filter((m) => m.kind !== "herb" && !isEvidenceHerb(m.canonical ?? m.raw))
            .map((m) => m.canonical ?? m.raw),
        ),
      ),
    [report],
  );


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

  const clin = useMemo(() => (report ? summarizeClinicalRisk(report.interactions, report.unidentified?.length ?? 0) : null), [report]);
  const ringColor = useMemo(() => {
    if (!clin) return "var(--muted)";
    return clin.level === "safe"
      ? "var(--safe)"
      : clin.level === "moderate"
        ? "var(--warn)"
        : "var(--danger)";
  }, [clin]);

  if (!report || !clin) {
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
    moderate: clin.clinical.filter((i) => i.severity === "moderate").length,
    high: clin.clinical.filter((i) => i.severity === "high").length,
  };

  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (clin.score / 100) * circumference;

  const statusLevel: "safe" | "moderate" | "high" =
    counts.high > 0 ? "high" : counts.moderate > 0 ? "moderate" : "safe";
  const headline =
    statusLevel === "high"
      ? "High drug–drug risk — review urgently before dispensing."
      : statusLevel === "moderate"
        ? "Clinical review recommended — moderate drug–drug findings present."
        : "No major clinical risk detected from drug–drug / drug–condition findings.";
  const warnings = sanitizeAgeNotes(report.warnings, report.patient.age);

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
            <div className="text-5xl font-bold tracking-tight">{clin.score}</div>
            <div className="text-sm text-muted-foreground">/ 100</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Clinical Risk Score
            </div>
          </div>
          <div
            className="absolute inset-0 -z-10 rounded-full blur-2xl opacity-40"
            style={{ background: ringColor }}
          />
        </div>

        <div>
          <p className="text-muted-foreground mb-2 text-[11px] font-bold uppercase tracking-wider">Clinical Risk Summary</p>
          <RiskBadge level={statusLevel} size="lg" variant="clinical" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{headline}</h2>
          <p className="mt-2 text-muted-foreground">{clin.explanation}</p>
          <p className="text-muted-foreground mt-1 text-xs">The score covers drug–drug and drug–condition findings only. Herb–drug evidence findings are reported separately using evidence status and evidence level.</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Evidence-based HDI" value={clin.hdiConfirmed} tone="safe" />
            <Stat label="Moderate DDI" value={counts.moderate} tone="warn" />
            <Stat label="High-risk DDI" value={counts.high} tone="danger" />
          </div>
          {clin.breakdown.length > 0 && (
            <p className="text-muted-foreground mt-4 text-xs">
              How this score was calculated (drug–drug / drug–condition only): {clin.breakdown.join(" · ")}
            </p>
          )}
        </div>
      </section>

      {/* Warnings */}
      {warnings.length > 0 && (
        <section className="glass border-warn/40 bg-warn/10 shadow-card mb-8 rounded-3xl border p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="text-warn-foreground h-4 w-4" />
            <h2 className="text-sm font-semibold">Analysis notes</h2>
          </div>
          <ul className="space-y-2 text-sm text-foreground/85">
            {warnings.map((w, i) => (
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

      {/* Knowledge graph */}
      <section className="mb-8">
        <button
          onClick={() => setShowGraph((v) => !v)}
          className="glass shadow-card transition-smooth hover-lift mb-4 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
        >
          <Network className="text-primary h-4 w-4" />
          {showGraph ? "Hide Interaction Knowledge Graph" : "View Interaction Knowledge Graph"}
        </button>
        {showGraph && (
          <div className="animate-fade-up">
            <KnowledgeGraph herbs={graphHerbs} drugs={graphDrugs} />
            <EvidenceChainGraph herbs={graphHerbs} drugs={graphDrugs} />
          </div>
        )}
      </section>



      <HdiEvidenceSummary herbs={graphHerbs} drugs={graphDrugs} />

      <PatientContext age={patient.age} medicineCount={report.medicines.length} />

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
            {report.interactions.filter((i) => i.kind !== "herb-drug" || i.source === "evidence-table").map((i, idx) => {
              const Icon = pickIcon(i);
              const tone = i.source === "evidence-table"
                ? "border-primary/30 bg-primary/5"
                : i.severity === "high"
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
                    {i.source === "evidence-table" && i.evidence ? (
                      <EvidenceChip ev={i.evidence} />
                    ) : (
                      <RiskBadge level={i.severity} size="sm" />
                    )}
                  </div>
                  {i.source === "evidence-table" && i.evidence ? (
                    <dl className="grid gap-1.5 text-xs sm:grid-cols-[120px_1fr]">
                      <dt className="text-muted-foreground">Herb</dt><dd>{i.evidence.herb}{i.evidence.botanical ? ` (${i.evidence.botanical})` : ""}</dd>
                      <dt className="text-muted-foreground">Drug</dt><dd>{i.evidence.drug}</dd>
                      <dt className="text-muted-foreground">Mechanism</dt><dd>{i.evidence.mechanism}</dd>
                      <dt className="text-muted-foreground">Direction</dt><dd>{i.evidence.direction}</dd>
                      <dt className="text-muted-foreground">Clinical outcome</dt><dd>{i.evidence.outcome}</dd>
                      <dt className="text-muted-foreground">Evidence level</dt><dd>{i.evidence.evidenceLevel}</dd>
                      <dt className="text-muted-foreground">Evidence source</dt><dd>{HDI_SOURCE_LABEL}</dd>
                      <dt className="text-muted-foreground">Record</dt><dd>{i.evidence.id}</dd>
                      <dt className="text-muted-foreground">References</dt><dd>{i.evidence.references}</dd>
                    </dl>
                  ) : (
                  <p className="text-sm text-foreground/80">{i.summary}</p>
                  )}
                  <p className="mt-3 text-sm font-medium">
                    <span className="text-muted-foreground">Action: </span>
                    {i.advice}
                  </p>
                  <div className="text-muted-foreground mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
                    <span>{i.kind === "drug-drug" ? "Drug-Drug Interaction" : i.kind === "herb-drug" ? "Herb-Drug Interaction (evidence table)" : i.kind.replace("-", " ")}</span>
                    <span>·</span>
                    <span>{i.source === "evidence-table" ? `Master HDI Evidence Table · Record ${i.evidence?.id ?? ""}` : i.source === "knowledge-base" ? "Knowledge base" : "AI clinical review"}</span>
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
            {report.interactions.filter((i) => i.kind !== "herb-drug" || i.source === "evidence-table").map((i, idx) => {
              const isHdi = i.source === "evidence-table";
              const Icon = i.severity === "safe" ? ShieldCheck : AlertTriangle;
              const color = isHdi
                ? "text-primary"
                : i.severity === "high"
                  ? "text-danger"
                  : i.severity === "moderate"
                    ? "text-warn-foreground"
                    : "text-safe";
              return (
                <li key={`${i.a}-${i.b}-${idx}-x`} className="flex gap-3">
                  <Icon className={`${color} mt-0.5 h-4 w-4 shrink-0`} />
                  <span>
                    <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider">
                      {isHdi ? "Herb-Drug Interaction — Master HDI Evidence Table" : i.kind === "drug-condition" ? "Drug-Condition Interaction — AI clinical review" : "Drug-Drug Interaction — AI clinical review"}
                    </span>
                    <b>
                      {i.a} + {i.b}:
                    </b>{" "}
                    {i.source === "evidence-table" && i.evidence
                      ? `${evidenceStatus(i.evidence)} (Evidence ${i.evidence.evidenceLevel}, Record ${i.evidence.id}). ${i.evidence.mechanism} ${i.evidence.outcome}`
                      : `${i.severity === "high" ? "High Risk" : i.severity === "moderate" ? "Moderate Risk" : "Low Risk"}. ${i.summary}`}
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
