import { useMemo, useState } from "react";
import { Leaf, Pill, X, Network, CheckCircle2, Activity, AlertTriangle, FileText } from "lucide-react";
import { HDI_SOURCE_LABEL, categoryLabel, findEvidence, RISK_ORDER, RISK_STYLE, type HdiEvidence, type HdiRisk, tier } from "@/lib/hdi";

type Edge = { id: string; herb: string; drug: string; ev: HdiEvidence };
type NodeSel = { kind: "herb" | "drug"; label: string };

const W = 940;
const NODE_W = 230;
const NODE_H = 58;
const STEP = 88;
const PAD_Y = 34;

export function KnowledgeGraph({ herbs, drugs }: { herbs: string[]; drugs: string[] }) {
  const [selected, setSelected] = useState<Edge | null>(null);
  const [nodeSel, setNodeSel] = useState<NodeSel | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const { edges, unmatched } = useMemo(() => {
    const edges: Edge[] = [];
    const unmatched: string[] = [];
    for (const h of herbs) {
      for (const d of drugs) {
        const evs = findEvidence(h, d);
        if (evs.length === 0) {
          unmatched.push(`${h} + ${d}`);
          continue;
        }
        const best = [...evs].sort((a, b) => RISK_ORDER[tier(a)] - RISK_ORDER[tier(b)])[0]!;
        edges.push({ id: `${h}__${d}__${best.id}`, herb: h, drug: d, ev: best });
      }
    }
    return { edges, unmatched };
  }, [herbs, drugs]);

  const statsFor = (kind: "herb" | "drug", label: string) => {
    const rel = edges.filter((e) => (kind === "herb" ? e.herb === label : e.drug === label));
    const top = rel.length
      ? tier([...rel].sort((a, b) => RISK_ORDER[tier(a.ev)] - RISK_ORDER[tier(b.ev)])[0]!.ev)
      : null;
    return { count: rel.length, top, rel };
  };

  const highest: HdiRisk | null = edges.length
    ? tier([...edges].sort((a, b) => RISK_ORDER[tier(a.ev)] - RISK_ORDER[tier(b.ev)])[0]!.ev)
    : null;

  if (herbs.length === 0 || drugs.length === 0) {
    return (
      <div className="glass shadow-card rounded-3xl p-8 text-center">
        <Network className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
        <p className="text-sm font-semibold">Graph needs both a herb and a medication</p>
        <p className="text-muted-foreground mt-1 text-sm">
          This prescription has {herbs.length} herbal and {drugs.length} conventional item
          {drugs.length === 1 ? "" : "s"}, so no herb–drug pairs can be plotted.
        </p>
      </div>
    );
  }

  const rows = Math.max(herbs.length, drugs.length);
  const H = PAD_Y * 2 + 44 + (rows - 1) * STEP + NODE_H;
  const colTop = PAD_Y + 44;
  const yFor = (i: number, total: number) => {
    const span = (rows - 1) * STEP;
    const own = (total - 1) * STEP;
    return colTop + (span - own) / 2 + i * STEP + NODE_H / 2;
  };

  const leftX = 30 + NODE_W / 2;
  const rightX = W - 30 - NODE_W / 2;
  const dim = (key: string) => hovered !== null && hovered !== key;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="glass shadow-card grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4">
        <Stat icon={Leaf} label="Herbs detected" value={String(herbs.length)} tone="text-primary" />
        <Stat icon={Pill} label="Medications detected" value={String(drugs.length)} tone="text-trust" />
        <Stat icon={Activity} label="Interactions found" value={String(edges.length)} tone="text-foreground" />
        <Stat
          icon={AlertTriangle}
          label="Strongest evidence status"
          value={highest ? RISK_STYLE[highest].label : "None"}
          tone={highest ? "" : "text-safe"}
          style={highest ? { color: RISK_STYLE[highest].stroke } : undefined}
        />
      </div>

      <div className="glass shadow-card overflow-hidden rounded-3xl p-3 sm:p-5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full select-none"
          role="img"
          aria-label="Herb and medication interaction graph"
        >
          <defs>
            <filter id="node-shadow" x="-30%" y="-60%" width="160%" height="220%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.16" />
            </filter>
          </defs>

          <text x={leftX} y={PAD_Y} textAnchor="middle" className="fill-muted-foreground" fontSize={12} fontWeight={800} letterSpacing="1.6">
            HERBS DETECTED
          </text>
          <text x={rightX} y={PAD_Y} textAnchor="middle" className="fill-muted-foreground" fontSize={12} fontWeight={800} letterSpacing="1.6">
            MEDICATIONS DETECTED
          </text>
          <line x1={W / 2} y1={PAD_Y + 14} x2={W / 2} y2={H - 12} className="stroke-border" strokeWidth={1} strokeDasharray="4 8" />

          {edges.map((e) => {
            const y1 = yFor(herbs.indexOf(e.herb), herbs.length);
            const y2 = yFor(drugs.indexOf(e.drug), drugs.length);
            const s = RISK_STYLE[tier(e.ev)];
            const x1 = leftX + NODE_W / 2;
            const x2 = rightX - NODE_W / 2;
            const d = `M ${x1} ${y1} C ${W / 2 - 40} ${y1}, ${W / 2 + 40} ${y2}, ${x2} ${y2}`;
            const active = selected?.id === e.id || hovered === e.id;
            return (
              <g key={e.id} opacity={dim(e.id) ? 0.15 : 1} className="transition-opacity duration-200">
                <path id={`p-${e.id}`} d={d} stroke={s.stroke} strokeWidth={active ? s.width + 2 : s.width} fill="none" strokeLinecap="round" opacity={active ? 1 : 0.8} />
                <path
                  d={d}
                  stroke="transparent"
                  strokeWidth={18}
                  fill="none"
                  className="cursor-pointer"
                  onMouseEnter={() => setHovered(e.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => {
                    setNodeSel(null);
                    setSelected(e);
                  }}
                />
                {tier(e.ev) === "CRITICAL" && (
                  <circle r={4} fill={s.stroke}>
                    <animateMotion dur="2.2s" repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            );
          })}

          {herbs.map((h, i) => {
            const st = statsFor("herb", h);
            return (
              <GraphNode
                key={h}
                x={leftX}
                y={yFor(i, herbs.length)}
                label={h}
                kind="herb"
                count={st.count}
                dimmed={hovered !== null && !edges.some((e) => e.id === hovered && e.herb === h)}
                active={nodeSel?.kind === "herb" && nodeSel.label === h}
                onClick={() => {
                  setSelected(null);
                  setNodeSel({ kind: "herb", label: h });
                }}
              />
            );
          })}
          {drugs.map((d, i) => {
            const st = statsFor("drug", d);
            return (
              <GraphNode
                key={d}
                x={rightX}
                y={yFor(i, drugs.length)}
                label={d}
                kind="drug"
                count={st.count}
                dimmed={hovered !== null && !edges.some((e) => e.id === hovered && e.drug === d)}
                active={nodeSel?.kind === "drug" && nodeSel.label === d}
                onClick={() => {
                  setSelected(null);
                  setNodeSel({ kind: "drug", label: d });
                }}
              />
            );
          })}
        </svg>

        <Legend />

        {unmatched.length > 0 && (
          <ul className="text-muted-foreground mt-4 space-y-1 text-xs">
            {unmatched.map((p) => (
              <li key={p}>
                No documented interaction found in current knowledge base for {p} — absence of evidence is not
                evidence of safety.
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Evidence summary */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Evidence summary</h3>
        {edges.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pair in this prescription matched the evidence base.</p>
        ) : (
          <div className="glass shadow-card overflow-x-auto rounded-3xl">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground text-[10px] uppercase tracking-wider">
                <tr className="border-border/60 border-b">
                  <th className="px-4 py-3 font-semibold">Herb</th>
                  <th className="px-4 py-3 font-semibold">Medication</th>
                  <th className="px-4 py-3 font-semibold">Risk</th>
                  <th className="px-4 py-3 font-semibold">Outcome</th>
                  <th className="px-4 py-3 font-semibold">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-border/60 divide-y">
                {[...edges]
                  .sort((a, b) => RISK_ORDER[tier(a.ev)] - RISK_ORDER[tier(b.ev)])
                  .map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                      onMouseEnter={() => setHovered(e.id)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => {
                        setNodeSel(null);
                        setSelected(e);
                      }}
                    >
                      <td className="px-4 py-3 font-medium">{e.herb}</td>
                      <td className="px-4 py-3 font-medium">{e.drug}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${RISK_STYLE[tier(e.ev)].chip}`}>
                          {RISK_STYLE[tier(e.ev)].label} · {e.ev.evidenceLevel}
                        </span>
                      </td>
                      <td className="text-foreground/80 max-w-md px-4 py-3">{e.ev.outcome}</td>
                      <td className="text-muted-foreground whitespace-nowrap px-4 py-3 text-xs">{e.ev.evidenceLevel}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(selected || nodeSel) && (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px]"
            onClick={() => {
              setSelected(null);
              setNodeSel(null);
            }}
          />
          <aside className="bg-card animate-in slide-in-from-right-8 fade-in fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col overflow-y-auto border-l p-6 shadow-2xl duration-300">
            <button
              aria-label="Close panel"
              onClick={() => {
                setSelected(null);
                setNodeSel(null);
              }}
              className="text-muted-foreground hover:text-foreground absolute right-4 top-4"
            >
              <X className="h-5 w-5" />
            </button>

            {selected ? (
              <div className="pr-6">
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Interaction detail</p>
                <h3 className="mt-1 text-lg font-bold leading-snug">
                  {selected.ev.herb} <span className="text-muted-foreground">×</span> {selected.ev.drug}
                </h3>
                {selected.ev.botanical && <p className="text-muted-foreground text-xs italic">{selected.ev.botanical}</p>}
                <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${RISK_STYLE[tier(selected.ev)].chip}`}>
                  {RISK_STYLE[tier(selected.ev)].label}
                </span>

                <Field label="Pharmacological mechanism" value={selected.ev.mechanism} />
                <Field label="Direction of effect" value={selected.ev.direction} />

                <div className="border-warn/40 bg-warn/10 mt-5 rounded-2xl border p-4">
                  <div className="text-warn-foreground flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <AlertTriangle className="h-3.5 w-3.5" /> Clinical outcome
                  </div>
                  <p className="text-foreground/90 mt-2 text-sm">{selected.ev.outcome}</p>
                </div>

                <div className="text-muted-foreground border-border bg-muted/50 mt-5 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px]">
                  <FileText className="h-3 w-3" /> {selected.ev.evidenceLevel}
                </div>

                <Field label="Source record" value={`Record ${selected.ev.id} · References ${selected.ev.references}`} />
                <p className="text-primary mt-4 text-[11px] font-semibold">Evidence source: {HDI_SOURCE_LABEL}</p>
                <p className="text-muted-foreground mt-2 text-[11px]">
                  Matched from your prescription entries “{selected.herb}” and “{selected.drug}”.
                </p>
              </div>
            ) : nodeSel ? (
              (() => {
                const st = statsFor(nodeSel.kind, nodeSel.label);
                const Icon = nodeSel.kind === "herb" ? Leaf : Pill;
                return (
                  <div className="pr-6">
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                      {nodeSel.kind === "herb" ? "Herbal substance" : "Medication"}
                    </p>
                    <h3 className="mt-1 flex items-center gap-2 text-lg font-bold">
                      <Icon className={nodeSel.kind === "herb" ? "text-primary h-5 w-5" : "text-trust h-5 w-5"} />
                      {nodeSel.label}
                    </h3>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-2xl p-4">
                        <div className="text-2xl font-bold">{st.count}</div>
                        <div className="text-muted-foreground text-[11px]">Documented interactions</div>
                      </div>
                      <div className="bg-muted/50 rounded-2xl p-4">
                        <div className="text-2xl font-bold" style={st.top ? { color: RISK_STYLE[st.top].stroke } : undefined}>
                          {st.top ? RISK_STYLE[st.top].label : "—"}
                        </div>
                        <div className="text-muted-foreground text-[11px]">Highest risk level</div>
                      </div>
                    </div>

                    {st.count === 0 ? (
                      <div className="border-safe/30 bg-safe/10 text-safe mt-5 flex items-center gap-2 rounded-2xl border p-4 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4" /> No interaction found in the knowledge base
                      </div>
                    ) : (
                      <ul className="mt-5 space-y-2">
                        {st.rel.map((e) => (
                          <li key={e.id}>
                            <button
                              onClick={() => {
                                setNodeSel(null);
                                setSelected(e);
                              }}
                              className="hover:bg-muted/60 w-full rounded-xl border p-3 text-left text-sm transition-colors"
                            >
                              <span className="font-medium">{nodeSel.kind === "herb" ? e.drug : e.herb}</span>
                              <span className={`ml-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${RISK_STYLE[tier(e.ev)].chip}`}>
                                {RISK_STYLE[tier(e.ev)].label} · {e.ev.evidenceLevel}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()
            ) : null}
          </aside>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
  style,
}: {
  icon: typeof Leaf;
  label: string;
  value: string;
  tone?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="bg-card/40 flex items-center gap-3 px-4 py-4">
      <Icon className={`h-4 w-4 shrink-0 ${tone || "text-muted-foreground"}`} style={style} />
      <div className="min-w-0">
        <div className={`truncate text-base font-bold ${tone}`} style={style}>
          {value}
        </div>
        <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-5">
      <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{label}</div>
      <p className="text-foreground/85 mt-1 text-sm">{value}</p>
    </div>
  );
}

function GraphNode({
  x,
  y,
  label,
  kind,
  count,
  dimmed,
  active,
  onClick,
}: {
  x: number;
  y: number;
  label: string;
  kind: "herb" | "drug";
  count: number;
  dimmed: boolean;
  active: boolean;
  onClick: () => void;
}) {
  const safe = count === 0;
  const color = safe ? "var(--muted-foreground)" : kind === "herb" ? "var(--primary)" : "var(--trust)";
  const short = label.length > 20 ? `${label.slice(0, 19)}…` : label;
  return (
    <g
      opacity={dimmed ? 0.2 : 1}
      className="cursor-pointer transition-opacity duration-200"
      onClick={onClick}
      filter="url(#node-shadow)"
    >
      <rect
        x={x - NODE_W / 2}
        y={y - NODE_H / 2}
        width={NODE_W}
        height={NODE_H}
        rx={16}
        className="fill-card"
      />
      <rect
        x={x - NODE_W / 2}
        y={y - NODE_H / 2}
        width={NODE_W}
        height={NODE_H}
        rx={16}
        fill={color}
        opacity={safe ? 0.06 : 0.12}
        stroke={color}
        strokeWidth={active ? 2.5 : 1.5}
        strokeOpacity={safe ? 0.4 : 1}
      />
      <circle cx={x - NODE_W / 2 + 26} cy={y} r={13} fill={color} opacity={safe ? 0.18 : 0.9} />
      <g transform={`translate(${x - NODE_W / 2 + 18}, ${y - 8})`} pointerEvents="none">
        {kind === "herb" ? (
          <Leaf width={16} height={16} stroke={safe ? color : "var(--card)"} strokeWidth={2.2} fill="none" />
        ) : (
          <Pill width={16} height={16} stroke={safe ? color : "var(--card)"} strokeWidth={2.2} fill="none" />
        )}
      </g>
      <text x={x - NODE_W / 2 + 48} y={safe ? y - 2 : y + 5} fontSize={14} fontWeight={650} className="fill-foreground">
        {short}
      </text>
      {safe && (
        <g transform={`translate(${x - NODE_W / 2 + 48}, ${y + 6})`} pointerEvents="none">
          <CheckCircle2 width={11} height={11} stroke="var(--safe)" strokeWidth={2.4} fill="none" />
          <text x={15} y={10} fontSize={10} fontWeight={600} fill="var(--safe)">
            No interaction found
          </text>
        </g>
      )}
      <title>{label}</title>
    </g>
  );
}

function Legend() {
  return (
    <div className="border-border/60 mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4 text-xs">
      <span className="inline-flex items-center gap-1.5 font-medium">
        <Leaf className="text-primary h-3.5 w-3.5" /> Herb
      </span>
      <span className="inline-flex items-center gap-1.5 font-medium">
        <Pill className="text-trust h-3.5 w-3.5" /> Medication
      </span>
      <span className="text-safe inline-flex items-center gap-1.5 font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" /> No interaction
      </span>
      {(["CRITICAL", "MODERATE", "LOW"] as const).map((r) => (
        <span key={r} className="text-muted-foreground inline-flex items-center gap-1.5">
          <span
            className="inline-block w-7 rounded-full"
            style={{ height: RISK_STYLE[r].width, background: RISK_STYLE[r].stroke }}
          />
          {RISK_STYLE[r].label}
        </span>
      ))}
    </div>
  );
}
