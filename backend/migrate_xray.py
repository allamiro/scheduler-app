#!/usr/bin/env python3
"""
Migration script to update X-ray assignments from morning/afternoon to single shift
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Assignment, AssignmentType, Capacity
from sqlalchemy import text

def migrate_xray_assignments():
    """Migrate X-ray assignments from morning/afternoon to single shift"""
    db = SessionLocal()
    try:
        print("🔄 Starting X-ray assignment migration...")
        
        # Update existing X-ray morning assignments to X-ray
        morning_assignments = db.query(Assignment).filter(
            Assignment.assignment_type == "xray_morning"
        ).all()
        
        print(f"📋 Found {len(morning_assignments)} X-ray morning assignments to migrate")
        
        for assignment in morning_assignments:
            assignment.assignment_type = AssignmentType.XRAY
            print(f"  ✅ Migrated assignment {assignment.id} from X-ray morning to X-ray")
        
        # Update existing X-ray afternoon assignments to X-ray
        afternoon_assignments = db.query(Assignment).filter(
            Assignment.assignment_type == "xray_afternoon"
        ).all()
        
        print(f"📋 Found {len(afternoon_assignments)} X-ray afternoon assignments to migrate")
        
        for assignment in afternoon_assignments:
            assignment.assignment_type = AssignmentType.XRAY
            print(f"  ✅ Migrated assignment {assignment.id} from X-ray afternoon to X-ray")
        
        # Update capacity records
        print("🔄 Updating capacity records...")
        
        # Remove old X-ray morning/afternoon capacities
        old_capacities = db.query(Capacity).filter(
            Capacity.assignment_type.in_(["xray_morning", "xray_afternoon"])
        ).all()
        
        for capacity in old_capacities:
            print(f"  🗑️ Removing old capacity: {capacity.assignment_type}")
            db.delete(capacity)
        
        # Create new X-ray capacity
        existing_xray_capacity = db.query(Capacity).filter(
            Capacity.assignment_type == AssignmentType.XRAY
        ).first()
        
        if not existing_xray_capacity:
            new_capacity = Capacity(
                assignment_type=AssignmentType.XRAY,
                max_capacity=2
            )
            db.add(new_capacity)
            print("  ✅ Created new X-ray capacity (max: 2)")
        else:
            print("  ℹ️ X-ray capacity already exists")
        
        # Commit all changes
        db.commit()
        print("✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_xray_assignments()
