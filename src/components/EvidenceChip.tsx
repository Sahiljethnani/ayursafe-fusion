import { evidenceStatus, type HdiCategory } from "@/lib/hdi";

/** Badge for evidence-table HDI results: evidence status + exact evidence level + record. No risk labels. */
export function EvidenceChip({ ev }: { ev: { id: number; evidenceLevel: string; category: HdiCategory } }) {
  return (
    <span className="border-primary/30 bg-primary/10 text-primary inline-flex flex-col items-end rounded-xl border px-2.5 py-1 text-right text-[10px] font-semibold leading-tight">
      <span className="uppercase tracking-wider">{evidenceStatus(ev)}</span>
      <span className="text-muted-foreground font-normal">Evidence {ev.evidenceLevel} · Record {ev.id}</span>
    </span>
  );
}
