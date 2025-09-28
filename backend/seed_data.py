#!/usr/bin/env python3
"""
Seed script to initialize the database with default data
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, User, Doctor, Capacity, AssignmentType, UserRole
from auth import get_password_hash
from datetime import datetime

def create_default_capacities(db: Session):
    """Create default capacity configurations"""
    capacities = [
        (AssignmentType.ULTRASOUND_MORNING, 3),
        (AssignmentType.ULTRASOUND_AFTERNOON, 3),
        ("xray", 2),
        (AssignmentType.CT_SCAN, 1),
        (AssignmentType.MRI, 1),
        (AssignmentType.DUTY, 1),
    ]
    
    for assignment_type, max_capacity in capacities:
        # Handle string values for xray
        if assignment_type == "xray":
            existing = db.query(Capacity).filter(Capacity.assignment_type == "xray").first()
        else:
            existing = db.query(Capacity).filter(Capacity.assignment_type == assignment_type).first()
        
        if not existing:
            capacity = Capacity(
                assignment_type=assignment_type,
                max_capacity=max_capacity
            )
            db.add(capacity)
    
    db.commit()
    print("✓ Default capacities created")

def create_default_users(db: Session):
    """Create default admin, editor, and viewer users"""
    # Admin user
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@scheduler.com",
            hashed_password=get_password_hash("admin"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
    
    # Editor user
    editor_user = db.query(User).filter(User.username == "editor").first()
    if not editor_user:
        editor_user = User(
            username="editor",
            email="editor@scheduler.com",
            hashed_password=get_password_hash("editor"),
            role=UserRole.EDITOR,
            is_active=True
        )
        db.add(editor_user)
    
    # Viewer user
    viewer_user = db.query(User).filter(User.username == "viewer").first()
    if not viewer_user:
        viewer_user = User(
            username="viewer",
            email="viewer@scheduler.com",
            hashed_password=get_password_hash("viewer"),
            role=UserRole.VIEWER,
            is_active=True
        )
        db.add(viewer_user)
    
    db.commit()
    print("✓ Default users created")
    print("  Admin: username=admin, password=admin")
    print("  Editor: username=editor, password=editor")
    print("  Viewer: username=viewer, password=viewer")

def create_sample_doctors(db: Session):
    """Create sample doctors"""
    sample_doctors = [
        {"name": "Dr. Ahmed Hassan", "email": "ahmed.hassan@hospital.com", "phone": "+251911234567"},
        {"name": "Dr. Fatima Ali", "email": "fatima.ali@hospital.com", "phone": "+251911234568"},
        {"name": "Dr. Mohammed Ibrahim", "email": "mohammed.ibrahim@hospital.com", "phone": "+251911234569"},
        {"name": "Dr. Aisha Mohamed", "email": "aisha.mohamed@hospital.com", "phone": "+251911234570"},
        {"name": "Dr. Omar Ahmed", "email": "omar.ahmed@hospital.com", "phone": "+251911234571"},
        {"name": "Dr. Khadija Hassan", "email": "khadija.hassan@hospital.com", "phone": "+251911234572"},
        {"name": "Dr. Yusuf Ali", "email": "yusuf.ali@hospital.com", "phone": "+251911234573"},
        {"name": "Dr. Amina Ibrahim", "email": "amina.ibrahim@hospital.com", "phone": "+251911234574"},
        {"name": "Dr. Hassan Mohamed", "email": "hassan.mohamed@hospital.com", "phone": "+251911234575"},
        {"name": "Dr. Zainab Ahmed", "email": "zainab.ahmed@hospital.com", "phone": "+251911234576"},
    ]
    
    for doctor_data in sample_doctors:
        existing = db.query(Doctor).filter(Doctor.email == doctor_data["email"]).first()
        if not existing:
            doctor = Doctor(
                name=doctor_data["name"],
                email=doctor_data["email"],
                phone=doctor_data["phone"],
                is_active=True
            )
            db.add(doctor)
    
    db.commit()
    print("✓ Sample doctors created")

def main():
    """Main seed function"""
    print("🌱 Seeding database...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Seed data
        create_default_capacities(db)
        create_default_users(db)
        create_sample_doctors(db)
        
        print("\n🎉 Database seeded successfully!")
        print("\nDefault login credentials:")
        print("Admin: admin / admin")
        print("Editor: editor / editor")
        print("Viewer: viewer / viewer")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
