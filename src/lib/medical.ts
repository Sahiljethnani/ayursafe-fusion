/**
 * AyurSafe clinical knowledge layer.
 * Pure, deterministic logic: medicine-name normalisation, interaction rules,
 * risk classification and safety scoring. No demo/mock data is produced here —
 * every function only works with the medicines it is given.
 */

export type Severity = "safe" | "moderate" | "high";

export type InteractionKind = "drug-drug" | "herb-drug" | "drug-condition" | "allergy";

export type CanonicalEntry = {
  canonical: string;
  kind: "drug" | "herb";
  class?: string;
  aliases: string[];
};

/* ------------------------------------------------------------------ */
/* Canonical medicine dictionary                                       */
/* ------------------------------------------------------------------ */

export const CANONICAL_MEDICINES: CanonicalEntry[] = [
  // --- Modern drugs ---
  { canonical: "Paracetamol", kind: "drug", class: "analgesic", aliases: ["acetaminophen", "pcm", "crocin", "dolo", "calpol", "paracetmol", "paracetemol"] },
  { canonical: "Ibuprofen", kind: "drug", class: "nsaid", aliases: ["brufen", "ibugesic", "ibuprofin"] },
  { canonical: "Diclofenac", kind: "drug", class: "nsaid", aliases: ["voveran", "diclo"] },
  { canonical: "Naproxen", kind: "drug", class: "nsaid", aliases: [] },
  { canonical: "Aspirin", kind: "drug", class: "antiplatelet", aliases: ["acetylsalicylic acid", "asa", "ecosprin", "disprin"] },
  { canonical: "Cetirizine", kind: "drug", class: "antihistamine", aliases: ["cetrizine", "cetirizin", "zyrtec", "alerid", "cetzine"] },
  { canonical: "Levocetirizine", kind: "drug", class: "antihistamine", aliases: ["levocet", "levocetrizine", "xyzal"] },
  { canonical: "Chlorpheniramine", kind: "drug", class: "antihistamine", aliases: ["cpm", "chlorphenamine"] },
  { canonical: "Montelukast", kind: "drug", class: "leukotriene-antagonist", aliases: ["montek", "montair"] },
  { canonical: "Saline nasal spray", kind: "drug", class: "topical", aliases: ["nasal saline", "sodium chloride nasal spray", "saline spray", "nasoclear"] },
  { canonical: "Amoxicillin", kind: "drug", class: "penicillin", aliases: ["amoxycillin", "mox", "amox"] },
  { canonical: "Amoxicillin-Clavulanate", kind: "drug", class: "penicillin", aliases: ["augmentin", "co-amoxiclav", "clavam", "amoxyclav"] },
  { canonical: "Penicillin", kind: "drug", class: "penicillin", aliases: ["penicillin v", "benzylpenicillin"] },
  { canonical: "Azithromycin", kind: "drug", class: "macrolide", aliases: ["azithral", "azee", "azithro"] },
  { canonical: "Clarithromycin", kind: "drug", class: "macrolide", aliases: [] },
  { canonical: "Ciprofloxacin", kind: "drug", class: "fluoroquinolone", aliases: ["cifran", "cipro"] },
  { canonical: "Levofloxacin", kind: "drug", class: "fluoroquinolone", aliases: ["levoflox"] },
  { canonical: "Metronidazole", kind: "drug", class: "nitroimidazole", aliases: ["flagyl", "metrogyl"] },
  { canonical: "Warfarin", kind: "drug", class: "anticoagulant", aliases: ["coumadin", "warf"] },
  { canonical: "Clopidogrel", kind: "drug", class: "antiplatelet", aliases: ["plavix", "clopilet"] },
  { canonical: "Metformin", kind: "drug", class: "biguanide", aliases: ["glycomet", "metformine", "glucophage"] },
  { canonical: "Glimepiride", kind: "drug", class: "sulfonylurea", aliases: ["amaryl"] },
  { canonical: "Insulin", kind: "drug", class: "insulin", aliases: ["human insulin", "insulin glargine", "lantus"] },
  { canonical: "Atorvastatin", kind: "drug", class: "statin", aliases: ["atorva", "lipitor"] },
  { canonical: "Rosuvastatin", kind: "drug", class: "statin", aliases: ["rosuvas", "crestor"] },
  { canonical: "Simvastatin", kind: "drug", class: "statin", aliases: [] },
  { canonical: "Amlodipine", kind: "drug", class: "calcium-channel-blocker", aliases: ["amlong", "amlokind"] },
  { canonical: "Lisinopril", kind: "drug", class: "ace-inhibitor", aliases: [] },
  { canonical: "Enalapril", kind: "drug", class: "ace-inhibitor", aliases: [] },
  { canonical: "Ramipril", kind: "drug", class: "ace-inhibitor", aliases: ["cardace"] },
  { canonical: "Telmisartan", kind: "drug", class: "arb", aliases: ["telma"] },
  { canonical: "Losartan", kind: "drug", class: "arb", aliases: ["losar"] },
  { canonical: "Atenolol", kind: "drug", class: "beta-blocker", aliases: [] },
  { canonical: "Metoprolol", kind: "drug", class: "beta-blocker", aliases: ["metolar"] },
  { canonical: "Propranolol", kind: "drug", class: "beta-blocker", aliases: ["inderal"] },
  { canonical: "Furosemide", kind: "drug", class: "loop-diuretic", aliases: ["lasix", "frusemide"] },
  { canonical: "Hydrochlorothiazide", kind: "drug", class: "thiazide", aliases: ["hctz"] },
  { canonical: "Spironolactone", kind: "drug", class: "potassium-sparing-diuretic", aliases: ["aldactone"] },
  { canonical: "Omeprazole", kind: "drug", class: "ppi", aliases: ["omez"] },
  { canonical: "Pantoprazole", kind: "drug", class: "ppi", aliases: ["pantop", "pan-d", "pantocid"] },
  { canonical: "Ranitidine", kind: "drug", class: "h2-blocker", aliases: ["rantac"] },
  { canonical: "Ondansetron", kind: "drug", class: "antiemetic", aliases: ["emeset", "ondem", "zofran"] },
  { canonical: "Domperidone", kind: "drug", class: "prokinetic", aliases: ["domstal"] },
  { canonical: "Prednisolone", kind: "drug", class: "corticosteroid", aliases: ["prednisone", "wysolone"] },
  { canonical: "Dexamethasone", kind: "drug", class: "corticosteroid", aliases: ["dexona"] },
  { canonical: "Salbutamol", kind: "drug", class: "bronchodilator", aliases: ["albuterol", "asthalin", "ventolin"] },
  { canonical: "Budesonide", kind: "drug", class: "inhaled-corticosteroid", aliases: ["budecort"] },
  { canonical: "Sertraline", kind: "drug", class: "ssri", aliases: ["zoloft", "serta"] },
  { canonical: "Fluoxetine", kind: "drug", class: "ssri", aliases: ["prozac"] },
  { canonical: "Escitalopram", kind: "drug", class: "ssri", aliases: ["nexito", "cipralex"] },
  { canonical: "Amitriptyline", kind: "drug", class: "tricyclic", aliases: [] },
  { canonical: "Alprazolam", kind: "drug", class: "benzodiazepine", aliases: ["alprax", "xanax"] },
  { canonical: "Clonazepam", kind: "drug", class: "benzodiazepine", aliases: ["clonotril", "rivotril"] },
  { canonical: "Diazepam", kind: "drug", class: "benzodiazepine", aliases: ["valium"] },
  { canonical: "Phenytoin", kind: "drug", class: "anticonvulsant", aliases: ["eptoin", "dilantin"] },
  { canonical: "Carbamazepine", kind: "drug", class: "anticonvulsant", aliases: ["tegretol"] },
  { canonical: "Valproate", kind: "drug", class: "anticonvulsant", aliases: ["sodium valproate", "valparin", "divalproex"] },
  { canonical: "Levothyroxine", kind: "drug", class: "thyroid-hormone", aliases: ["thyronorm", "eltroxin", "thyroxine"] },
  { canonical: "Digoxin", kind: "drug", class: "cardiac-glycoside", aliases: ["lanoxin"] },
  { canonical: "Tramadol", kind: "drug", class: "opioid", aliases: ["ultracet"] },
  { canonical: "Codeine", kind: "drug", class: "opioid", aliases: [] },
  { canonical: "Morphine", kind: "drug", class: "opioid", aliases: [] },
  { canonical: "Allopurinol", kind: "drug", class: "xanthine-oxidase-inhibitor", aliases: ["zyloric"] },
  { canonical: "Methotrexate", kind: "drug", class: "antimetabolite", aliases: [] },
  { canonical: "Vitamin D3", kind: "drug", class: "supplement", aliases: ["cholecalciferol", "calcirol"] },
  { canonical: "Calcium carbonate", kind: "drug", class: "supplement", aliases: ["shelcal", "calcium"] },
  { canonical: "Iron (ferrous sulphate)", kind: "drug", class: "supplement", aliases: ["ferrous sulphate", "ferrous fumarate", "iron tablet", "orofer"] },
  { canonical: "Folic acid", kind: "drug", class: "supplement", aliases: ["folate"] },
  { canonical: "Vitamin B12", kind: "drug", class: "supplement", aliases: ["cyanocobalamin", "methylcobalamin"] },

  // --- Immunosuppressants, narrow-therapeutic-index and other high-interaction drugs ---
  { canonical: "Tacrolimus", kind: "drug", class: "calcineurin-inhibitor", aliases: ["prograf", "pangraf", "tacro", "fk506", "tacrolimas", "tacrolimus monohydrate"] },
  { canonical: "Cyclosporine", kind: "drug", class: "calcineurin-inhibitor", aliases: ["ciclosporin", "cyclosporin", "sandimmun", "neoral", "panimun"] },
  { canonical: "Sirolimus", kind: "drug", class: "mtor-inhibitor", aliases: ["rapamycin", "rapamune"] },
  { canonical: "Everolimus", kind: "drug", class: "mtor-inhibitor", aliases: ["certican"] },
  { canonical: "Mycophenolate", kind: "drug", class: "antiproliferative", aliases: ["mycophenolate mofetil", "cellcept", "mmf", "myfortic"] },
  { canonical: "Azathioprine", kind: "drug", class: "antiproliferative", aliases: ["imuran", "azoran"] },
  { canonical: "Acenocoumarol", kind: "drug", class: "anticoagulant", aliases: ["nicoumalone", "acitrom"] },
  { canonical: "Apixaban", kind: "drug", class: "anticoagulant", aliases: ["eliquis"] },
  { canonical: "Rivaroxaban", kind: "drug", class: "anticoagulant", aliases: ["xarelto"] },
  { canonical: "Dabigatran", kind: "drug", class: "anticoagulant", aliases: ["pradaxa"] },
  { canonical: "Nifedipine", kind: "drug", class: "calcium-channel-blocker", aliases: ["adalat", "nifedical"] },
  { canonical: "Verapamil", kind: "drug", class: "calcium-channel-blocker", aliases: ["calaptin"] },
  { canonical: "Diltiazem", kind: "drug", class: "calcium-channel-blocker", aliases: ["dilzem"] },
  { canonical: "Nadolol", kind: "drug", class: "beta-blocker", aliases: ["corgard"] },
  { canonical: "Theophylline", kind: "drug", class: "methylxanthine", aliases: ["aminophylline", "theobid", "deriphyllin"] },
  { canonical: "Lorazepam", kind: "drug", class: "benzodiazepine", aliases: ["ativan"] },
  { canonical: "Midazolam", kind: "drug", class: "benzodiazepine", aliases: ["dormicum"] },
  { canonical: "Oral contraceptive (ethinylestradiol)", kind: "drug", class: "hormonal-contraceptive", aliases: ["ethinylestradiol", "ethinyl estradiol", "oral contraceptive", "ocp", "birth control pill", "levonorgestrel"] },
  { canonical: "Rifampicin", kind: "drug", class: "cyp-inducer", aliases: ["rifampin", "rcin"] },
  { canonical: "Ketoconazole", kind: "drug", class: "azole-antifungal", aliases: [] },
  { canonical: "Fluconazole", kind: "drug", class: "azole-antifungal", aliases: ["forcan"] },
  { canonical: "Itraconazole", kind: "drug", class: "azole-antifungal", aliases: ["itracon"] },
  { canonical: "Lithium", kind: "drug", class: "mood-stabiliser", aliases: ["lithium carbonate", "licab"] },
  { canonical: "Tamoxifen", kind: "drug", class: "serm", aliases: ["nolvadex"] },
  { canonical: "Imatinib", kind: "drug", class: "tyrosine-kinase-inhibitor", aliases: ["gleevec", "veenat"] },
  { canonical: "Sildenafil", kind: "drug", class: "pde5-inhibitor", aliases: ["viagra"] },
  { canonical: "Clozapine", kind: "drug", class: "antipsychotic", aliases: ["clozaril"] },
  { canonical: "Olanzapine", kind: "drug", class: "antipsychotic", aliases: ["oleanz"] },
  { canonical: "Risperidone", kind: "drug", class: "antipsychotic", aliases: ["risperdal"] },
  { canonical: "Levodopa-Carbidopa", kind: "drug", class: "antiparkinson", aliases: ["levodopa", "carbidopa", "syndopa"] },

  // --- Ayurvedic / herbal ---
  { canonical: "Ashwagandha", kind: "herb", class: "adaptogen", aliases: ["withania somnifera", "aswagandha", "ashvagandha"] },
  { canonical: "Brahmi", kind: "herb", class: "nootropic", aliases: ["bacopa monnieri", "bacopa"] },
  { canonical: "Turmeric", kind: "herb", class: "anti-inflammatory", aliases: ["curcumin", "haldi", "curcuma longa"] },
  { canonical: "Triphala", kind: "herb", class: "digestive", aliases: [] },
  { canonical: "Tulsi", kind: "herb", class: "adaptogen", aliases: ["holy basil", "ocimum sanctum"] },
  { canonical: "Guduchi", kind: "herb", class: "immunomodulator", aliases: ["giloy", "tinospora cordifolia"] },
  { canonical: "Shatavari", kind: "herb", class: "adaptogen", aliases: ["asparagus racemosus"] },
  { canonical: "Arjuna", kind: "herb", class: "cardiotonic", aliases: ["terminalia arjuna"] },
  { canonical: "Garlic extract", kind: "herb", class: "antiplatelet-herb", aliases: ["allium sativum", "lasuna", "garlic"] },
  { canonical: "Ginger", kind: "herb", class: "antiplatelet-herb", aliases: ["adrak", "zingiber officinale", "sunthi"] },
  { canonical: "Ginkgo biloba", kind: "herb", class: "antiplatelet-herb", aliases: ["ginkgo"] },
  { canonical: "St. John's Wort", kind: "herb", class: "cyp-inducer-herb", aliases: ["hypericum perforatum", "st johns wort", "st. johns wort"] },
  { canonical: "Licorice", kind: "herb", class: "mineralocorticoid-herb", aliases: ["yashtimadhu", "mulethi", "glycyrrhiza glabra"] },
  { canonical: "Gymnema", kind: "herb", class: "hypoglycemic-herb", aliases: ["gurmar", "gymnema sylvestre"] },
  { canonical: "Karela (bitter gourd)", kind: "herb", class: "hypoglycemic-herb", aliases: ["bitter gourd", "momordica charantia", "karela"] },
  { canonical: "Fenugreek", kind: "herb", class: "hypoglycemic-herb", aliases: ["methi", "trigonella"] },
  { canonical: "Punarnava", kind: "herb", class: "diuretic-herb", aliases: ["boerhavia diffusa"] },
  { canonical: "Jatamansi", kind: "herb", class: "sedative-herb", aliases: ["nardostachys jatamansi"] },
  { canonical: "Mandukaparni", kind: "herb", class: "nootropic", aliases: ["centella asiatica", "gotu kola"] },
];

const NOISE = /\b(tab|tablet|tabs|cap|capsule|caps|syp|syrup|inj|injection|susp|suspension|drops?|cream|ointment|spray|sachet|powder|churna|mg|mcg|ml|gm|g|iu|od|bd|tds|qid|hs|sos|prn|po|oral|topical)\b/gi;

export function cleanName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[0-9]+(\.[0-9]+)?\s*(mg|mcg|ml|gm|g|iu|%)?/g, " ")
    .replace(NOISE, " ")
    .replace(/[^a-z\s'.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

export type NormalizedName = {
  canonical: string | null;
  kind: "drug" | "herb" | "unknown";
  class: string | null;
  confidence: number;
};

/** Map an OCR-extracted medicine name onto a canonical entry (fuzzy, OCR-tolerant). */
export function normalizeMedicineName(raw: string): NormalizedName {
  const cleaned = cleanName(raw);
  if (!cleaned) return { canonical: null, kind: "unknown", class: null, confidence: 0 };

  let best: { entry: CanonicalEntry; score: number } | null = null;

  for (const entry of CANONICAL_MEDICINES) {
    const candidates = [entry.canonical.toLowerCase(), ...entry.aliases.map((a) => a.toLowerCase())];
    for (const cand of candidates) {
      let score = 0;
      if (cleaned === cand) score = 1;
      else if (cleaned.includes(cand) && cand.length >= 4) score = 0.92;
      else if (cand.includes(cleaned) && cleaned.length >= 5) score = 0.85;
      else {
        const token = cleaned.split(" ")[0];
        const d = levenshtein(token, cand);
        const norm = 1 - d / Math.max(token.length, cand.length);
        // only accept close spellings on words long enough to be meaningful
        if (cand.length >= 5 && token.length >= 5 && norm >= 0.8) score = norm * 0.9;
      }
      if (score > 0 && (!best || score > best.score)) best = { entry, score };
    }
  }

  if (!best || best.score < 0.72) return { canonical: null, kind: "unknown", class: null, confidence: 0 };
  return {
    canonical: best.entry.canonical,
    kind: best.entry.kind,
    class: best.entry.class ?? null,
    confidence: Number(best.score.toFixed(2)),
  };
}

/* ------------------------------------------------------------------ */
/* Interaction rules                                                   */
/* ------------------------------------------------------------------ */

type Selector = { name?: string; class?: string };

export type Rule = {
  left: Selector;
  right: Selector;
  severity: Severity;
  kind: InteractionKind;
  summary: string;
  advice: string;
};

/** Clinical rule base. Rules only fire for medicines actually present. */
export const INTERACTION_RULES: Rule[] = [
  { left: { name: "Warfarin" }, right: { class: "nsaid" }, severity: "high", kind: "drug-drug", summary: "NSAIDs displace warfarin from plasma proteins and impair platelet function, sharply raising bleeding risk.", advice: "Prefer paracetamol for analgesia; if an NSAID is unavoidable, monitor INR and watch for bleeding." },
  { left: { name: "Warfarin" }, right: { class: "antiplatelet" }, severity: "high", kind: "drug-drug", summary: "Combined anticoagulant and antiplatelet activity substantially increases haemorrhage risk.", advice: "Use only with a clear indication and close INR/bleeding monitoring." },
  { left: { name: "Warfarin" }, right: { class: "antiplatelet-herb" }, severity: "high", kind: "herb-drug", summary: "Herbs with antiplatelet activity add to warfarin's anticoagulant effect.", advice: "Avoid concentrated herbal extracts; culinary amounts are usually acceptable." },
  { left: { name: "Warfarin" }, right: { name: "St. John's Wort" }, severity: "high", kind: "herb-drug", summary: "St. John's Wort induces CYP2C9/3A4 and lowers warfarin levels, reducing anticoagulation and destabilising INR.", advice: "Avoid the combination; if stopped abruptly, INR can rebound — recheck within a week." },
  { left: { class: "antiplatelet" }, right: { class: "nsaid" }, severity: "moderate", kind: "drug-drug", summary: "Additive gastric irritation and platelet inhibition increase GI bleeding risk.", advice: "Add gastroprotection (PPI) and use the lowest effective NSAID dose." },
  { left: { class: "antiplatelet" }, right: { class: "antiplatelet-herb" }, severity: "moderate", kind: "herb-drug", summary: "Both inhibit platelet aggregation — bleeding time may be prolonged.", advice: "Avoid high-dose extracts, especially around surgery or dental work." },
  { left: { class: "ssri" }, right: { class: "nsaid" }, severity: "moderate", kind: "drug-drug", summary: "SSRIs deplete platelet serotonin; combined with NSAIDs this raises upper-GI bleeding risk.", advice: "Consider gastroprotection and review the need for the NSAID." },
  { left: { class: "ssri" }, right: { name: "St. John's Wort" }, severity: "high", kind: "herb-drug", summary: "Additive serotonergic activity may precipitate serotonin syndrome.", advice: "Do not combine; taper one agent under supervision." },
  { left: { class: "ssri" }, right: { name: "Tramadol" }, severity: "high", kind: "drug-drug", summary: "Both raise synaptic serotonin and lower the seizure threshold.", advice: "Choose a non-serotonergic analgesic where possible." },
  { left: { class: "ssri" }, right: { name: "Ashwagandha" }, severity: "moderate", kind: "herb-drug", summary: "Ashwagandha has mild sedative/serotonergic effects that can add to SSRI activity.", advice: "Start low, monitor for excess sedation or agitation." },
  { left: { class: "statin" }, right: { name: "Turmeric" }, severity: "moderate", kind: "herb-drug", summary: "High-dose curcumin inhibits CYP3A4 and may raise statin exposure.", advice: "Keep curcumin below ~1 g/day and report muscle pain." },
  { left: { class: "statin" }, right: { class: "macrolide" }, severity: "high", kind: "drug-drug", summary: "Macrolides inhibit CYP3A4, raising statin levels and the risk of rhabdomyolysis.", advice: "Hold the statin during the macrolide course or switch to azithromycin/rosuvastatin." },
  { left: { class: "ace-inhibitor" }, right: { class: "potassium-sparing-diuretic" }, severity: "high", kind: "drug-drug", summary: "Both raise serum potassium — risk of dangerous hyperkalaemia.", advice: "Check potassium and renal function within 1–2 weeks of starting." },
  { left: { class: "ace-inhibitor" }, right: { class: "nsaid" }, severity: "moderate", kind: "drug-drug", summary: "NSAIDs blunt the antihypertensive effect and can impair renal perfusion.", advice: "Monitor blood pressure and creatinine; keep NSAID courses short." },
  { left: { class: "arb" }, right: { class: "potassium-sparing-diuretic" }, severity: "high", kind: "drug-drug", summary: "Additive potassium retention can cause hyperkalaemia.", advice: "Monitor electrolytes closely." },
  { left: { class: "arb" }, right: { class: "nsaid" }, severity: "moderate", kind: "drug-drug", summary: "Reduced antihypertensive efficacy and possible renal impairment.", advice: "Monitor BP and renal function." },
  { left: { name: "Digoxin" }, right: { class: "loop-diuretic" }, severity: "moderate", kind: "drug-drug", summary: "Diuretic-induced hypokalaemia increases digoxin toxicity risk.", advice: "Monitor potassium and digoxin levels." },
  { left: { name: "Digoxin" }, right: { name: "Arjuna" }, severity: "moderate", kind: "herb-drug", summary: "Arjuna has mild cardiotonic activity that may add to digoxin's effect.", advice: "Monitor heart rate and rhythm." },
  { left: { class: "anticonvulsant" }, right: { name: "Brahmi" }, severity: "moderate", kind: "herb-drug", summary: "Brahmi may alter hepatic metabolism of anticonvulsants and change plasma levels.", advice: "Monitor drug levels and seizure control." },
  { left: { class: "anticonvulsant" }, right: { name: "St. John's Wort" }, severity: "high", kind: "herb-drug", summary: "Strong CYP induction lowers anticonvulsant levels — breakthrough seizures possible.", advice: "Avoid the combination." },
  { left: { class: "biguanide" }, right: { class: "hypoglycemic-herb" }, severity: "moderate", kind: "herb-drug", summary: "Herbal hypoglycaemics add to metformin's glucose-lowering effect.", advice: "Monitor blood glucose; dose adjustment may be needed." },
  { left: { class: "sulfonylurea" }, right: { class: "hypoglycemic-herb" }, severity: "high", kind: "herb-drug", summary: "Additive hypoglycaemia risk with sulfonylureas can cause symptomatic lows.", advice: "Monitor glucose closely and educate the patient on hypoglycaemia." },
  { left: { class: "insulin" }, right: { class: "hypoglycemic-herb" }, severity: "high", kind: "herb-drug", summary: "Herbal hypoglycaemics amplify insulin action.", advice: "Increase glucose monitoring; consider insulin dose review." },
  { left: { class: "corticosteroid" }, right: { name: "Licorice" }, severity: "moderate", kind: "herb-drug", summary: "Licorice potentiates mineralocorticoid effects — hypokalaemia and fluid retention.", advice: "Limit licorice; monitor potassium and blood pressure." },
  { left: { class: "corticosteroid" }, right: { class: "nsaid" }, severity: "moderate", kind: "drug-drug", summary: "Additive gastric mucosal injury raises ulcer and bleeding risk.", advice: "Add a PPI and shorten the overlap." },
  { left: { name: "Levothyroxine" }, right: { class: "supplement" }, severity: "moderate", kind: "drug-drug", summary: "Calcium and iron supplements chelate levothyroxine and reduce absorption.", advice: "Separate doses by at least 4 hours." },
  { left: { name: "Levothyroxine" }, right: { class: "ppi" }, severity: "moderate", kind: "drug-drug", summary: "Reduced gastric acidity lowers levothyroxine absorption.", advice: "Monitor TSH after starting or stopping the PPI." },
  { left: { name: "Methotrexate" }, right: { class: "nsaid" }, severity: "high", kind: "drug-drug", summary: "NSAIDs reduce methotrexate clearance, increasing marrow and hepatic toxicity.", advice: "Avoid; use paracetamol instead and monitor blood counts." },
  { left: { class: "benzodiazepine" }, right: { class: "opioid" }, severity: "high", kind: "drug-drug", summary: "Additive CNS and respiratory depression — potentially fatal.", advice: "Avoid co-prescription; if unavoidable, use minimum doses with monitoring." },
  { left: { class: "benzodiazepine" }, right: { class: "sedative-herb" }, severity: "moderate", kind: "herb-drug", summary: "Additive sedation and impaired alertness.", advice: "Warn against driving; consider reducing one agent." },
  { left: { class: "benzodiazepine" }, right: { name: "Ashwagandha" }, severity: "moderate", kind: "herb-drug", summary: "Ashwagandha's GABAergic activity adds to benzodiazepine sedation.", advice: "Monitor for excessive drowsiness." },
  { left: { class: "antihistamine" }, right: { class: "benzodiazepine" }, severity: "moderate", kind: "drug-drug", summary: "Additive sedation, particularly with first-generation antihistamines.", advice: "Avoid driving; prefer a non-sedating antihistamine." },
  { left: { class: "antihistamine" }, right: { class: "sedative-herb" }, severity: "moderate", kind: "herb-drug", summary: "Combined sedative load may cause marked drowsiness.", advice: "Take at bedtime and avoid operating machinery." },
  { left: { class: "fluoroquinolone" }, right: { class: "supplement" }, severity: "moderate", kind: "drug-drug", summary: "Calcium/iron form insoluble chelates with fluoroquinolones, reducing absorption.", advice: "Separate administration by at least 2–4 hours." },
  { left: { class: "macrolide" }, right: { name: "Warfarin" }, severity: "high", kind: "drug-drug", summary: "Macrolides inhibit warfarin metabolism, raising INR and bleeding risk.", advice: "Check INR 3–5 days after starting the antibiotic." },
  { left: { name: "Metronidazole" }, right: { name: "Warfarin" }, severity: "high", kind: "drug-drug", summary: "Metronidazole inhibits warfarin metabolism and markedly increases INR.", advice: "Reduce warfarin dose and monitor INR." },
  { left: { name: "Allopurinol" }, right: { name: "Methotrexate" }, severity: "moderate", kind: "drug-drug", summary: "Increased methotrexate toxicity risk with concurrent allopurinol.", advice: "Monitor blood counts." },
  { left: { class: "ppi" }, right: { name: "Clopidogrel" }, severity: "moderate", kind: "drug-drug", summary: "Omeprazole/pantoprazole can reduce clopidogrel activation via CYP2C19.", advice: "Prefer pantoprazole and separate dosing where possible." },
  { left: { name: "St. John's Wort" }, right: { class: "ppi" }, severity: "moderate", kind: "herb-drug", summary: "CYP induction may reduce PPI exposure and acid control.", advice: "Monitor symptom control." },
  { left: { class: "thiazide" }, right: { class: "diuretic-herb" }, severity: "moderate", kind: "herb-drug", summary: "Additive diuresis may cause dehydration and electrolyte loss.", advice: "Ensure adequate hydration; check electrolytes." },
  { left: { class: "loop-diuretic" }, right: { class: "diuretic-herb" }, severity: "moderate", kind: "herb-drug", summary: "Additive fluid loss and electrolyte disturbance.", advice: "Monitor weight, blood pressure and electrolytes." },
];

/** Drug ↔ existing-condition cautions. */
export const CONDITION_RULES: { match: Selector; condition: RegExp; severity: Severity; summary: string; advice: string }[] = [
  { match: { class: "nsaid" }, condition: /asthma/i, severity: "high", summary: "NSAIDs can precipitate bronchospasm in aspirin-sensitive asthma.", advice: "Prefer paracetamol; document any previous NSAID reaction." },
  { match: { class: "nsaid" }, condition: /(ulcer|gastritis|gerd|acid reflux)/i, severity: "high", summary: "NSAIDs worsen peptic ulcer disease and can cause GI bleeding.", advice: "Avoid, or co-prescribe a PPI if essential." },
  { match: { class: "nsaid" }, condition: /(kidney|renal|ckd)/i, severity: "high", summary: "NSAIDs reduce renal perfusion and can worsen chronic kidney disease.", advice: "Avoid in significant renal impairment." },
  { match: { class: "nsaid" }, condition: /(hypertension|high blood pressure)/i, severity: "moderate", summary: "NSAIDs cause sodium retention and raise blood pressure.", advice: "Monitor BP during use." },
  { match: { class: "beta-blocker" }, condition: /asthma/i, severity: "high", summary: "Non-selective beta-blockers can trigger bronchoconstriction in asthma.", advice: "Use a cardioselective agent or an alternative class." },
  { match: { class: "corticosteroid" }, condition: /diabetes/i, severity: "moderate", summary: "Corticosteroids raise blood glucose and can destabilise diabetes.", advice: "Increase glucose monitoring during the course." },
  { match: { class: "biguanide" }, condition: /(kidney|renal|ckd)/i, severity: "high", summary: "Metformin accumulates in renal impairment with a risk of lactic acidosis.", advice: "Check eGFR before continuing." },
  { match: { name: "Licorice" }, condition: /(hypertension|high blood pressure)/i, severity: "moderate", summary: "Licorice causes sodium retention and raises blood pressure.", advice: "Avoid prolonged use." },
  { match: { class: "antihistamine" }, condition: /glaucoma/i, severity: "moderate", summary: "Anticholinergic antihistamines may raise intraocular pressure.", advice: "Prefer a second-generation antihistamine." },
  { match: { class: "ssri" }, condition: /(bipolar)/i, severity: "moderate", summary: "SSRIs may precipitate a manic switch in bipolar disorder.", advice: "Use with a mood stabiliser and psychiatric supervision." },
];

function matches(sel: Selector, m: { canonical: string | null; class: string | null }): boolean {
  if (sel.name) return m.canonical === sel.name;
  if (sel.class) return m.class === sel.class;
  return false;
}

export type AnalyzedMedicine = {
  raw: string;
  canonical: string | null;
  kind: "drug" | "herb" | "unknown";
  class: string | null;
  confidence: number;
  strength: string | null;
  dosage: string | null;
  frequency: string | null;
  route: string | null;
  duration: string | null;
  instructions: string | null;
};

export type DetectedInteraction = {
  a: string;
  b: string;
  severity: Severity;
  kind: InteractionKind;
  summary: string;
  advice: string;
  source: "knowledge-base" | "ai" | "evidence-table";
  /** Present only for HDI results — traceable record from the Master HDI Evidence Table. */
  evidence?: {
    id: number;
    herb: string;
    botanical: string;
    drug: string;
    mechanism: string;
    direction: string;
    outcome: string;
    evidenceLevel: string;
    references: string;
    riskLevel: string;
    category: "confirmed" | "mixed" | "no-effect";
  };
};

/** Run the rule base over the medicines actually extracted from this prescription. */
export function findInteractions(
  meds: AnalyzedMedicine[],
  conditions: string[],
  allergies: string[],
): DetectedInteraction[] {
  const found: DetectedInteraction[] = [];
  const key = (a: string, b: string) => [a, b].sort().join("||").toLowerCase();
  const seen = new Set<string>();

  const known = meds.filter((m) => m.canonical);

  for (let i = 0; i < known.length; i++) {
    for (let j = i + 1; j < known.length; j++) {
      const m1 = known[i];
      const m2 = known[j];
      if (m1.canonical === m2.canonical) continue;
      for (const rule of INTERACTION_RULES) {
        // Herb-drug interactions come ONLY from the Master HDI Evidence Table (see hdi.ts).
        if (rule.kind === "herb-drug") continue;
        const hit =
          (matches(rule.left, m1) && matches(rule.right, m2)) ||
          (matches(rule.left, m2) && matches(rule.right, m1));
        if (!hit) continue;
        const k = key(m1.canonical!, m2.canonical!);
        if (seen.has(k)) {
          // keep the most severe rule for the pair
          const existing = found.find((f) => key(f.a, f.b) === k)!;
          if (severityRank(rule.severity) > severityRank(existing.severity)) {
            Object.assign(existing, { severity: rule.severity, summary: rule.summary, advice: rule.advice, kind: rule.kind });
          }
          continue;
        }
        seen.add(k);
        found.push({
          a: m1.canonical!,
          b: m2.canonical!,
          severity: rule.severity,
          kind: rule.kind,
          summary: rule.summary,
          advice: rule.advice,
          source: "knowledge-base",
        });
      }
    }
  }

  // Medicine ↔ condition
  for (const m of known) {
    for (const cond of conditions) {
      for (const rule of CONDITION_RULES) {
        if (!matches(rule.match, m)) continue;
        if (!rule.condition.test(cond)) continue;
        const k = key(m.canonical!, cond);
        if (seen.has(k)) continue;
        seen.add(k);
        found.push({
          a: m.canonical!,
          b: cond,
          severity: rule.severity,
          kind: "drug-condition",
          summary: rule.summary,
          advice: rule.advice,
          source: "knowledge-base",
        });
      }
    }
  }

  // Allergy conflicts (name, class or free-text match against the medicine)
  for (const m of meds) {
    for (const allergy of allergies) {
      const a = allergy.toLowerCase().trim();
      if (!a || a === "none" || a === "nka" || a === "unknown") continue;
      const target = `${m.raw} ${m.canonical ?? ""} ${m.class ?? ""}`.toLowerCase();
      const token = cleanName(a);
      if (!token) continue;
      if (target.includes(token) || (m.class && a.includes(m.class))) {
        const k = key(m.canonical ?? m.raw, `allergy:${a}`);
        if (seen.has(k)) continue;
        seen.add(k);
        found.push({
          a: m.canonical ?? m.raw,
          b: `Allergy: ${allergy}`,
          severity: "high",
          kind: "allergy",
          summary: `The patient has a recorded allergy to "${allergy}", which matches this prescribed medicine.`,
          advice: "Do not dispense until the allergy is verified; select an alternative from a different class.",
          source: "knowledge-base",
        });
      }
    }
  }

  return found.sort((x, y) => severityRank(y.severity) - severityRank(x.severity));
}

export function severityRank(s: Severity): number {
  return s === "high" ? 3 : s === "moderate" ? 2 : 1;
}

/**
 * Explainable safety score with diminishing penalties, so a prescription with
 * many related findings is not driven to zero by double counting.
 * First high finding −24, each further high −11; first moderate −9, each
 * further moderate −5; each unidentified medicine −3 (uncertainty).
 */
export function computeSafetyScore(
  interactions: DetectedInteraction[],
  unknownCount: number,
): { score: number; level: Severity; breakdown: string[] } {
  const high = interactions.filter((i) => i.severity === "high").length;
  const moderate = interactions.filter((i) => i.severity === "moderate").length;
  const breakdown: string[] = ["Baseline score: 100"];
  let score = 100;
  if (high) {
    const penalty = 24 + (high - 1) * 11;
    score -= penalty;
    breakdown.push(`${high} high-risk finding${high > 1 ? "s" : ""}: −${penalty}`);
  }
  if (moderate) {
    const penalty = 9 + (moderate - 1) * 5;
    score -= penalty;
    breakdown.push(`${moderate} moderate finding${moderate > 1 ? "s" : ""}: −${penalty}`);
  }
  if (unknownCount) {
    score -= unknownCount * 3;
    breakdown.push(`${unknownCount} unidentified medicine${unknownCount > 1 ? "s" : ""} (uncertainty): −${unknownCount * 3}`);
  }
  score = Math.max(5, Math.min(100, Math.round(score)));
  breakdown.push(`Final score: ${score}/100`);
  const level: Severity = high > 0 || score < 50 ? (score >= 65 ? "moderate" : "high") : score >= 80 ? "safe" : "moderate";
  return { score, level, breakdown };
}


/** True for clinical-engine findings (DDI / drug-condition). Herb-drug findings are evidence-table only and never scored. */
export function isClinicalRiskFinding(i: DetectedInteraction): boolean {
  return i.kind !== "herb-drug" && (i as { source?: string }).source !== "evidence-table";
}

/** Clinical Risk Summary: score/level/explanation from DDI + drug-condition findings only. HDI evidence is reported separately. */
export function summarizeClinicalRisk(interactions: DetectedInteraction[], unknownCount: number) {
  const clinical = interactions.filter(isClinicalRiskFinding);
  const hdi = interactions.filter((i) => (i as { source?: string }).source === "evidence-table");
  const cat = (i: DetectedInteraction) => (i as { evidence?: { category?: string } }).evidence?.category;
  const hdiConfirmed = hdi.filter((i) => cat(i) !== "mixed" && cat(i) !== "no-effect").length;
  const hdiOther = hdi.length - hdiConfirmed;
  const recId = (i: DetectedInteraction) => (i as { evidence?: { id?: number | string } }).evidence?.id;
  const hdiConfirmedItems = hdi.filter((i) => cat(i) !== "mixed" && cat(i) !== "no-effect");
  const hdiUniqueRecords = new Set(hdiConfirmedItems.map(recId).filter((v) => v != null)).size;
  const { score, level, breakdown } = computeSafetyScore(clinical, unknownCount);
  const ddiReview = clinical.filter((i) => i.kind === "drug-drug" && i.severity !== "safe").length;
  const otherReview = clinical.filter((i) => i.kind !== "drug-drug" && i.severity !== "safe").length;
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const parts = [
    `${hdiUniqueRecords} unique evidence record${hdiUniqueRecords === 1 ? "" : "s"} · ${plural(hdiConfirmed, "matched herb–drug pair", "matched herb–drug pairs")}`,
    plural(hdiOther, "mixed/conflicting or no-effect herb–drug finding", "mixed/conflicting or no-effect herb–drug findings"),
    plural(ddiReview, "drug–drug interaction requiring clinical review", "drug–drug interactions requiring clinical review"),
  ];
  if (otherReview > 0)
    parts.push(
      plural(otherReview, "drug–condition or allergy finding requiring clinical review", "drug–condition or allergy findings requiring clinical review"),
    );
  const explanation = parts.join(" · ");
  return {
    score,
    level,
    breakdown: breakdown.map((b) => b.replace("high-risk finding", "high-risk drug–drug finding").replace("moderate finding", "moderate drug–drug finding")),
    explanation,
    hdiConfirmed,
    hdiUniqueRecords,
    hdiOther,
    ddiReview,
    otherReview,
    clinical,
  };
}
