import { useMemo, useState } from "react";
import { BookOpen, FlaskConical, Leaf, Pill, Search, Target, TrendingUpDown, Stethoscope, FileText, X } from "lucide-react";
import { evaluateHdi, HDI_SOURCE_LABEL, NO_MATCH_TEXT, categoryLabel, type HdiMatch } from "@/lib/hdi";

/** Biological entities are only taken when their literal token appears in the record's mechanism text. */
const ENTITY_RE = /\b(CYP\d[A-Z]\d+|P-gp|OATP\d[A-Z]\d|UGT\d[A-Z]\d+|PXR|MDR1|PAF|GABA)\b/g;
function entitiesOf(mechanism: string): string[] {
  return Array.from(new Set(mechanism.match(ENTITY_RE) ?? []));
}

type NodeKind = "herb" | "drug" | "mechanism" | "entity" | "direction" | "outcome" | "record" | "status";
type Sel = { kind: NodeKind; label: string; m: HdiMatch };

const STYLE: Record<NodeKind, { cls: string; icon: typeof Leaf; name: string }> = {
  herb: { cls: "border-safe/40 bg-safe/10 text-safe", icon: Leaf, name: "Herb" },
  drug: { cls: "border-primary/40 bg-primary/10 text-primary", icon: Pill, name: "Conventional medicine" },
  mechanism: { cls: "border-accent/50 bg-accent/15 text-accent-foreground", icon: FlaskConical, name: "Mechanism" },
  entity: { cls: "border-foreground/20 bg-muted text-foreground", icon: Target, name: "Enzyme / transporter" },
  direction: { cls: "border-warn/40 bg-warn/10 text-warn-foreground", icon: TrendingUpDown, name: "Direction of effect" },
  outcome: { cls: "border-danger/30 bg-danger/5 text-danger", icon: Stethoscope, name: "Clinical outcome" },
  record: { cls: "border-border bg-card text-foreground", icon: FileText, name: "Evidence record" },
  status: { cls: "border-border bg-muted text-muted-foreground border-dashed", icon: TrendingUpDown, name: "Evidence status" },
};

type Filter = "all" | "confirmed" | "mixed" | "no-effect";

export function EvidenceChainGraph({ herbs, drugs }: { herbs: string[]; drugs: string[] }) {
  const { matches, unmatched } = useMemo(() => evaluateHdi(herbs, drugs), [herbs, drugs]);
  const [filter, setFilter] = useState<Filter>("all");
  const [herbF, setHerbF] = useState("");
  const [drugF, setDrugF] = useState("");
  const [levelF, setLevelF] = useState("");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Sel | null>(null);

  const levels = Array.from(new Set(matches.map((m) => m.ev.evidenceLevel)));
  const shown = matches.filter((m) => {
    if (filter !== "all" && m.ev.category !== filter) return false;
    if (herbF && m.herb !== herbF) return false;
    if (drugF && m.drug !== drugF) return false;
    if (levelF && m.ev.evidenceLevel !== levelF) return false;
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [m.herb, m.drug, m.ev.herb, m.ev.botanical, m.ev.drug, m.ev.mechanism, `record ${m.ev.id}`, String(m.ev.id), ...entitiesOf(m.ev.mechanism)]
      .some((t) => t.toLowerCase().includes(s));
  });

  if (!herbs.length || !drugs.length) return null;

  const Node = ({ kind, label, m, sub }: { kind: NodeKind; label: string; m: HdiMatch; sub?: string }) => {
    const st = STYLE[kind];
    return (
      <button
        onClick={() => setSel({ kind, label, m })}
        title={label}
        className={`transition-smooth hover-lift flex max-w-[220px] shrink-0 items-start gap-2 rounded-xl border px-3 py-2 text-left shadow-card ${st.cls}`}
      >
        <st.icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0">
          <span className="block text-[9px] font-bold uppercase tracking-wider opacity-70">{st.name}</span>
          <span className="line-clamp-3 block text-xs font-semibold text-foreground">{label}</span>
          {sub && <span className="block text-[10px] italic text-muted-foreground">{sub}</span>}
        </span>
      </button>
    );
  };
  const Arrow = ({ label }: { label: string }) => (
    <div className="flex shrink-0 flex-col items-center px-1 text-muted-foreground">
      <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-wider">{label}</span>
      <span className="text-sm leading-none">→</span>
    </div>
  );

  const pill = (v: Filter, text: string) => (
    <button
      key={v}
      onClick={() => setFilter(v)}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-smooth ${filter === v ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"}`}
    >
      {text}
    </button>
  );
  const selectCls = "bg-card rounded-lg border px-2 py-1.5 text-xs";

  return (
    <section className="glass shadow-card mt-6 rounded-3xl p-6">
      <div className="mb-1 flex items-center gap-2">
        <BookOpen className="text-primary h-5 w-5" />
        <h3 className="text-base font-semibold">Evidence chain graph</h3>
      </div>
      <p className="text-muted-foreground mb-4 text-xs">
        Graph relationships are generated only from the {HDI_SOURCE_LABEL}. Enzymes and transporters appear only when
        named in the record's mechanism.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {pill("all", "All evidence")}
        {pill("confirmed", "Confirmed matches")}
        {pill("mixed", "Mixed / conflicting")}
        {pill("no-effect", "No significant human effect")}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="bg-card flex items-center gap-1.5 rounded-lg border px-2 py-1.5">
          <Search className="text-muted-foreground h-3.5 w-3.5" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search herb, drug, enzyme, record…"
            className="w-56 bg-transparent text-xs outline-none"
          />
        </div>
        <select className={selectCls} value={herbF} onChange={(e) => setHerbF(e.target.value)}>
          <option value="">All herbs</option>
          {herbs.map((h) => <option key={h}>{h}</option>)}
        </select>
        <select className={selectCls} value={drugF} onChange={(e) => setDrugF(e.target.value)}>
          <option value="">All drugs</option>
          {drugs.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select className={selectCls} value={levelF} onChange={(e) => setLevelF(e.target.value)}>
          <option value="">All evidence levels</option>
          {levels.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {shown.length === 0 && <p className="text-muted-foreground text-xs">No evidence-table relationships match these filters.</p>}
        {shown.map((m, idx) => {
          const ents = entitiesOf(m.ev.mechanism);
          const recordSeenBefore = shown.slice(0, idx).some((p) => p.ev.id === m.ev.id);
          const confirmed = m.ev.category === "confirmed";
          return (
            <div key={`${m.herb}-${m.drug}-${m.ev.id}`} className="bg-card/50 overflow-x-auto rounded-2xl border p-3">
              <div className="flex min-w-max items-center gap-1">
                <Node kind="herb" label={m.herb} sub={m.ev.botanical || undefined} m={m} />
                <Arrow label="interacts with" />
                <Node kind="drug" label={m.drug} m={m} />
                {confirmed ? (
                  <>
                    <Arrow label="mechanism" />
                    <Node kind="mechanism" label={m.ev.mechanism} m={m} />
                    {ents.length > 0 && (
                      <>
                        <Arrow label="involves" />
                        <div className="flex flex-col gap-1">
                          {ents.map((e) => <Node key={e} kind="entity" label={e} m={m} />)}
                        </div>
                      </>
                    )}
                    <Arrow label="causes" />
                    <Node kind="direction" label={m.ev.direction} m={m} />
                    <Arrow label="associated with" />
                    <Node kind="outcome" label={m.ev.outcome} m={m} />
                  </>
                ) : (
                  <>
                    <Arrow label="evidence" />
                    <Node kind="status" label={categoryLabel(m.ev.category)} m={m} />
                  </>
                )}
                <Arrow label="source" />
                {recordSeenBefore ? (
                  <button
                    type="button"
                    onClick={() => setSel({ kind: "record", label: `Evidence Record ${m.ev.id}`, m })}
                    className="border-border bg-muted/40 text-muted-foreground hover:bg-muted flex max-w-40 flex-col items-start rounded-xl border border-dashed px-2.5 py-1.5 text-left text-[10px] leading-tight"
                    title={`Shared evidence record ${m.ev.id} — shown once above`}
                  >
                    <span className="font-semibold">↳ Record {m.ev.id}</span>
                    <span>shared record, shown above</span>
                  </button>
                ) : (
                  <Node kind="record" label={`Evidence Record ${m.ev.id}`} sub={m.ev.evidenceLevel} m={m} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {unmatched.length > 0 && (filter === "all") && (
        <div className="text-muted-foreground mt-4 space-y-1 text-xs">
          {unmatched.map((p) => <p key={p}><b className="text-foreground/80">{p}</b> — no edge drawn. {NO_MATCH_TEXT}</p>)}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
        {(Object.keys(STYLE) as NodeKind[]).filter((k) => k !== "status").map((k) => {
          const st = STYLE[k];
          return (
            <span key={k} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${st.cls}`}>
              <st.icon className="h-3 w-3" /> {st.name}
            </span>
          );
        })}
      </div>

      {sel && (
        <>
          <div className="fixed inset-0 z-40 bg-foreground/20" onClick={() => setSel(null)} />
          <aside className="bg-card animate-in slide-in-from-right-8 fade-in fixed right-0 top-0 z-50 h-full w-full max-w-sm overflow-y-auto border-l p-6 shadow-2xl">
            <button aria-label="Close" onClick={() => setSel(null)} className="text-muted-foreground hover:text-foreground absolute right-4 top-4">
              <X className="h-5 w-5" />
            </button>
            {(sel.kind === "entity" || sel.kind === "mechanism") && (
              <div className="mb-5 pr-6">
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{STYLE[sel.kind].name}</p>
                <h4 className="mt-1 text-lg font-bold">{sel.kind === "entity" ? sel.label : "Mechanism"}</h4>
                <p className="mt-3 text-sm font-semibold">Why is this node present?</p>
                <p className="text-muted-foreground text-sm">
                  Because it is explicitly mentioned in the matched Master HDI Evidence Table record.
                </p>
                <Row k="Used in" v={`Record ${sel.m.ev.id}`} />
                <Row k="Related interaction" v={`${sel.m.herb} + ${sel.m.drug}`} />
                <Row k="Evidence-table mechanism" v={`“${sel.m.ev.mechanism}”`} />
              </div>
            )}
            <div className="pr-6">
              <p className="text-primary text-[10px] font-bold uppercase tracking-wider">Evidence-Based Herb–Drug Interaction</p>
              <Row k="Herb" v={sel.m.ev.herb} />
              {sel.m.ev.botanical && <Row k="Botanical name" v={sel.m.ev.botanical} />}
              <Row k="Drug" v={sel.m.ev.drug} />
              <Row k="Classification" v={categoryLabel(sel.m.ev.category)} />
              <Row k="Mechanism" v={sel.m.ev.mechanism} />
              <Row k="Direction" v={sel.m.ev.direction} />
              <Row k="Clinical outcome" v={sel.m.ev.outcome} />
              <Row k="Evidence level" v={sel.m.ev.evidenceLevel} />
              <Row k="Evidence record" v={`Record ${sel.m.ev.id}`} />
              <Row k="References" v={sel.m.ev.references} />
              <Row k="Source" v={HDI_SOURCE_LABEL} />
              <Row k="Detection method" v="Matched against curated evidence table" />
              <p className="text-muted-foreground mt-4 text-[11px]">
                Prescription entries: “{sel.m.herb}” and “{sel.m.drug}”.
              </p>
            </div>
          </aside>
        </>
      )}
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="mt-3">
      <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{k}</div>
      <div className="text-sm">{v}</div>
    </div>
  );
}

