#!/usr/bin/env python3
"""
Fix X-ray capacity record to use proper enum instead of string
"""
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Capacity, AssignmentType

def fix_xray_capacity():
    """Fix X-ray capacity record"""
    db = SessionLocal()
    
    try:
        # Find the problematic X-ray capacity record
        xray_capacity = db.query(Capacity).filter(Capacity.assignment_type == "xray").first()
        
        if xray_capacity:
            print(f"Found X-ray capacity record with string value: {xray_capacity.assignment_type}")
            print(f"Max capacity: {xray_capacity.max_capacity}")
            
            # Delete the old record
            db.delete(xray_capacity)
            db.commit()
            print("✓ Deleted old X-ray capacity record")
            
            # Create new record with proper enum
            new_capacity = Capacity(
                assignment_type=AssignmentType.XRAY,
                max_capacity=xray_capacity.max_capacity
            )
            db.add(new_capacity)
            db.commit()
            print("✓ Created new X-ray capacity record with proper enum")
            
        else:
            print("No X-ray capacity record found with string value")
            
        # Verify the fix
        fixed_capacity = db.query(Capacity).filter(Capacity.assignment_type == AssignmentType.XRAY).first()
        if fixed_capacity:
            print(f"✓ Verification: X-ray capacity now uses enum: {fixed_capacity.assignment_type}")
            print(f"✓ Max capacity: {fixed_capacity.max_capacity}")
        else:
            print("❌ Verification failed: No X-ray capacity found")
            
    except Exception as e:
        print(f"❌ Error fixing X-ray capacity: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 Fixing X-ray capacity record...")
    fix_xray_capacity()
    print("✅ X-ray capacity fix completed!")
