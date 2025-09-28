from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import get_db
from models import Doctor, Assignment
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
    
    # Check if doctor has any assignments
    assignments = db.query(Assignment).filter(Assignment.doctor_id == doctor_id).all()
    if assignments:
        # Get detailed assignment information
        from sqlalchemy import text
        assignment_details = db.execute(text("""
            SELECT 
                a.id as assignment_id,
                a.assignment_date,
                a.assignment_type,
                s.id as schedule_id,
                TO_CHAR(s.week_start_date, 'Mon DD, YYYY') || ' - ' || TO_CHAR(s.week_end_date, 'Mon DD, YYYY') as week_range
            FROM assignments a
            JOIN schedules s ON a.schedule_id = s.id
            WHERE a.doctor_id = :doctor_id
            ORDER BY s.week_start_date
        """), {"doctor_id": doctor_id}).fetchall()
        
        # Format assignment details
        assignment_list = []
        for detail in assignment_details:
            assignment_list.append(f"• {detail.week_range} ({detail.assignment_type.replace('_', ' ').title()})")
        
        assignments_text = "\n".join(assignment_list)
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete doctor '{doctor.name}' because they have {len(assignments)} assignment(s):\n\n{assignments_text}\n\nPlease remove these assignments first or deactivate the doctor instead."
        )
    
    try:
        db.delete(doctor)
        db.commit()
        return {"message": "Doctor deleted successfully"}
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete doctor '{doctor.name}' because they are referenced by other records. Please remove all assignments first."
        )

@router.delete("/{doctor_id}/assignments")
async def clear_doctor_assignments(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Clear all assignments for a specific doctor"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Get assignments count before deletion
    assignments = db.query(Assignment).filter(Assignment.doctor_id == doctor_id).all()
    assignment_count = len(assignments)
    
    if assignment_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Doctor '{doctor.name}' has no assignments to clear."
        )
    
    # Delete all assignments for this doctor
    db.query(Assignment).filter(Assignment.doctor_id == doctor_id).delete()
    db.commit()
    
    return {
        "message": f"Successfully cleared {assignment_count} assignment(s) for doctor '{doctor.name}'",
        "cleared_count": assignment_count
    }
