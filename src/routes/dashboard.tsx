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

export const Route = createFileRoute("/dashboard")({
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

const recent = [
  { id: "r1", title: "Ashwagandha + Sertraline", level: "moderate" as const, when: "2h ago" },
  { id: "r2", title: "Triphala + Metformin", level: "safe" as const, when: "Yesterday" },
  { id: "r3", title: "Brahmi + Phenytoin", level: "high" as const, when: "2 days ago" },
];

function Dashboard() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Welcome */}
      <section className="animate-fade-up mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="glass text-primary mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3 w-3" /> AI ready
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Hi Dr. Asha <span className="inline-block animate-pulse">👋</span>
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
          value="72"
          suffix="/100"
          trend="+4 vs avg"
          tone="primary"
        />
        <StatCard
          icon={Activity}
          label="Reports this week"
          value="12"
          trend="+3 vs last week"
          tone="trust"
        />
        <StatCard
          icon={TrendingUp}
          label="Interactions caught"
          value="38"
          trend="9 high-risk"
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
          {recent.map((r) => (
            <Link
              key={r.id}
              to="/results"
              className="hover:bg-muted/40 transition-smooth flex items-center justify-between gap-4 px-5 py-4 first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{r.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{r.when}</div>
              </div>
              <RiskBadge level={r.level} size="sm" />
            </Link>
          ))}
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
