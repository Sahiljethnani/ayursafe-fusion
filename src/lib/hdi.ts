/**
 * Evidence-based Herb-Drug Interaction (HDI) module.
 * SINGLE SOURCE OF TRUTH: the 30 records of the AyurSafe Master HDI Evidence Table.
 * No HDI may be reported unless it maps to one of these records.
 */
import dataset from "@/data/hdi_evidence_data.json";

export type HdiRisk = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
export type HdiCategory = "confirmed" | "mixed" | "no-effect";

export type HdiEvidence = {
  id: number;
  herb: string;
  botanical: string;
  drug: string;
  mechanism: string;
  direction: string;
  outcome: string;
  evidenceLevel: string;
  references: string;
  riskLevel: HdiRisk;
  category: HdiCategory;
};

export const HDI_SOURCE_LABEL = "AyurSafe Master Herb-Drug Interaction Evidence Table";
export const HDI_EVIDENCE = (dataset as { records: HdiEvidence[] }).records;

export const NO_MATCH_TEXT =
  "No matching interaction was found in the current AyurSafe curated evidence table.";

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Herb aliases / botanical names — for MATCHING ONLY (never creates new evidence). */
const HERB_ALIASES: Record<string, string[]> = {
  "st johns wort": ["hypericum", "hypericum perforatum", "st john wort", "saint johns wort"],
  "grapefruit juice": ["grapefruit", "citrus paradisi"],
  "ginkgo biloba": ["ginkgo", "gingko"],
  ginseng: ["panax ginseng", "panax", "korean ginseng", "asian ginseng"],
  turmeric: ["curcuma longa", "curcuma", "curcumin", "haldi", "haridra"],
  licorice: ["liquorice", "glycyrrhiza glabra", "glycyrrhiza", "mulethi", "yashtimadhu"],
  garlic: ["allium sativum", "lahsun", "lasuna"],
  "milk thistle": ["silybum marianum", "silymarin", "silybin"],
  echinacea: ["echinacea purpurea"],
  "cranberry juice": ["cranberry", "vaccinium macrocarpon"],
  chamomile: ["matricaria chamomilla", "matricaria", "camomile"],
  danshen: ["salvia miltiorrhiza"],
  "schisandra sphenanthera": ["schisandra", "schizandra", "wuweizi"],
  "goji berry": ["goji", "lycium barbarum", "lycium", "wolfberry"],
  kava: ["piper methysticum", "kava kava"],
  "green tea": ["camellia sinensis", "egcg", "green tea extract"],
  "cannabis cbd": ["cannabis", "cbd", "cannabidiol"],
  valerian: ["valeriana officinalis", "valeriana"],
  piperine: ["piper nigrum", "black pepper", "trikatu"],
  "wu chu yu": ["evodia", "evodia rutaecarpa", "wuzhuyu", "tetradium ruticarpum"],
  astragalus: ["astragalus membranaceus", "huang qi", "huangqi"],
};

/** Drug classes named in the evidence table → member drugs (matching only). */
const DRUG_CLASSES: Record<string, string[]> = {
  ssris: ["fluoxetine", "sertraline", "paroxetine", "citalopram", "escitalopram", "fluvoxamine"],
  maois: ["phenelzine", "tranylcypromine", "selegiline", "isocarboxazid", "moclobemide"],
  "oral contraceptives": ["ethinylestradiol", "ethinyl estradiol", "levonorgestrel", "norethisterone", "desogestrel", "oral contraceptive"],
  statins: ["atorvastatin", "simvastatin"],
  anticoagulants: ["warfarin", "acenocoumarol", "heparin", "apixaban", "rivaroxaban", "dabigatran", "enoxaparin"],
  nsaids: ["ibuprofen", "diclofenac", "naproxen", "aspirin", "indomethacin", "ketorolac", "aceclofenac", "piroxicam", "mefenamic acid"],
  immunosuppressants: ["tacrolimus", "cyclosporine", "ciclosporin", "sirolimus", "mycophenolate", "azathioprine", "everolimus"],
};

const DRUG_SYNONYMS: Record<string, string[]> = {
  cyclosporine: ["ciclosporin", "cyclosporin"],
  valproate: ["valproic acid", "sodium valproate", "divalproex"],
  acenocoumarol: ["nicoumalone"],
  prednisolone: ["prednisone"],
};

/** Split a table label like "Warfarin / Aspirin" or "Statins (Atorvastatin, Simvastatin)" into terms. */
function labelTerms(label: string): string[] {
  return label
    .replace(/\(([^)]*)\)/g, " / $1 ")
    .split(/[/,;]/)
    .map(norm)
    .filter((t) => t.length > 2);
}

function herbTermsFor(e: HdiEvidence): string[] {
  const base = [...labelTerms(e.herb), ...(e.botanical ? [norm(e.botanical)] : [])];
  const out = new Set(base);
  for (const t of base) for (const a of HERB_ALIASES[t] ?? []) out.add(norm(a));
  return [...out];
}

function drugTermsFor(e: HdiEvidence): string[] {
  const out = new Set<string>();
  for (const t of labelTerms(e.drug)) {
    out.add(t);
    for (const m of DRUG_CLASSES[t] ?? []) out.add(norm(m));
    for (const s of DRUG_SYNONYMS[t] ?? []) out.add(norm(s));
  }
  return [...out];
}

/** Deterministic match: exact term, or whole-word containment (e.g. "Tab. Tacrolimus 2mg"). */
function termMatch(detected: string, terms: string[]): boolean {
  const d = ` ${norm(detected)} `;
  if (d.trim().length < 3) return false;
  return terms.some((t) => t.length >= 3 && (d.includes(` ${t} `) || (d.trim().length >= 5 && ` ${t} `.includes(d))));
}

export function matchesHerb(detected: string, e: HdiEvidence) {
  return termMatch(detected, herbTermsFor(e));
}
export function matchesDrug(detected: string, e: HdiEvidence) {
  return termMatch(detected, drugTermsFor(e));
}

/** True when the name maps to a herb that exists in the evidence table. */
export function isEvidenceHerb(name: string) {
  return HDI_EVIDENCE.some((e) => matchesHerb(name, e));
}

/** All evidence records for a detected herb/drug pair. Empty array = no HDI. */
export function findEvidence(herb: string, drug: string): HdiEvidence[] {
  return HDI_EVIDENCE.filter((e) => matchesHerb(herb, e) && matchesDrug(drug, e));
}

export type HdiMatch = { herb: string; drug: string; ev: HdiEvidence };

/** Evaluate every herb × drug pair; returns matches split by category plus unmatched pairs. */
export function evaluateHdi(herbs: string[], drugs: string[]) {
  const matches: HdiMatch[] = [];
  const unmatched: string[] = [];
  for (const h of herbs)
    for (const d of drugs) {
      const evs = findEvidence(h, d);
      if (!evs.length) unmatched.push(`${h} + ${d}`);
      for (const ev of evs) matches.push({ herb: h, drug: d, ev });
    }
  return {
    confirmed: matches.filter((m) => m.ev.category === "confirmed"),
    mixed: matches.filter((m) => m.ev.category !== "confirmed"),
    matches,
    unmatched,
  };
}

export function categoryLabel(c: HdiCategory) {
  return c === "no-effect"
    ? "Evidence table reports no significant human effect"
    : c === "mixed"
      ? "Mixed / Conflicting Evidence"
      : "Confirmed evidence-table HDI";
}

export const RISK_ORDER: Record<HdiRisk, number> = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };

export const RISK_STYLE: Record<HdiRisk, { stroke: string; width: number; chip: string; label: string }> = {
  CRITICAL: { stroke: "var(--danger)", width: 5, chip: "bg-danger/15 text-danger border-danger/30", label: "Evidence-supported interaction" },
  HIGH: { stroke: "oklch(0.68 0.17 45)", width: 3, chip: "bg-warn/25 text-warn-foreground border-warn/40", label: "High" },
  MODERATE: { stroke: "oklch(0.82 0.15 90)", width: 2, chip: "bg-warn/15 text-warn-foreground border-warn/30", label: "Mixed / Conflicting Evidence" },
  LOW: { stroke: "var(--muted-foreground)", width: 1.5, chip: "bg-muted text-muted-foreground border-border", label: "No significant human effect" },
};

/** Visual tier derived ONLY from the evidence-table classification (never from legacy risk levels). */
export function tier(ev: HdiEvidence): HdiRisk {
  return ev.category === "confirmed" ? "CRITICAL" : ev.category === "mixed" ? "MODERATE" : "LOW";
}

/** Display label for an evidence-table HDI: status + exact evidence level. */
export function evidenceStatus(ev: { category: HdiCategory }) {
  return ev.category === "confirmed" ? "Evidence-supported interaction" : ev.category === "mixed" ? "Mixed / Conflicting Evidence" : "No significant human effect";
}
