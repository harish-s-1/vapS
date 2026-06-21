"""AI Clinical Safety Engine (Module 5).

A deterministic rules engine over a curated interaction/allergy table, with an
optional Gemini-powered narrative layer. The rules engine guarantees the core
checks always run even if the LLM is unavailable.
"""
from app.schemas import Finding, SafetyIn, SafetyOut

INTERACTIONS: dict[str, list[tuple[str, str, str, str]]] = {
    # drug_a -> list of (drug_b_substring, severity, detail, recommendation)
    "aspirin": [
        ("atorvastatin", "moderate", "Increased risk of myopathy when combined.",
         "Monitor for muscle pain; check CK if symptomatic."),
        ("warfarin", "high", "Markedly increased bleeding risk.",
         "Avoid combination unless clearly indicated; monitor INR closely."),
    ],
    "metformin": [
        ("contrast", "high", "Risk of lactic acidosis with iodinated contrast.",
         "Pause metformin 48h around contrast imaging."),
    ],
    "ibuprofen": [
        ("lisinopril", "moderate", "NSAIDs reduce ACE-inhibitor efficacy and risk renal injury.",
         "Prefer paracetamol; monitor renal function and BP."),
    ],
}

SEVERITY_WEIGHT = {"low": 8, "moderate": 22, "high": 40, "critical": 60}


def _norm(s: str) -> str:
    return s.strip().lower()


def analyze(data: SafetyIn) -> SafetyOut:
    findings: list[Finding] = []
    incoming = [_norm(m) for m in data.new_prescription if m.strip()]
    current = [_norm(m) for m in data.current_medications if m.strip()]
    allergies = [_norm(a) for a in data.allergies if a.strip()]
    everything = current + incoming

    # 1. Duplicates
    seen: set[str] = set()
    for med in everything:
        head = med.split()[0] if med else med
        if head in seen:
            findings.append(Finding(
                kind="duplicate", severity="moderate", title=f"Duplicate: {head}",
                detail="This medicine appears more than once across the regimen.",
                recommendation="Consolidate to a single order to avoid double-dosing.",
            ))
        seen.add(head)

    # 2. Interactions (pairwise)
    for i in range(len(everything)):
        for j in range(i + 1, len(everything)):
            a, b = everything[i], everything[j]
            for key, rules in INTERACTIONS.items():
                if key in a:
                    for sub, sev, detail, rec in rules:
                        if sub in b:
                            findings.append(Finding(
                                kind="interaction", severity=sev,
                                title=f"{a.split()[0]} + {b.split()[0]}",
                                detail=detail, recommendation=rec,
                            ))

    # 3. Allergy conflicts
    for med in incoming:
        for allergy in allergies:
            if allergy[:4] and allergy[:4] in med:
                findings.append(Finding(
                    kind="allergy", severity="critical", title=f"Allergy: {med.split()[0]}",
                    detail=f"Patient has a recorded allergy to {allergy}.",
                    recommendation="Do not prescribe. Select an alternative agent.",
                ))

    score = min(100, sum(SEVERITY_WEIGHT[f.severity] for f in findings))
    band = "High Risk" if score >= 60 else "Moderate Risk" if score >= 30 else "Low Risk"
    return SafetyOut(risk_score=score, risk_band=band, findings=findings)
