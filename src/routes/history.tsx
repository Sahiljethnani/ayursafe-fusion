import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileText, Search } from "lucide-react";
import { RiskBadge, type RiskLevel } from "@/components/RiskBadge";
import { useState } from "react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — AyurSafe" },
      { name: "description", content: "Your previous AyurSafe safety reports." },
    ],
  }),
  component: HistoryPage,
});

const reports: { id: string; title: string; date: string; level: RiskLevel; score: number }[] = [
  { id: "1", title: "Ashwagandha + Sertraline panel", date: "Apr 24, 2026", level: "moderate", score: 72 },
  { id: "2", title: "Triphala + Metformin review", date: "Apr 23, 2026", level: "safe", score: 91 },
  { id: "3", title: "Brahmi + Phenytoin assessment", date: "Apr 22, 2026", level: "high", score: 38 },
  { id: "4", title: "Tulsi + Lisinopril check", date: "Apr 18, 2026", level: "safe", score: 88 },
  { id: "5", title: "St. John's Wort + Warfarin", date: "Apr 14, 2026", level: "high", score: 22 },
  { id: "6", title: "Turmeric + Atorvastatin", date: "Apr 09, 2026", level: "moderate", score: 64 },
];

function HistoryPage() {
  const [q, setQ] = useState("");
  const filtered = reports.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="animate-fade-up mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Report history</h1>
          <p className="mt-1 text-muted-foreground">All your past safety reports in one place.</p>
        </div>
        <div className="glass shadow-card flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 sm:w-72">
          <Search className="text-muted-foreground h-4 w-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reports…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="glass shadow-card divide-border/60 divide-y rounded-3xl">
        {filtered.map((r) => (
          <Link
            key={r.id}
            to="/results"
            className="hover:bg-muted/40 transition-smooth group flex items-center gap-4 px-5 py-4 first:rounded-t-3xl last:rounded-b-3xl sm:px-6 sm:py-5"
          >
            <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <FileText className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold sm:text-base">{r.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{r.date}</div>
            </div>
            <div className="hidden text-right sm:block">
              <div className="text-xl font-bold leading-none">{r.score}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Score
              </div>
            </div>
            <RiskBadge level={r.level} size="sm" />
            <ChevronRight className="text-muted-foreground group-hover:text-foreground h-4 w-4 shrink-0" />
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-muted-foreground p-10 text-center text-sm">No reports match your search.</div>
        )}
      </div>
    </main>
  );
}
