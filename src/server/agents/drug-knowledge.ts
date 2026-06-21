/**
 * Drug knowledge base — the "understanding" layer the agents reason over.
 *
 * Maps brand names → active ingredients, ingredients → drug families, known
 * interactions, controlled substances, and max daily doses. This is a curated,
 * deterministic knowledge base; in production it is augmented by the Gemini API
 * (GEMINI_API_KEY) for unknown brands/ingredients. Keeping a deterministic core
 * guarantees the safety checks always run even when the LLM is unavailable.
 */

const norm = (s: string) => s.trim().toLowerCase();

/** Brand / common name → active ingredient(s). */
const BRAND_INGREDIENTS: Record<string, string[]> = {
  "dolo 650": ["paracetamol"],
  "dolo": ["paracetamol"],
  "crocin": ["paracetamol"],
  "calpol": ["paracetamol"],
  "paracetamol": ["paracetamol"],
  "acetaminophen": ["paracetamol"],
  "cold relief plus": ["paracetamol", "phenylephrine"],
  "sinarest": ["paracetamol", "phenylephrine", "chlorpheniramine"],
  "combiflam": ["ibuprofen", "paracetamol"],
  "brufen": ["ibuprofen"],
  "ibuprofen": ["ibuprofen"],
  "aspirin": ["aspirin"],
  "disprin": ["aspirin"],
  "augmentin": ["amoxicillin", "clavulanic acid"],
  "amoxicillin": ["amoxicillin"],
  "amoxil": ["amoxicillin"],
  "ampicillin": ["ampicillin"],
  "tramadol": ["tramadol"],
  "ultram": ["tramadol"],
  "codeine": ["codeine"],
  "metformin": ["metformin"],
  "atorvastatin": ["atorvastatin"],
  "warfarin": ["warfarin"],
  "lisinopril": ["lisinopril"],
  "vitamin d3": ["cholecalciferol"],
};

/** Active ingredient → drug family. */
const INGREDIENT_FAMILY: Record<string, string> = {
  amoxicillin: "Penicillin",
  ampicillin: "Penicillin",
  cloxacillin: "Penicillin",
  "penicillin v": "Penicillin",
  ibuprofen: "NSAID",
  aspirin: "NSAID",
  naproxen: "NSAID",
  diclofenac: "NSAID",
  tramadol: "Opioid",
  codeine: "Opioid",
  morphine: "Opioid",
  oxycodone: "Opioid",
  paracetamol: "Analgesic",
  sulfamethoxazole: "Sulfonamide",
};

/** Ingredients regarded as controlled / abuse-prone (fraud agent focus). */
const CONTROLLED = new Set([
  "tramadol", "codeine", "morphine", "oxycodone", "alprazolam", "diazepam", "zolpidem",
]);

/** Max safe cumulative daily dose (mg) for accumulation checks. */
const MAX_DAILY_MG: Record<string, number> = {
  paracetamol: 4000,
  ibuprofen: 3200,
  aspirin: 4000,
};

interface InteractionRule {
  a: string;
  b: string;
  severity: "low" | "medium" | "high";
  detail: string;
  recommendation: string;
}

const INTERACTIONS: InteractionRule[] = [
  { a: "aspirin", b: "warfarin", severity: "high", detail: "Markedly increased risk of serious bleeding.", recommendation: "Avoid combination unless directed; monitor INR closely." },
  { a: "aspirin", b: "ibuprofen", severity: "medium", detail: "Combined NSAIDs raise gastrointestinal bleeding and ulcer risk.", recommendation: "Avoid concurrent NSAID use; consider gastric protection." },
  { a: "aspirin", b: "atorvastatin", severity: "medium", detail: "Slightly increased risk of muscle-related side effects.", recommendation: "Monitor for muscle pain; routine LFTs advised." },
  { a: "metformin", b: "contrast", severity: "high", detail: "Risk of lactic acidosis with iodinated contrast media.", recommendation: "Pause metformin 48h around contrast imaging." },
  { a: "tramadol", b: "codeine", severity: "high", detail: "Two opioids together greatly increase respiratory-depression risk.", recommendation: "Do not combine opioids; consult prescriber." },
];

/** Allergy term → drug family / ingredient it cross-reacts with. */
const ALLERGEN_MAP: Record<string, { families: string[]; ingredients: string[] }> = {
  penicillin: { families: ["Penicillin"], ingredients: ["amoxicillin", "ampicillin"] },
  amoxicillin: { families: ["Penicillin"], ingredients: ["amoxicillin"] },
  sulfa: { families: ["Sulfonamide"], ingredients: ["sulfamethoxazole"] },
  sulfonamide: { families: ["Sulfonamide"], ingredients: ["sulfamethoxazole"] },
  aspirin: { families: ["NSAID"], ingredients: ["aspirin"] },
  nsaid: { families: ["NSAID"], ingredients: ["ibuprofen", "aspirin", "naproxen"] },
  ibuprofen: { families: ["NSAID"], ingredients: ["ibuprofen"] },
};

/** Extract active ingredients from a medicine name. */
export function ingredientsOf(medName: string): string[] {
  const key = norm(medName).replace(/\s*\d+\s*(mg|mcg|g|ml|iu)\b.*$/i, "").trim();
  if (BRAND_INGREDIENTS[key]) return BRAND_INGREDIENTS[key];
  // try the raw normalized name
  const raw = norm(medName);
  if (BRAND_INGREDIENTS[raw]) return BRAND_INGREDIENTS[raw];
  // fallback: first token as the ingredient
  return [key.split(/\s+/)[0] || raw];
}

export function familyOf(ingredient: string): string | null {
  return INGREDIENT_FAMILY[norm(ingredient)] ?? null;
}

export function isControlled(ingredient: string): boolean {
  return CONTROLLED.has(norm(ingredient));
}

export function maxDailyMg(ingredient: string): number | null {
  return MAX_DAILY_MG[norm(ingredient)] ?? null;
}

export function findInteraction(i1: string, i2: string): InteractionRule | null {
  const a = norm(i1), b = norm(i2);
  return (
    INTERACTIONS.find(
      (r) => (r.a === a && r.b === b) || (r.a === b && r.b === a)
    ) ?? null
  );
}

/** Does a known allergy conflict with an ingredient? Returns the matched allergy term. */
export function allergyConflict(allergy: string, ingredient: string): { allergy: string; family: string | null } | null {
  const aKey = norm(allergy);
  const ing = norm(ingredient);
  const map = ALLERGEN_MAP[aKey];
  const fam = familyOf(ing);
  // direct name match
  if (aKey === ing) return { allergy, family: fam };
  if (map) {
    if (map.ingredients.includes(ing)) return { allergy, family: fam };
    if (fam && map.families.includes(fam)) return { allergy, family: fam };
  }
  // generic: allergy term equals the ingredient's family (e.g. allergy "Penicillin")
  if (fam && norm(fam) === aKey) return { allergy, family: fam };
  return null;
}

/** Parse a dosage string like "500mg" / "650 mg" → milligrams. */
export function parseDoseMg(dosage?: string): number | undefined {
  if (!dosage) return undefined;
  const m = dosage.match(/(\d+(?:\.\d+)?)\s*(mg|g)/i);
  if (!m) return undefined;
  const val = parseFloat(m[1]);
  return m[2].toLowerCase() === "g" ? val * 1000 : val;
}

/** Frequency text → doses per day. */
export function dosesPerDay(frequency: string): number {
  const f = norm(frequency);
  if (/(thrice|three times|3 times|tid|q8)/.test(f)) return 3;
  if (/(twice|two times|2 times|bid|q12)/.test(f)) return 2;
  if (/(four times|4 times|qid|q6)/.test(f)) return 4;
  if (/(once|daily|od|q24|qd)/.test(f)) return 1;
  if (/(weekly)/.test(f)) return 0; // not a daily schedule
  if (/(as needed|prn|sos)/.test(f)) return 0;
  return 1;
}

/** Default clock times for N doses/day. */
export function scheduleTimes(n: number): string[] {
  switch (n) {
    case 1: return ["08:00"];
    case 2: return ["08:00", "20:00"];
    case 3: return ["08:00", "14:00", "20:00"];
    case 4: return ["06:00", "12:00", "18:00", "22:00"];
    default: return [];
  }
}

export function parseDurationDays(duration?: string): number | undefined {
  if (!duration) return undefined;
  const m = duration.match(/(\d+)\s*(day|week|month)/i);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  return unit === "week" ? n * 7 : unit === "month" ? n * 30 : n;
}
