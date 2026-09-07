import raw from "@/data/hdi_evidence_data.json";

export type HdiRisk = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";

export type HdiEvidence = {
  id: number;
  herb: string;
  drug: string;
  mechanism: string;
  direction: string;
  outcome: string;
  evidenceLevel: string;
  riskLevel: HdiRisk;
};

export const HDI_EVIDENCE = raw as HdiEvidence[];

const STOP = new Set([
  "juice",
  "extract",
  "root",
  "leaf",
  "oil",
  "seed",
  "tea",
  "berry",
  "acid",
  "and",
  "the",
]);

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Split a knowledge-base label like "Warfarin / Aspirin (blood thinner)" into candidate terms. */
function terms(label: string): string[] {
  const cleaned = label.replace(/\(([^)]*)\)/g, " / $1 ");
  return cleaned
    .split(/[/,;]/)
    .map(norm)
    .filter((t) => t.length > 2);
}

function tokens(t: string) {
  return t.split(" ").filter((w) => w.length > 3 && !STOP.has(w));
}

/** Case-insensitive partial match between a detected substance and a KB label. */
export function matchesLabel(detected: string, label: string): boolean {
  const d = norm(detected);
  if (!d) return false;
  for (const t of terms(label)) {
    if (t === d) return true;
    if (t.includes(d) && d.length >= 4) return true;
    if (d.includes(t) && t.length >= 4) return true;
    const dt = tokens(d);
    const lt = tokens(t);
    if (dt.length && lt.length && dt.some((x) => lt.some((y) => x === y))) return true;
  }
  return false;
}

export function findEvidence(herb: string, drug: string): HdiEvidence[] {
  return HDI_EVIDENCE.filter((e) => matchesLabel(herb, e.herb) && matchesLabel(drug, e.drug));
}

export const RISK_ORDER: Record<HdiRisk, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MODERATE: 2,
  LOW: 3,
};

export const RISK_STYLE: Record<HdiRisk, { stroke: string; width: number; chip: string; label: string }> = {
  CRITICAL: { stroke: "var(--danger)", width: 5.5, chip: "bg-danger/15 text-danger border-danger/30", label: "Critical" },
  HIGH: { stroke: "oklch(0.68 0.17 45)", width: 4, chip: "bg-warn/25 text-warn-foreground border-warn/40", label: "High" },
  MODERATE: { stroke: "oklch(0.82 0.15 90)", width: 3, chip: "bg-warn/15 text-warn-foreground border-warn/30", label: "Moderate" },
  LOW: { stroke: "var(--muted-foreground)", width: 2, chip: "bg-muted text-muted-foreground border-border", label: "Low" },
};
