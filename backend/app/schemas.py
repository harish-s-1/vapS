"""Pydantic request/response schemas."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

Role = Literal["patient", "doctor", "pharmacy", "admin"]
Severity = Literal["low", "moderate", "high", "critical"]


# ---- Auth ----
class RegisterIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Role = "patient"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: Role


# ---- Prescriptions ----
class MedicineIn(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str | None = None
    instructions: str | None = None


class PrescriptionIn(BaseModel):
    patient_id: str
    medicines: list[MedicineIn] = Field(min_length=1)


class PrescriptionOut(BaseModel):
    id: str
    code: str
    patient_id: str
    doctor_id: str
    status: str
    signature_valid: bool
    qr_payload: str
    medicines: list[MedicineIn]


class VerifyOut(BaseModel):
    verified: bool
    reason: str | None = None
    prescription: PrescriptionOut | None = None


# ---- AI Clinical Safety ----
class SafetyIn(BaseModel):
    allergies: list[str] = []
    current_medications: list[str] = []
    new_prescription: list[str] = Field(min_length=1)


class Finding(BaseModel):
    kind: Literal["interaction", "allergy", "duplicate", "dosage"]
    severity: Severity
    title: str
    detail: str
    recommendation: str


class SafetyOut(BaseModel):
    risk_score: int
    risk_band: str
    findings: list[Finding]
