import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Leaf,
  Pill,
  AlertOctagon,
  Eye,
  Upload,
  ClipboardList,
} from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { getReport, getReports, type Report } from "@/lib/store";

export const Route = createFileRoute("/recommendations")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? (search.id as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Recommendations — AyurSafe" },
      { name: "description", content: "AI-suggested clinical actions and safer alternatives for your prescription." },
      { property: "og:title", content: "Recommendations — AyurSafe" },
      { property: "og:description", content: "Actions, monitoring advice and safer alternatives from your latest analysis." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Recommendations,
});

function Recommendations() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    setReport(id ? getReport(id) : (getReports()[0] ?? null));
  }, [id]);

  if (!report) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-10">
        <div className="glass shadow-elegant rounded-3xl p-10 text-center">
          <div className="bg-gradient-primary shadow-glow mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
            <ClipboardList className="text-primary-foreground h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">No recommendations yet</h1>
          <p className="mt-2 text-muted-foreground">
            Analyze a prescription and personalized guidance will appear here.
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

  const actions = report.recommendations.filter((r) => r.kind === "action");
  const monitors = report.recommendations.filter((r) => r.kind === "monitor");
  const alternatives = report.recommendations.filter((r) => r.kind === "alternative");
  const safePairs = report.interactions.filter((i) => i.severity === "safe");

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="animate-fade-up mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="glass text-primary mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3 w-3" /> AI Recommendations · {report.date}
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Personalized guidance</h1>
          <p className="mt-1 text-muted-foreground">
            Based on <b>{report.fileName}</b> · {report.medicines.length} medicine
            {report.medicines.length === 1 ? "" : "s"} reviewed.
          </p>
        </div>
        <Link
          to="/results"
          search={{ id: report.id }}
          className="glass shadow-card transition-smooth inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold hover:opacity-90"
        >
          Back to report <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {report.recommendations.length === 0 && safePairs.length === 0 && (
        <div className="glass border-safe/30 bg-safe/5 shadow-card rounded-3xl border p-10 text-center">
          <CheckCircle2 className="text-safe mx-auto mb-3 h-8 w-8" />
          <h2 className="text-lg font-semibold">No changes recommended</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            This prescription raised no interaction flags, so no substitutions or extra monitoring are
            suggested.
          </p>
        </div>
      )}

      {actions.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <AlertOctagon className="text-danger h-5 w-5" /> Immediate actions
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {actions.map((r, i) => (
              <div
                key={`${r.title}-${i}`}
                className="glass border-danger/30 bg-danger/5 shadow-card hover-lift rounded-3xl border p-6"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold">{r.title}</h3>
                  <RiskBadge level={r.severity} size="sm" />
                </div>
                <p className="text-sm text-foreground/80">{r.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {monitors.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Eye className="text-warn-foreground h-5 w-5" /> Monitor closely
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {monitors.map((r, i) => (
              <div
                key={`${r.title}-${i}`}
                className="glass border-warn/40 bg-warn/10 shadow-card hover-lift rounded-3xl border p-6"
              >
                <h3 className="mb-2 text-sm font-semibold">{r.title}</h3>
                <p className="text-sm text-foreground/80">{r.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {alternatives.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="text-primary h-5 w-5" /> Safer alternatives
          </h2>
          <div className="glass shadow-card divide-border/60 divide-y rounded-3xl">
            {alternatives.map((r, i) => (
              <div
                key={`${r.title}-${i}`}
                className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="bg-safe/15 text-safe rounded-xl px-3 py-1.5 text-sm font-semibold">
                  {r.title}
                </div>
                <p className="text-sm text-muted-foreground sm:max-w-xl sm:text-right">{r.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {safePairs.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <CheckCircle2 className="text-safe h-5 w-5" /> Combinations reviewed as safe
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {safePairs.map((s, i) => (
              <div
                key={`${s.a}-${s.b}-${i}`}
                className="glass border-safe/30 bg-safe/5 shadow-card hover-lift rounded-3xl border p-6"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span className="text-primary inline-flex items-center gap-1">
                    <Leaf className="h-3.5 w-3.5" /> {s.a}
                  </span>
                  <span className="text-muted-foreground">+</span>
                  <span className="text-trust inline-flex items-center gap-1">
                    <Pill className="h-3.5 w-3.5" /> {s.b}
                  </span>
                </div>
                <p className="text-sm text-foreground/80">{s.summary}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
