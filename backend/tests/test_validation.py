import pytest
from datetime import date, datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from models import Doctor, Schedule, Assignment, AssignmentType, Capacity
from routers.schedules import validate_assignment, AssignmentCreate

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def sample_doctor(db):
    doctor = Doctor(
        name="Dr. Test Doctor",
        email="test@example.com",
        phone="+1234567890",
        is_active=True
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor

@pytest.fixture
def sample_schedule(db):
    schedule = Schedule(
        week_start_date=datetime(2024, 1, 1),
        week_end_date=datetime(2024, 1, 7),
        created_by=1
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule

@pytest.fixture
def sample_capacities(db):
    capacities = [
        Capacity(assignment_type=AssignmentType.ULTRASOUND_MORNING, max_capacity=3),
        Capacity(assignment_type=AssignmentType.XRAY_MORNING, max_capacity=2),
        Capacity(assignment_type=AssignmentType.CT_SCAN, max_capacity=1),
    ]
    for capacity in capacities:
        db.add(capacity)
    db.commit()
    return capacities

def test_validate_assignment_success(db, sample_doctor, sample_schedule, sample_capacities):
    """Test successful assignment validation"""
    assignment_data = AssignmentCreate(
        doctor_id=sample_doctor.id,
        assignment_date=date(2024, 1, 1),
        assignment_type=AssignmentType.ULTRASOUND_MORNING
    )

    # Should not raise any exception
    validate_assignment(db, assignment_data, sample_schedule.id)

def test_validate_assignment_capacity_exceeded(db, sample_doctor, sample_schedule, sample_capacities):
    """Test assignment validation when capacity is exceeded"""
    # Fill up the capacity first
    for i in range(3):  # Capacity is 3
        assignment = Assignment(
            schedule_id=sample_schedule.id,
            doctor_id=sample_doctor.id,
            assignment_date=date(2024, 1, 1),
            assignment_type=AssignmentType.ULTRASOUND_MORNING
        )
        db.add(assignment)
    db.commit()
    
    assignment_data = AssignmentCreate(
        doctor_id=sample_doctor.id,
        assignment_date=date(2024, 1, 1),
        assignment_type=AssignmentType.ULTRASOUND_MORNING
    )
    
    with pytest.raises(Exception) as exc_info:
        validate_assignment(db, assignment_data, sample_schedule.id)
    
    assert "Capacity exceeded" in str(exc_info.value)

def test_validate_assignment_double_booking(db, sample_doctor, sample_schedule, sample_capacities):
    """Test assignment validation for double booking"""
    # Create existing assignment
    assignment = Assignment(
        schedule_id=sample_schedule.id,
        doctor_id=sample_doctor.id,
        assignment_date=date(2024, 1, 1),
        assignment_type=AssignmentType.ULTRASOUND_MORNING
    )
    db.add(assignment)
    db.commit()
    
    # Try to assign same doctor to different type on same date
    assignment_data = AssignmentCreate(
        doctor_id=sample_doctor.id,
        assignment_date=date(2024, 1, 1),
        assignment_type=AssignmentType.XRAY_MORNING
    )
    
    with pytest.raises(Exception) as exc_info:
        validate_assignment(db, assignment_data, sample_schedule.id)
    
    assert "already assigned" in str(exc_info.value)

def test_validate_assignment_inactive_doctor(db, sample_doctor, sample_schedule, sample_capacities):
    """Test assignment validation with inactive doctor"""
    # Make doctor inactive
    sample_doctor.is_active = False
    db.commit()
    
    assignment_data = AssignmentCreate(
        doctor_id=sample_doctor.id,
        assignment_date=date(2024, 1, 1),
        assignment_type=AssignmentType.ULTRASOUND_MORNING
    )
    
    with pytest.raises(Exception) as exc_info:
        validate_assignment(db, assignment_data, sample_schedule.id)
    
    assert "inactive" in str(exc_info.value)

def test_validate_assignment_nonexistent_doctor(db, sample_schedule, sample_capacities):
    """Test assignment validation with non-existent doctor"""
    assignment_data = AssignmentCreate(
        doctor_id=999,  # Non-existent doctor ID
        assignment_date=date(2024, 1, 1),
        assignment_type=AssignmentType.ULTRASOUND_MORNING
    )
    
    with pytest.raises(Exception) as exc_info:
        validate_assignment(db, assignment_data, sample_schedule.id)
    
    assert "not found" in str(exc_info.value)
