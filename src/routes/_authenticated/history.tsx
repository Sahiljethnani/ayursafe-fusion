import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileText, Search, Upload, Trash2 } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { useState } from "react";
import { useReports, deleteAllReports } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — AyurSafe" },
      { name: "description", content: "Your previous AyurSafe safety reports." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { reports, refresh } = useReports();
  const [q, setQ] = useState("");

  const filtered = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      r.fileName.toLowerCase().includes(q.toLowerCase()),
  );

  const handleClear = async () => {
    if (!confirm("Clear all history? This cannot be undone.")) return;
    const { error } = await deleteAllReports();
    if (error) {
      toast.error("Could not clear history. Please try again.");
      return;
    }
    refresh();
    toast.success("History cleared.");
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="animate-fade-up mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Report history</h1>
          <p className="mt-1 text-muted-foreground">
            All your past safety reports in one place. {reports.length > 0 && `(${reports.length} total)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="glass shadow-card flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 sm:w-72">
            <Search className="text-muted-foreground h-4 w-4" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search reports…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          {reports.length > 0 && (
            <button
              onClick={handleClear}
              title="Clear history"
              className="glass shadow-card hover:text-danger transition-smooth text-muted-foreground rounded-xl p-2.5"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="glass shadow-card animate-scale-in rounded-3xl p-12 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
            <FileText className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">No reports yet</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Once you analyze a prescription, your reports will appear here.
          </p>
          <Link
            to="/upload"
            className="bg-gradient-primary text-primary-foreground shadow-elegant transition-smooth mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-95"
          >
            <Upload className="h-4 w-4" /> Upload prescription
          </Link>
        </div>
      ) : (
        <div className="glass shadow-card divide-border/60 divide-y rounded-3xl">
          {filtered.map((r) => (
            <Link
              key={r.id}
              to="/results"
              search={{ id: r.id }}
              className="hover:bg-muted/40 transition-smooth group flex items-center gap-4 px-5 py-4 first:rounded-t-3xl last:rounded-b-3xl sm:px-6 sm:py-5"
            >
              <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                <FileText className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold sm:text-base">{r.title}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {r.date} · {r.fileName}
                </div>
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
            <div className="text-muted-foreground p-10 text-center text-sm">
              No reports match your search.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
