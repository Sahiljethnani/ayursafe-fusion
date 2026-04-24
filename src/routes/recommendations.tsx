import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, AlertOctagon, Sparkles, ArrowRight, Leaf, Pill } from "lucide-react";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "Recommendations — AyurSafe" },
      { name: "description", content: "AI-suggested safer alternatives and combinations." },
    ],
  }),
  component: Recommendations,
});

const safe = [
  { a: "Triphala", b: "Metformin", note: "Well-tolerated; supports glycemic balance." },
  { a: "Turmeric (low dose)", b: "Atorvastatin", note: "Below 1g/day shows no clinical interaction." },
  { a: "Tulsi", b: "Lisinopril", note: "Safe at culinary doses." },
];

const unsafe = [
  {
    a: "Brahmi",
    b: "Phenytoin",
    note: "Reduces phenytoin levels — risk of seizure breakthrough.",
  },
  {
    a: "St. John's Wort",
    b: "Warfarin",
    note: "Significantly reduces anticoagulant effect.",
  },
];

const alternatives = [
  { from: "Brahmi", to: "Mandukaparni (Centella asiatica)", reason: "Similar nootropic benefit, no CYP induction." },
  { from: "Ashwagandha", to: "Jatamansi", reason: "Calming effect without serotonergic synergy." },
];

function Recommendations() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="animate-fade-up mb-8">
        <span className="glass text-primary mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
          <Sparkles className="h-3 w-3" /> AI Recommendations
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Personalized guidance</h1>
        <p className="mt-1 text-muted-foreground">
          Curated combinations and safer alternatives based on your prescription.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <CheckCircle2 className="text-safe h-5 w-5" /> Safe combinations
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {safe.map((s) => (
            <div
              key={`${s.a}-${s.b}`}
              className="glass border-safe/30 bg-safe/5 shadow-card hover-lift rounded-3xl border p-6"
            >
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <span className="text-primary inline-flex items-center gap-1">
                  <Leaf className="h-3.5 w-3.5" /> {s.a}
                </span>
                <span className="text-muted-foreground">+</span>
                <span className="text-trust inline-flex items-center gap-1">
                  <Pill className="h-3.5 w-3.5" /> {s.b}
                </span>
              </div>
              <p className="text-sm text-foreground/80">{s.note}</p>
              <div className="text-safe mt-4 inline-flex items-center gap-1 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Recommended
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <AlertOctagon className="text-danger h-5 w-5" /> Unsafe combinations
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {unsafe.map((s) => (
            <div
              key={`${s.a}-${s.b}`}
              className="glass border-danger/30 bg-danger/5 shadow-card hover-lift rounded-3xl border p-6"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-primary inline-flex items-center gap-1">
                    <Leaf className="h-3.5 w-3.5" /> {s.a}
                  </span>
                  <span className="text-muted-foreground">+</span>
                  <span className="text-trust inline-flex items-center gap-1">
                    <Pill className="h-3.5 w-3.5" /> {s.b}
                  </span>
                </div>
                <span className="bg-danger/15 text-danger rounded-full px-2.5 py-1 text-xs font-semibold">
                  Avoid
                </span>
              </div>
              <p className="text-sm text-foreground/80">{s.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="text-primary h-5 w-5" /> Alternative suggestions
        </h2>
        <div className="glass shadow-card divide-border/60 divide-y rounded-3xl">
          {alternatives.map((a) => (
            <div
              key={a.from}
              className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-1 items-center gap-3 text-sm">
                <div className="bg-danger/10 text-danger rounded-xl px-3 py-1.5 font-semibold">
                  {a.from}
                </div>
                <ArrowRight className="text-muted-foreground h-4 w-4 shrink-0" />
                <div className="bg-safe/15 text-safe rounded-xl px-3 py-1.5 font-semibold">
                  {a.to}
                </div>
              </div>
              <p className="text-sm text-muted-foreground sm:max-w-md sm:text-right">{a.reason}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
