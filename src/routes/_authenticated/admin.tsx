import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ShieldAlert,
  Users,
  FileText,
  Activity,
  Search,
  ChevronRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import {
  checkIsAdmin,
  getAdminOverview,
  listPatients,
  getPatientReports,
  type AdminOverview,
  type AdminPatient,
  type AdminPatientReport,
} from "@/lib/admin.functions";
import type { RiskLevel } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — AyurSafe" },
      { name: "description", content: "AyurSafe administrator overview of patients, prescriptions and risk statistics." },
      { property: "og:title", content: "Admin dashboard — AyurSafe" },
      { property: "og:description", content: "Administrator overview of patients, prescriptions and risk statistics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function asLevel(level: string | null): RiskLevel {
  return level === "high" || level === "moderate" ? level : "safe";
}

function fmt(ts: string | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminPage() {
  const isAdminFn = useServerFn(checkIsAdmin);
  const overviewFn = useServerFn(getAdminOverview);
  const patientsFn = useServerFn(listPatients);
  const reportsFn = useServerFn(getPatientReports);

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [selected, setSelected] = useState<AdminPatient | null>(null);
  const [patientReports, setPatientReports] = useState<AdminPatientReport[] | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { isAdmin } = await isAdminFn({});
      setAllowed(isAdmin);
      if (!isAdmin) return;
      const [o, p] = await Promise.all([overviewFn({}), patientsFn({ data: {} })]);
      setOverview(o);
      setPatients(p);
    } catch {
      setError("Could not load admin data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isAdminFn, overviewFn, patientsFn]);

  useEffect(() => {
    void load();
  }, [load]);

  const openPatient = async (p: AdminPatient) => {
    setSelected(p);
    setPatientReports(null);
    setReportsLoading(true);
    try {
      setPatientReports(await reportsFn({ data: { userId: p.id } }));
    } catch {
      setPatientReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return patients;
    return patients.filter(
      (p) =>
        (p.email ?? "").toLowerCase().includes(needle) ||
        (p.fullName ?? "").toLowerCase().includes(needle) ||
        p.id.toLowerCase().includes(needle),
    );
  }, [patients, q]);

  if (loading) {
    return (
      <main className="mx-auto flex max-w-6xl items-center justify-center px-4 py-24">
        <Loader2 className="text-primary h-6 w-6 animate-spin" />
      </main>
    );
  }

  if (allowed === false) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24">
        <div className="glass shadow-card rounded-3xl p-10 text-center">
          <div className="bg-danger/10 text-danger mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Access denied</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            This area is restricted to AyurSafe administrators.
          </p>
          <Link
            to="/dashboard"
            className="bg-gradient-primary text-primary-foreground shadow-elegant transition-smooth mt-7 inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-95"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-muted-foreground text-sm">{error}</p>
        <button
          onClick={() => void load()}
          className="bg-gradient-primary text-primary-foreground mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          Retry
        </button>
      </main>
    );
  }

  if (selected) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <button
          onClick={() => setSelected(null)}
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> All patients
        </button>

        <div className="glass shadow-card rounded-3xl p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{selected.fullName ?? "Patient"}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{selected.email ?? selected.id}</p>
          <div className="text-muted-foreground mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
            <div>
              <div className="text-foreground text-lg font-bold">{selected.reportCount}</div>
              Prescriptions
            </div>
            <div>
              <div className="text-foreground text-sm font-semibold">{fmt(selected.createdAt)}</div>
              Account created
            </div>
            <div>
              <div className="text-foreground text-sm font-semibold">{fmt(selected.lastActivity)}</div>
              Latest activity
            </div>
            <div>
              <div className="text-foreground text-sm font-semibold">{selected.isAdmin ? "Admin" : "Patient"}</div>
              Role
            </div>
          </div>
        </div>

        <h2 className="mt-8 mb-3 text-lg font-semibold">Prescription history</h2>
        {reportsLoading ? (
          <div className="glass shadow-card flex justify-center rounded-3xl p-10">
            <Loader2 className="text-primary h-5 w-5 animate-spin" />
          </div>
        ) : !patientReports || patientReports.length === 0 ? (
          <div className="glass shadow-card text-muted-foreground rounded-3xl p-10 text-center text-sm">
            This patient has not uploaded any prescriptions yet.
          </div>
        ) : (
          <div className="glass shadow-card divide-border/60 divide-y rounded-3xl">
            {patientReports.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{r.title}</div>
                  <div className="text-muted-foreground mt-0.5 truncate text-xs">
                    {fmt(r.createdAt)} · {r.fileName ?? "file"} · {r.medicines.length} medicines ·{" "}
                    {r.interactionCount} findings
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-lg font-bold leading-none">{r.score ?? "—"}</div>
                  <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                    Score
                  </div>
                </div>
                <RiskBadge level={asLevel(r.level)} size="sm" />
              </div>
            ))}
          </div>
        )}
      </main>
    );
  }

  const stats = [
    { label: "Registered users", value: overview?.totalUsers ?? 0, icon: Users },
    { label: "Prescriptions", value: overview?.totalPrescriptions ?? 0, icon: FileText },
    { label: "Analyses completed", value: overview?.totalAnalyses ?? 0, icon: Activity },
    { label: "High-risk reports", value: overview?.highRisk ?? 0, icon: ShieldAlert },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="animate-fade-up mb-8">
        <span className="glass text-primary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
          <ShieldAlert className="h-3.5 w-3.5" /> Administrator
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Admin dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Platform-wide overview of patients, prescriptions and interaction risk.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass shadow-card rounded-2xl p-5">
            <div className="bg-primary/10 text-primary mb-3 flex h-10 w-10 items-center justify-center rounded-xl">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-muted-foreground text-xs font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "High risk", value: overview?.highRisk ?? 0, level: "high" as RiskLevel },
          { label: "Moderate risk", value: overview?.moderateRisk ?? 0, level: "moderate" as RiskLevel },
          { label: "Safe / no interaction", value: overview?.safeRisk ?? 0, level: "safe" as RiskLevel },
        ].map((s) => (
          <div key={s.label} className="glass shadow-card flex items-center justify-between rounded-2xl p-5">
            <div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-muted-foreground text-xs font-medium">{s.label}</div>
            </div>
            <RiskBadge level={s.level} size="sm" />
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Patients</h2>
            <div className="glass shadow-card flex w-full max-w-xs items-center gap-2 rounded-xl px-3.5 py-2.5">
              <Search className="text-muted-foreground h-4 w-4" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name or email…"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="glass shadow-card divide-border/60 divide-y rounded-3xl">
            {filtered.length === 0 ? (
              <div className="text-muted-foreground p-10 text-center text-sm">No patients match your search.</div>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => void openPatient(p)}
                  className="hover:bg-muted/40 transition-smooth group flex w-full items-center gap-4 px-5 py-4 text-left first:rounded-t-3xl last:rounded-b-3xl sm:px-6"
                >
                  <div className="from-primary to-trust text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold">
                    {(p.fullName ?? p.email ?? "A").trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {p.fullName ?? "Unnamed"}{" "}
                      {p.isAdmin && (
                        <span className="bg-primary/10 text-primary ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase">
                          admin
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground truncate text-xs">{p.email ?? p.id}</div>
                  </div>
                  <div className="hidden text-right text-xs sm:block">
                    <div className="text-foreground text-sm font-bold">{p.reportCount}</div>
                    <div className="text-muted-foreground">reports</div>
                  </div>
                  <div className="text-muted-foreground hidden w-40 text-right text-xs md:block">
                    {fmt(p.lastActivity)}
                  </div>
                  <ChevronRight className="text-muted-foreground group-hover:text-foreground h-4 w-4 shrink-0" />
                </button>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Recent uploads</h2>
          <div className="glass shadow-card divide-border/60 divide-y rounded-3xl">
            {(overview?.recent ?? []).length === 0 ? (
              <div className="text-muted-foreground p-10 text-center text-sm">No uploads yet.</div>
            ) : (
              (overview?.recent ?? []).map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{r.title}</div>
                    <div className="text-muted-foreground truncate text-xs">
                      {r.userEmail ?? "—"} · {fmt(r.createdAt)}
                    </div>
                  </div>
                  <RiskBadge level={asLevel(r.level)} size="sm" />
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
