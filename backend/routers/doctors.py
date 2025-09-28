from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Doctor
from auth import get_current_user
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter()

class DoctorCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

class DoctorResponse(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

@router.get("/", response_model=list[DoctorResponse])
async def get_doctors(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all doctors"""
    doctors = db.query(Doctor).all()
    return doctors

@router.post("/", response_model=DoctorResponse)
async def create_doctor(
    doctor_data: DoctorCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new doctor"""
    # Check if email already exists (if provided)
    if doctor_data.email:
        existing_doctor = db.query(Doctor).filter(Doctor.email == doctor_data.email).first()
        if existing_doctor:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    db_doctor = Doctor(
        name=doctor_data.name,
        email=doctor_data.email,
        phone=doctor_data.phone
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

@router.get("/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific doctor"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    return doctor

@router.put("/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(
    doctor_id: int,
    doctor_data: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a doctor"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Update fields if provided
    if doctor_data.name is not None:
        doctor.name = doctor_data.name
    
    if doctor_data.email is not None:
        # Check if new email already exists
        existing_doctor = db.query(Doctor).filter(Doctor.email == doctor_data.email).first()
        if existing_doctor and existing_doctor.id != doctor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already taken"
            )
        doctor.email = doctor_data.email
    
    if doctor_data.phone is not None:
        doctor.phone = doctor_data.phone
    
    if doctor_data.is_active is not None:
        doctor.is_active = doctor_data.is_active
    
    db.commit()
    db.refresh(doctor)
    return doctor

@router.delete("/{doctor_id}")
async def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a doctor"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    db.delete(doctor)
    db.commit()
    return {"message": "Doctor deleted successfully"}
