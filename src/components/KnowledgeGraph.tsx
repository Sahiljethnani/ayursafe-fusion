import { useMemo, useState } from "react";
import { Leaf, Pill, X, Network } from "lucide-react";
import { findEvidence, RISK_ORDER, RISK_STYLE, type HdiEvidence } from "@/lib/hdi";

type Edge = { herb: string; drug: string; ev: HdiEvidence };

const W = 760;
const NODE_H = 62;
const PAD_Y = 48;

export function KnowledgeGraph({ herbs, drugs }: { herbs: string[]; drugs: string[] }) {
  const [selected, setSelected] = useState<Edge | null>(null);

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
        const best = [...evs].sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel])[0]!;
        edges.push({ herb: h, drug: d, ev: best });
      }
    }
    return { edges, unmatched };
  }, [herbs, drugs]);

  const rows = Math.max(herbs.length, drugs.length, 1);
  const H = PAD_Y * 2 + (rows - 1) * NODE_H + 40;
  const yFor = (i: number, total: number) =>
    PAD_Y + 20 + (total === 1 ? ((rows - 1) * NODE_H) / 2 : (i * (rows - 1) * NODE_H) / (total - 1));

  const leftX = 150;
  const rightX = W - 150;

  if (herbs.length === 0 || drugs.length === 0) {
    return (
      <div className="glass shadow-card rounded-3xl p-8 text-center">
        <Network className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
        <p className="text-sm font-semibold">Graph needs both a herb and a drug</p>
        <p className="text-muted-foreground mt-1 text-sm">
          This prescription has {herbs.length} herbal and {drugs.length} conventional item
          {drugs.length === 1 ? "" : "s"}, so no herb–drug pairs can be plotted.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="glass shadow-card overflow-hidden rounded-3xl p-4 sm:p-6">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Herb and drug interaction graph">
          {edges.map((e) => {
            const hi = herbs.indexOf(e.herb);
            const di = drugs.indexOf(e.drug);
            const y1 = yFor(hi, herbs.length);
            const y2 = yFor(di, drugs.length);
            const s = RISK_STYLE[e.ev.riskLevel];
            const active = selected?.ev.id === e.ev.id && selected.herb === e.herb && selected.drug === e.drug;
            return (
              <path
                key={`${e.herb}|${e.drug}|${e.ev.id}`}
                d={`M ${leftX + 78} ${y1} C ${W / 2} ${y1}, ${W / 2} ${y2}, ${rightX - 78} ${y2}`}
                stroke={s.stroke}
                strokeWidth={active ? s.width + 2 : s.width}
                fill="none"
                opacity={active ? 1 : 0.75}
                className="cursor-pointer"
                onClick={() => setSelected(e)}
              />
            );
          })}

          {herbs.map((h, i) => (
            <GraphNode key={h} x={leftX} y={yFor(i, herbs.length)} label={h} kind="herb" />
          ))}
          {drugs.map((d, i) => (
            <GraphNode key={d} x={rightX} y={yFor(i, drugs.length)} label={d} kind="drug" />
          ))}
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

      <aside className="glass shadow-card rounded-3xl p-5">
        {!selected ? (
          <div className="text-muted-foreground text-sm">
            <h3 className="text-foreground mb-2 text-sm font-semibold">Evidence panel</h3>
            Click any connecting line in the graph to read the documented mechanism, direction of effect, clinical
            outcome and evidence level for that pair.
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold">
                {selected.ev.herb} × {selected.ev.drug}
              </h3>
              <button
                aria-label="Close evidence panel"
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${RISK_STYLE[selected.ev.riskLevel].chip}`}
            >
              {selected.ev.riskLevel}
            </span>
            <Field label="Mechanism" value={selected.ev.mechanism} />
            <Field label="Direction of effect" value={selected.ev.direction} />
            <Field label="Clinical outcome" value={selected.ev.outcome} />
            <Field label="Evidence level" value={selected.ev.evidenceLevel} />
            <p className="text-muted-foreground mt-4 text-[11px]">
              Matched from your prescription entries “{selected.herb}” and “{selected.drug}”.
            </p>
          </div>
        )}
      </aside>

      <div className="lg:col-span-2">
        <h3 className="mb-3 text-sm font-semibold">Evidence summary</h3>
        {edges.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No pair in this prescription matched the evidence base.
          </p>
        ) : (
          <div className="glass shadow-card overflow-x-auto rounded-3xl">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground text-[10px] uppercase tracking-wider">
                <tr className="border-border/60 border-b">
                  <th className="px-4 py-3 font-semibold">Herb</th>
                  <th className="px-4 py-3 font-semibold">Drug</th>
                  <th className="px-4 py-3 font-semibold">Risk</th>
                  <th className="px-4 py-3 font-semibold">Outcome</th>
                  <th className="px-4 py-3 font-semibold">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-border/60 divide-y">
                {[...edges]
                  .sort((a, b) => RISK_ORDER[a.ev.riskLevel] - RISK_ORDER[b.ev.riskLevel])
                  .map((e) => (
                    <tr
                      key={`${e.herb}|${e.drug}|${e.ev.id}`}
                      className="hover:bg-muted/40 cursor-pointer"
                      onClick={() => setSelected(e)}
                    >
                      <td className="px-4 py-3 font-medium">{e.herb}</td>
                      <td className="px-4 py-3 font-medium">{e.drug}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${RISK_STYLE[e.ev.riskLevel].chip}`}
                        >
                          {e.ev.riskLevel}
                        </span>
                      </td>
                      <td className="text-foreground/80 max-w-md px-4 py-3">{e.ev.outcome}</td>
                      <td className="text-muted-foreground whitespace-nowrap px-4 py-3 text-xs">
                        {e.ev.evidenceLevel}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{label}</div>
      <p className="text-foreground/85 mt-1 text-sm">{value}</p>
    </div>
  );
}

function GraphNode({ x, y, label, kind }: { x: number; y: number; label: string; kind: "herb" | "drug" }) {
  const fill = kind === "herb" ? "var(--primary)" : "var(--trust)";
  const short = label.length > 20 ? `${label.slice(0, 19)}…` : label;
  return (
    <g>
      <rect
        x={x - 78}
        y={y - 18}
        width={156}
        height={36}
        rx={18}
        fill={fill}
        opacity={0.14}
        stroke={fill}
        strokeWidth={1.5}
      />
      <circle cx={x - 60} cy={y} r={5} fill={fill} />
      <text x={x - 46} y={y + 4} fontSize={13} fontWeight={600} fill="currentColor" className="text-foreground">
        {short}
      </text>
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
        <Pill className="text-trust h-3.5 w-3.5" /> Drug
      </span>
      {(["CRITICAL", "HIGH", "MODERATE", "LOW"] as const).map((r) => (
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
