import { BookOpen, CheckCircle2, Scale, ShieldAlert } from "lucide-react";
import { evaluateHdi, HDI_SOURCE_LABEL, NO_MATCH_TEXT, RISK_STYLE, categoryLabel } from "@/lib/hdi";

/** Evidence-table HDI results split into A (confirmed), B (mixed / no-effect), C (no match). */
export function HdiEvidenceSummary({ herbs, drugs }: { herbs: string[]; drugs: string[] }) {
  if (!herbs.length || !drugs.length) return null;
  const { confirmed, mixed, unmatched } = evaluateHdi(herbs, drugs);

  const Card = ({ m }: { m: (typeof confirmed)[number] }) => (
    <div className="bg-card/70 rounded-2xl border p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold">
          {m.ev.herb}
          {m.ev.botanical && <span className="text-muted-foreground font-normal italic"> ({m.ev.botanical})</span>}
          <span className="text-muted-foreground"> × </span>
          {m.ev.drug}
        </div>
        {m.ev.category === "confirmed" ? (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${RISK_STYLE[m.ev.riskLevel].chip}`}>
            {m.ev.riskLevel}
          </span>
        ) : (
          <span className="bg-muted text-muted-foreground rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase">
            {categoryLabel(m.ev.category)}
          </span>
        )}
      </div>
      <dl className="mt-3 grid gap-1.5 text-xs sm:grid-cols-[130px_1fr]">
        <dt className="text-muted-foreground">Mechanism</dt><dd>{m.ev.mechanism}</dd>
        <dt className="text-muted-foreground">Direction</dt><dd>{m.ev.direction}</dd>
        <dt className="text-muted-foreground">Clinical outcome</dt><dd>{m.ev.outcome}</dd>
        <dt className="text-muted-foreground">Evidence</dt><dd>{m.ev.evidenceLevel}</dd>
        <dt className="text-muted-foreground">Source</dt>
        <dd>Record {m.ev.id} · References {m.ev.references}</dd>
      </dl>
      <p className="text-muted-foreground mt-2 text-[11px]">
        Matched from prescription entries “{m.herb}” and “{m.drug}”.
      </p>
    </div>
  );

  return (
    <section className="glass shadow-card mb-8 rounded-3xl p-6 sm:p-8">
      <div className="mb-1 flex items-center gap-2">
        <BookOpen className="text-primary h-5 w-5" />
        <h2 className="text-lg font-semibold">Evidence-based herb–drug check</h2>
      </div>
      <p className="text-muted-foreground mb-6 text-xs">
        Evidence source: {HDI_SOURCE_LABEL} (curated, n=30). Herb–drug alerts are shown only when the pair matches a
        record in this table.
      </p>

      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <ShieldAlert className="text-danger h-4 w-4" /> A. Confirmed evidence-table matches ({confirmed.length})
      </h3>
      <div className="mb-6 grid gap-3">
        {confirmed.length ? confirmed.map((m) => <Card key={`${m.herb}-${m.drug}-${m.ev.id}`} m={m} />) : (
          <p className="text-muted-foreground text-xs">None.</p>
        )}
      </div>

      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Scale className="text-warn-foreground h-4 w-4" /> B. Mixed / conflicting or no-effect evidence ({mixed.length})
      </h3>
      <div className="mb-6 grid gap-3">
        {mixed.length ? mixed.map((m) => <Card key={`${m.herb}-${m.drug}-${m.ev.id}`} m={m} />) : (
          <p className="text-muted-foreground text-xs">None.</p>
        )}
      </div>

      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <CheckCircle2 className="text-muted-foreground h-4 w-4" /> C. No matching HDI in the curated table ({unmatched.length})
      </h3>
      {unmatched.length ? (
        <ul className="text-muted-foreground space-y-1 text-xs">
          {unmatched.map((p) => (
            <li key={p}><b className="text-foreground/80">{p}</b> — {NO_MATCH_TEXT}</li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-xs">None.</p>
      )}
    </section>
  );
}
