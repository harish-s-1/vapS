import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user, get_db, require_roles
from app.models import Prescription, PrescriptionMedicine
from app.schemas import MedicineIn, PrescriptionIn, PrescriptionOut, VerifyOut

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


def _generate_code() -> str:
    return "VTX-RX-" + secrets.token_hex(4).upper()


def _to_out(rx: Prescription) -> PrescriptionOut:
    return PrescriptionOut(
        id=str(rx.id), code=rx.code, patient_id=str(rx.patient_id), doctor_id=str(rx.doctor_id),
        status=rx.status, signature_valid=rx.signature_valid, qr_payload=rx.qr_payload,
        medicines=[MedicineIn(name=m.name, dosage=m.dosage, frequency=m.frequency,
                              duration=m.duration, instructions=m.instructions) for m in rx.medicines],
    )


@router.post("", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    body: PrescriptionIn,
    db: AsyncSession = Depends(get_db),
    doctor: dict = Depends(require_roles("doctor")),
):
    code = _generate_code()
    rx = Prescription(
        code=code,
        patient_id=body.patient_id,
        doctor_id=doctor["id"],
        signature=f"sig::{doctor['id']}::{code}",  # replace with real signing in prod
        qr_payload=f"https://pats.health/verify/{code}",
        medicines=[PrescriptionMedicine(**m.model_dump()) for m in body.medicines],
    )
    db.add(rx)
    await db.commit()
    await db.refresh(rx, attribute_names=["medicines"])
    return _to_out(rx)


@router.get("/verify/{code}", response_model=VerifyOut)
async def verify_prescription(code: str, db: AsyncSession = Depends(get_db)):
    rx = await db.scalar(
        select(Prescription).where(Prescription.code == code).options(selectinload(Prescription.medicines))
    )
    if not rx:
        return VerifyOut(verified=False, reason="Prescription not found in the network.")
    if not rx.signature_valid:
        return VerifyOut(verified=False, reason="Doctor signature could not be validated.")
    if rx.status == "expired":
        return VerifyOut(verified=False, reason="This prescription has expired.")
    return VerifyOut(verified=True, prescription=_to_out(rx))


@router.get("/mine", response_model=list[PrescriptionOut])
async def my_prescriptions(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = await db.scalars(
        select(Prescription)
        .where(Prescription.patient_id == user["id"])
        .options(selectinload(Prescription.medicines))
    )
    return [_to_out(r) for r in rows]
