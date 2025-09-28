from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import PublishedSchedule, Schedule, Assignment, Doctor, AssignmentType
from auth import get_current_user
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
import uuid
import json

router = APIRouter()

def validate_schedule_completeness(assignments: List[Assignment], week_dates: List[date]) -> None:
    """Validate that schedule is complete before publishing"""
    # Required assignment types for weekdays (Monday-Friday)
    weekday_types = [
        AssignmentType.ULTRASOUND_MORNING,
        AssignmentType.ULTRASOUND_AFTERNOON,
        AssignmentType.XRAY,
        AssignmentType.CT_SCAN,
        AssignmentType.MRI,
        AssignmentType.DUTY
    ]
    
    # Required assignment types for weekends (Saturday-Sunday) - only Duty
    weekend_types = [AssignmentType.DUTY]
    
    # Group assignments by date
    assignments_by_date = {}
    for assignment in assignments:
        assignment_date = assignment.assignment_date.date()
        if assignment_date not in assignments_by_date:
            assignments_by_date[assignment_date] = []
        assignments_by_date[assignment_date].append(assignment.assignment_type)
    
    missing_assignments = []
    
    for i, date_obj in enumerate(week_dates):
        # Convert datetime to date for comparison
        date_only = date_obj.date() if hasattr(date_obj, 'date') else date_obj
        weekday = date_only.weekday()  # 0=Monday, 6=Sunday
        is_weekend = weekday >= 5  # Saturday=5, Sunday=6
        
        required_types = weekend_types if is_weekend else weekday_types
        day_name = date_only.strftime('%A')
        
        if date_only not in assignments_by_date:
            # No assignments for this day
            missing_assignments.append(f"{day_name}: All required assignments missing")
            continue
        
        assigned_types = assignments_by_date[date_only]
        
        # Check for missing assignment types
        for required_type in required_types:
            if required_type not in assigned_types:
                missing_assignments.append(f"{day_name}: Missing {required_type.value.replace('_', ' ').title()}")
    
    if missing_assignments:
        error_message = "Cannot publish incomplete schedule. Missing assignments:\n" + "\n".join(missing_assignments)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )

class PublishScheduleRequest(BaseModel):
    prepared_by: str = None
    approved_by: str = None

class PublishedScheduleResponse(BaseModel):
    id: int
    slug: str
    schedule_id: int
    published_at: datetime
    week_start_date: date
    week_end_date: date

    class Config:
        from_attributes = True

class PublishedScheduleDetail(BaseModel):
    slug: str
    published_at: datetime
    week_start_date: date
    week_end_date: date
    assignments: Dict[str, List[Dict[str, Any]]]

def generate_schedule_html(schedule_data: Dict[str, Any], published_at: str, prepared_by: str = None, approved_by: str = None) -> str:
    """Generate HTML for published schedule"""
    week_dates = schedule_data['week_dates']
    assignments = schedule_data['assignments']
    
    # Assignment type labels
    assignment_labels = {
        AssignmentType.ULTRASOUND_MORNING: "ULTRASOUND Morning",
        AssignmentType.ULTRASOUND_AFTERNOON: "ULTRASOUND Afternoon",
        AssignmentType.XRAY: "X ray",
        AssignmentType.CT_SCAN: "CT-SCAN",
        AssignmentType.MRI: "MRI",
        AssignmentType.DUTY: "Duty"
    }
    
    # Generate approver/preparer section
    approver_section = ""
    if prepared_by or approved_by:
        approver_section = f"""
        <div class="approver-section" style="margin-bottom: 20px; text-align: center;">
            <div style="display: inline-block; margin: 0 20px;">
                <strong>Prepared by:</strong> {prepared_by or 'Not specified'}
            </div>
            <div style="display: inline-block; margin: 0 20px;">
                <strong>Approved by:</strong> {approved_by or 'Not specified'}
            </div>
        </div>
        """
    
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Duty Schedule - Week of {week_dates[0].strftime('%B %d, %Y')}</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 20px;
                background-color: white;
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }}
            .approver-section {{
                margin-bottom: 20px;
                text-align: center;
                font-size: 14px;
                color: #333;
            }}
            .schedule-table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }}
            .schedule-table th, .schedule-table td {{
                border: 1px solid #333;
                padding: 8px;
                text-align: center;
                vertical-align: top;
            }}
            .schedule-table th {{
                background-color: #f0f0f0;
                font-weight: bold;
            }}
            .date-header {{
                background-color: #e0e0e0;
                font-weight: bold;
            }}
            .assignment-cell {{
                min-height: 40px;
                min-width: 120px;
            }}
            .doctor-name {{
                background-color: #e8f4fd;
                margin: 2px;
                padding: 4px;
                border-radius: 3px;
                font-size: 12px;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
            }}
            @media print {{
                body {{ margin: 0; }}
                .schedule-table {{ page-break-inside: avoid; }}
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Radiology Duty Schedule</h1>
            <h2>Week of {week_dates[0].strftime('%B %d, %Y')} - {week_dates[6].strftime('%B %d, %Y')}</h2>
        </div>
        
        {approver_section}
        
        <table class="schedule-table">
            <thead>
                <tr>
                    <th>Date (EC)</th>
                    <th>Day</th>
                    <th>ULTRASOUND Morning</th>
                    <th>ULTRASOUND Afternoon</th>
                    <th>X ray</th>
                    <th>CT-SCAN</th>
                    <th>MRI</th>
                    <th>Duty</th>
                </tr>
            </thead>
            <tbody>
    """
    
    # Generate rows for each day
    for i, date_obj in enumerate(week_dates):
        day_name = date_obj.strftime('%A')
        html += f"""
                <tr>
                    <td class="date-header">{date_obj.strftime('%Y-%m-%d')}</td>
                    <td class="date-header">{day_name}</td>
        """
        
        # Generate cells for each assignment type
        assignment_types = [
            AssignmentType.ULTRASOUND_MORNING,
            AssignmentType.ULTRASOUND_AFTERNOON,
            AssignmentType.XRAY,
            AssignmentType.CT_SCAN,
            AssignmentType.MRI,
            AssignmentType.DUTY
        ]
        
        for assignment_type in assignment_types:
            cell_key = f"{date_obj.isoformat()}_{assignment_type.value}"
            doctors = assignments.get(cell_key, [])
            
            html += f'<td class="assignment-cell">'
            for doctor in doctors:
                html += f'<div class="doctor-name">{doctor["name"]}</div>'
            html += '</td>'
        
        html += '</tr>'
    
    html += f"""
            </tbody>
        </table>
        
        <div class="footer">
            <p>Published on {published_at}</p>
            <p>This schedule is read-only and cannot be modified.</p>
        </div>
    </body>
    </html>
    """
    
    return html

@router.post("/{schedule_id}/publish", response_model=PublishedScheduleResponse)
async def publish_schedule(
    schedule_id: int,
    request: PublishScheduleRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Publish a schedule to create an immutable snapshot"""
    # Get the schedule
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    # Get all assignments for this schedule
    assignments = db.query(Assignment).filter(Assignment.schedule_id == schedule_id).all()
    
    # Get week dates
    week_dates = [schedule.week_start_date + timedelta(days=i) for i in range(7)]
    
    # Validate schedule completeness before publishing
    validate_schedule_completeness(assignments, week_dates)
    
    # Organize assignments by date and type
    assignments_dict = {}
    for assignment in assignments:
        doctor = db.query(Doctor).filter(Doctor.id == assignment.doctor_id).first()
        if doctor:
            cell_key = f"{assignment.assignment_date.isoformat()}_{assignment.assignment_type.value}"
            if cell_key not in assignments_dict:
                assignments_dict[cell_key] = []
            assignments_dict[cell_key].append({
                "id": doctor.id,
                "name": doctor.name,
                "email": doctor.email,
                "phone": doctor.phone
            })
    
    # Generate HTML content
    schedule_data = {
        'week_dates': week_dates,
        'assignments': assignments_dict
    }
    
    # Format the published date
    published_at_str = datetime.utcnow().strftime('%B %d, %Y at %I:%M %p UTC')
    
    html_content = generate_schedule_html(
        schedule_data, 
        published_at_str, 
        request.prepared_by, 
        request.approved_by
    )
    
    # Generate unique slug
    slug = str(uuid.uuid4())[:8]
    
    # Create published schedule
    published_schedule = PublishedSchedule(
        slug=slug,
        schedule_id=schedule_id,
        published_by=current_user.id,
        html_content=html_content
    )
    db.add(published_schedule)
    
    # Mark schedule as published
    schedule.is_published = True
    
    db.commit()
    db.refresh(published_schedule)
    
    return PublishedScheduleResponse(
        id=published_schedule.id,
        slug=published_schedule.slug,
        schedule_id=published_schedule.schedule_id,
        published_at=published_schedule.published_at,
        week_start_date=schedule.week_start_date,
        week_end_date=schedule.week_end_date
    )

@router.get("/", response_model=List[PublishedScheduleResponse])
async def get_published_schedules(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all published schedules"""
    published_schedules = db.query(PublishedSchedule).all()
    result = []
    for pub_schedule in published_schedules:
        schedule = db.query(Schedule).filter(Schedule.id == pub_schedule.schedule_id).first()
        result.append(PublishedScheduleResponse(
            id=pub_schedule.id,
            slug=pub_schedule.slug,
            schedule_id=pub_schedule.schedule_id,
            published_at=pub_schedule.published_at,
            week_start_date=schedule.week_start_date if schedule else None,
            week_end_date=schedule.week_end_date if schedule else None
        ))
    return result

@router.get("/{slug}")
async def get_published_schedule(slug: str, db: Session = Depends(get_db)):
    """Get published schedule by slug (public access)"""
    published_schedule = db.query(PublishedSchedule).filter(PublishedSchedule.slug == slug).first()
    if not published_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Published schedule not found"
        )
    
    return {"html_content": published_schedule.html_content}

@router.delete("/{schedule_id}/unpublish")
async def unpublish_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Unpublish a schedule to allow editing"""
    # Check if user has permission (admin or editor)
    if current_user.role not in ['admin', 'editor']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and editors can unpublish schedules"
        )
    
    # Get the schedule
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    if not schedule.is_published:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Schedule is not published"
        )
    
    # Mark schedule as unpublished
    schedule.is_published = False
    
    # Delete all published versions of this schedule
    db.query(PublishedSchedule).filter(PublishedSchedule.schedule_id == schedule_id).delete()
    
    db.commit()
    
    return {"message": "Schedule unpublished successfully"}
