#!/usr/bin/env python3
"""Update database schema to add is_admin column to User table"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, User, ensure_db

def update_schema():
    """Add is_admin column to User table if it doesn't exist"""
    with app.app_context():
        ensure_db()
        
        # Check if is_admin column exists
        try:
            result = db.session.execute(db.text("PRAGMA table_info(user)")).fetchall()
            columns = [row[1] for row in result]  # Column names are in index 1
            
            if 'is_admin' not in columns:
                print("Adding is_admin column to User table...")
                # Add the column with default value False
                db.session.execute(db.text("ALTER TABLE user ADD COLUMN is_admin BOOLEAN DEFAULT 0 NOT NULL"))
                db.session.commit()
                print("[OK] Added is_admin column to User table")
            else:
                print("[OK] is_admin column already exists")
            
            # Update demo admin user if it exists
            admin_user = User.query.filter_by(email="techdlt@gmail.com").first()
            if admin_user:
                if not admin_user.is_admin:
                    admin_user.is_admin = True
                    db.session.commit()
                    print("[OK] Updated demo admin user with admin privileges")
                else:
                    print("[OK] Demo admin user already has admin privileges")
            else:
                print("ℹ No demo admin user found (run ensure_admin_user.py to create one)")
                
        except Exception as e:
            print(f"Error updating schema: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    update_schema()

