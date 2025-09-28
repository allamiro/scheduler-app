from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum
from datetime import date

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.EDITOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    week_start_date = Column(DateTime, nullable=False)  # Monday of the week
    week_end_date = Column(DateTime, nullable=False)    # Sunday of the week
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User")
    assignments = relationship("Assignment", back_populates="schedule", cascade="all, delete-orphan")

class AssignmentType(str, enum.Enum):
    ULTRASOUND_MORNING = "ultrasound_morning"
    ULTRASOUND_AFTERNOON = "ultrasound_afternoon"
    XRAY_MORNING = "xray_morning"
    XRAY_AFTERNOON = "xray_afternoon"
    CT_SCAN = "ct_scan"
    MRI = "mri"
    DUTY = "duty"

class Assignment(Base):
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    assignment_date = Column(DateTime, nullable=False)  # Specific date within the week
    assignment_type = Column(Enum(AssignmentType), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    schedule = relationship("Schedule", back_populates="assignments")
    doctor = relationship("Doctor")

class PublishedSchedule(Base):
    __tablename__ = "published_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    published_by = Column(Integer, ForeignKey("users.id"))
    published_at = Column(DateTime(timezone=True), server_default=func.now())
    html_content = Column(Text, nullable=False)  # Immutable HTML snapshot
    
    # Relationships
    schedule = relationship("Schedule")
    publisher = relationship("User")

class Capacity(Base):
    __tablename__ = "capacities"
    
    id = Column(Integer, primary_key=True, index=True)
    assignment_type = Column(Enum(AssignmentType), unique=True, nullable=False)
    max_capacity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
