import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Upload,
  GitCompare,
  History,
  TrendingUp,
  Activity,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { useSession, useReports } from "@/lib/store";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AyurSafe" },
      { name: "description", content: "Your AyurSafe dashboard with quick stats and recent activity." },
    ],
  }),
  component: Dashboard,
});

const actions = [
  {
    to: "/upload",
    icon: Upload,
    title: "Upload Prescription",
    desc: "Drag & drop or scan a prescription for AI analysis.",
    accent: "from-primary to-primary-glow",
  },
  {
    to: "/upload",
    icon: GitCompare,
    title: "Check Interaction",
    desc: "Run a manual herb-drug interaction check.",
    accent: "from-trust to-primary",
  },
  {
    to: "/history",
    icon: History,
    title: "View History",
    desc: "Browse all your past safety reports & insights.",
    accent: "from-primary-glow to-trust",
  },
] as const;

function Dashboard() {
  const session = useSession();
  const { reports } = useReports();


  const lastScore = reports[0]?.score;
  const reportsThisWeek = reports.filter(
    (r) => Date.now() - r.createdAt < 7 * 24 * 60 * 60 * 1000,
  ).length;
  const totalInteractions = reports.reduce((s, r) => s + r.interactions.length, 0);
  const highRiskCount = reports.reduce(
    (s, r) => s + r.interactions.filter((i) => i.severity === "high").length,
    0,
  );
  const recent = reports.slice(0, 5);
  const firstName = (session?.name ?? "there").split(" ")[0];

  const formatWhen = (ts: number) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d === 1) return "Yesterday";
    return `${d} days ago`;
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Welcome */}
      <section className="animate-fade-up mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="glass text-primary mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3 w-3" /> AI ready
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Hi {firstName} <span className="inline-block animate-pulse">👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Here's a snapshot of your recent prescription analyses.
          </p>
        </div>
        <Link
          to="/upload"
          className="bg-gradient-primary shadow-elegant transition-smooth inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-95"
        >
          <Upload className="h-4 w-4" /> Start new analysis
        </Link>
      </section>

      {/* Quick stats */}
      <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={ShieldCheck}
          label="Last safety score"
          value={lastScore !== undefined ? String(lastScore) : "—"}
          suffix="/100"
          trend={reports.length > 0 ? `${reports.length} total` : "No reports yet"}
          tone="primary"
        />
        <StatCard
          icon={Activity}
          label="Reports this week"
          value={String(reportsThisWeek)}
          trend={`${reports.length} all-time`}
          tone="trust"
        />
        <StatCard
          icon={TrendingUp}
          label="Interactions caught"
          value={String(totalInteractions)}
          trend={`${highRiskCount} high-risk`}
          tone="danger"
        />
      </section>

      {/* Action cards */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Quick actions</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {actions.map((a) => (
            <Link
              key={a.title}
              to={a.to}
              className="glass shadow-card hover-lift group relative overflow-hidden rounded-3xl p-6"
            >
              <div
                className={`bg-gradient-to-br ${a.accent} mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-glow`}
              >
                <a.icon className="text-primary-foreground h-6 w-6" strokeWidth={2.2} />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{a.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{a.desc}</p>
              <ArrowUpRight className="text-muted-foreground group-hover:text-primary absolute top-5 right-5 h-5 w-5 transition-smooth group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <Link to="/history" className="text-primary text-sm font-medium hover:underline">
            View all
          </Link>
        </div>
        <div className="glass shadow-card divide-border/60 divide-y rounded-2xl">
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-muted-foreground text-sm">No analyses yet.</div>
              <Link
                to="/upload"
                className="text-primary mt-2 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
              >
                Upload your first prescription <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            recent.map((r) => (
              <Link
                key={r.id}
                to="/results"
                search={{ id: r.id }}
                className="hover:bg-muted/40 transition-smooth flex items-center justify-between gap-4 px-5 py-4 first:rounded-t-2xl last:rounded-b-2xl"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{r.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{formatWhen(r.createdAt)}</div>
                </div>
                <RiskBadge level={r.level} size="sm" />
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  trend,
  tone,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  suffix?: string;
  trend: string;
  tone: "primary" | "trust" | "danger";
}) {
  const toneCls = {
    primary: "bg-primary/12 text-primary",
    trust: "bg-trust/12 text-trust",
    danger: "bg-danger/12 text-danger",
  }[tone];
  return (
    <div className="glass shadow-card hover-lift rounded-3xl p-6">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneCls}`}>
          <Icon className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{trend}</span>
      </div>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">{value}</span>
        {suffix && <span className="text-base text-muted-foreground">{suffix}</span>}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
