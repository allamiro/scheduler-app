from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from database import get_db
from models import Schedule, Assignment, Doctor, AssignmentType, Capacity
from auth import get_current_user
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from typing import List, Optional
import uuid

router = APIRouter()

class AssignmentCreate(BaseModel):
    doctor_id: int
    assignment_date: date
    assignment_type: AssignmentType

class AssignmentResponse(BaseModel):
    id: int
    doctor_id: int
    assignment_date: date
    assignment_type: AssignmentType
    doctor_name: str

    class Config:
        from_attributes = True

class ScheduleResponse(BaseModel):
    id: int
    week_start_date: date
    week_end_date: date
    assignments: List[AssignmentResponse]

    class Config:
        from_attributes = True

class ScheduleCreate(BaseModel):
    week_start_date: date

def get_week_dates(week_start: date) -> List[date]:
    """Get all 7 dates for a week starting from Monday"""
    return [week_start + timedelta(days=i) for i in range(7)]

def validate_assignment(db: Session, assignment_data: AssignmentCreate, schedule_id: int) -> None:
    """Validate assignment constraints"""
    # Check if doctor exists and is active
    doctor = db.query(Doctor).filter(Doctor.id == assignment_data.doctor_id).first()
    if not doctor or not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor not found or inactive"
        )
    
    # Check capacity constraint
    capacity = db.query(Capacity).filter(Capacity.assignment_type == assignment_data.assignment_type).first()
    if not capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment type capacity not configured"
        )
    
    current_count = db.query(Assignment).filter(
        and_(
            Assignment.schedule_id == schedule_id,
            Assignment.assignment_date == assignment_data.assignment_date,
            Assignment.assignment_type == assignment_data.assignment_type
        )
    ).count()
    
    if current_count >= capacity.max_capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Capacity exceeded for {assignment_data.assignment_type.value}. Max: {capacity.max_capacity}"
        )
    
    # Check double-booking constraint (doctor can't be assigned twice on same date)
    existing_assignment = db.query(Assignment).filter(
        and_(
            Assignment.schedule_id == schedule_id,
            Assignment.doctor_id == assignment_data.doctor_id,
            Assignment.assignment_date == assignment_data.assignment_date
        )
    ).first()
    
    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor already assigned on this date"
        )

@router.get("/", response_model=List[ScheduleResponse])
async def get_schedules(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all schedules"""
    schedules = db.query(Schedule).all()
    result = []
    for schedule in schedules:
        assignments = db.query(Assignment).filter(Assignment.schedule_id == schedule.id).all()
        assignment_responses = []
        for assignment in assignments:
            doctor = db.query(Doctor).filter(Doctor.id == assignment.doctor_id).first()
            assignment_responses.append(AssignmentResponse(
                id=assignment.id,
                doctor_id=assignment.doctor_id,
                assignment_date=assignment.assignment_date,
                assignment_type=assignment.assignment_type,
                doctor_name=doctor.name if doctor else "Unknown"
            ))
        result.append(ScheduleResponse(
            id=schedule.id,
            week_start_date=schedule.week_start_date,
            week_end_date=schedule.week_end_date,
            assignments=assignment_responses
        ))
    return result

@router.post("/", response_model=ScheduleResponse)
async def create_schedule(
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new schedule for a week"""
    # Calculate week end date (Sunday)
    week_end = schedule_data.week_start_date + timedelta(days=6)
    
    # Check if schedule already exists for this week
    existing_schedule = db.query(Schedule).filter(
        and_(
            Schedule.week_start_date == schedule_data.week_start_date,
            Schedule.week_end_date == week_end
        )
    ).first()
    
    if existing_schedule:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Schedule already exists for this week"
        )
    
    schedule = Schedule(
        week_start_date=schedule_data.week_start_date,
        week_end_date=week_end,
        created_by=current_user.id
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    
    return ScheduleResponse(
        id=schedule.id,
        week_start_date=schedule.week_start_date,
        week_end_date=schedule.week_end_date,
        assignments=[]
    )

@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific schedule"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    assignments = db.query(Assignment).filter(Assignment.schedule_id == schedule_id).all()
    assignment_responses = []
    for assignment in assignments:
        doctor = db.query(Doctor).filter(Doctor.id == assignment.doctor_id).first()
        assignment_responses.append(AssignmentResponse(
            id=assignment.id,
            doctor_id=assignment.doctor_id,
            assignment_date=assignment.assignment_date,
            assignment_type=assignment.assignment_type,
            doctor_name=doctor.name if doctor else "Unknown"
        ))
    
    return ScheduleResponse(
        id=schedule.id,
        week_start_date=schedule.week_start_date,
        week_end_date=schedule.week_end_date,
        assignments=assignment_responses
    )

@router.post("/{schedule_id}/assignments", response_model=AssignmentResponse)
async def create_assignment(
    schedule_id: int,
    assignment_data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new assignment"""
    # Check if schedule exists
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    # Validate assignment constraints
    validate_assignment(db, assignment_data, schedule_id)
    
    assignment = Assignment(
        schedule_id=schedule_id,
        doctor_id=assignment_data.doctor_id,
        assignment_date=assignment_data.assignment_date,
        assignment_type=assignment_data.assignment_type
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    doctor = db.query(Doctor).filter(Doctor.id == assignment.doctor_id).first()
    return AssignmentResponse(
        id=assignment.id,
        doctor_id=assignment.doctor_id,
        assignment_date=assignment.assignment_date,
        assignment_type=assignment.assignment_type,
        doctor_name=doctor.name if doctor else "Unknown"
    )

@router.delete("/{schedule_id}/assignments/{assignment_id}")
async def delete_assignment(
    schedule_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete an assignment"""
    assignment = db.query(Assignment).filter(
        and_(
            Assignment.id == assignment_id,
            Assignment.schedule_id == schedule_id
        )
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted successfully"}

@router.get("/week/{week_start_date}", response_model=ScheduleResponse)
async def get_schedule_by_week(
    week_start_date: date,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get schedule for a specific week"""
    week_end = week_start_date + timedelta(days=6)
    schedule = db.query(Schedule).filter(
        and_(
            Schedule.week_start_date == week_start_date,
            Schedule.week_end_date == week_end
        )
    ).first()
    
    if not schedule:
        # Create schedule if not found
        schedule = Schedule(
            week_start_date=week_start_date,
            week_end_date=week_end,
            created_by=current_user.id
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
    
    assignments = db.query(Assignment).filter(Assignment.schedule_id == schedule.id).all()
    assignment_responses = []
    for assignment in assignments:
        doctor = db.query(Doctor).filter(Doctor.id == assignment.doctor_id).first()
        assignment_responses.append(AssignmentResponse(
            id=assignment.id,
            doctor_id=assignment.doctor_id,
            assignment_date=assignment.assignment_date,
            assignment_type=assignment.assignment_type,
            doctor_name=doctor.name if doctor else "Unknown"
        ))
    
    return ScheduleResponse(
        id=schedule.id,
        week_start_date=schedule.week_start_date,
        week_end_date=schedule.week_end_date,
        assignments=assignment_responses
    )
