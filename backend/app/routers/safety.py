from fastapi import APIRouter, Depends

from app.core.deps import require_roles
from app.schemas import SafetyIn, SafetyOut
from app.services.safety import analyze

router = APIRouter(prefix="/safety", tags=["ai-clinical-safety"])


@router.post("/check", response_model=SafetyOut)
async def safety_check(body: SafetyIn, _: dict = Depends(require_roles("doctor", "pharmacy", "admin"))):
    """Run drug-interaction, allergy and duplicate analysis; return a risk score."""
    return analyze(body)
