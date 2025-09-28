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

def generate_schedule_html(schedule_data: Dict[str, Any]) -> str:
    """Generate HTML for published schedule"""
    week_dates = schedule_data['week_dates']
    assignments = schedule_data['assignments']
    
    # Assignment type labels
    assignment_labels = {
        AssignmentType.ULTRASOUND_MORNING: "ULTRASOUND Morning",
        AssignmentType.ULTRASOUND_AFTERNOON: "ULTRASOUND Afternoon",
        AssignmentType.XRAY_MORNING: "X ray Morning",
        AssignmentType.XRAY_AFTERNOON: "X ray Afternoon",
        AssignmentType.CT_SCAN: "CT-SCAN",
        AssignmentType.MRI: "MRI",
        AssignmentType.DUTY: "Duty"
    }
    
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
        
        <table class="schedule-table">
            <thead>
                <tr>
                    <th>Date (EC)</th>
                    <th>Day</th>
                    <th>ULTRASOUND Morning</th>
                    <th>ULTRASOUND Afternoon</th>
                    <th>X ray Morning</th>
                    <th>X ray Afternoon</th>
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
        for assignment_type in AssignmentType:
            cell_key = f"{date_obj.isoformat()}_{assignment_type.value}"
            doctors = assignments.get(cell_key, [])
            
            html += f'<td class="assignment-cell">'
            for doctor in doctors:
                html += f'<div class="doctor-name">{doctor["name"]}</div>'
            html += '</td>'
        
        html += '</tr>'
    
    html += """
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
    html_content = generate_schedule_html(schedule_data)
    
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
