#!/usr/bin/env python3
"""Migrate admin user credentials from old email to new email"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, User, generate_password_hash, ensure_db

def migrate_admin_credentials():
    with app.app_context():
        ensure_db()
        
        old_email = "demo@dealsdouble.ai"
        new_email = "techdlt@gmail.com"
        new_password = "Erode1213@"
        
        # Check for old admin user
        old_admin = User.query.filter_by(email=old_email).first()
        new_admin = User.query.filter_by(email=new_email).first()
        
        if old_admin:
            print(f"[INFO] Found old admin user: {old_email}")
            
            if new_admin:
                print(f"[INFO] New admin user already exists: {new_email}")
                print("[INFO] Updating new admin user credentials...")
                new_admin.name = "ADMIN"
                new_admin.password_hash = generate_password_hash(new_password)
                new_admin.is_admin = True
                db.session.commit()
                print("[OK] New admin user updated")
                
                # Delete old admin user
                print(f"[INFO] Deleting old admin user: {old_email}")
                db.session.delete(old_admin)
                db.session.commit()
                print("[OK] Old admin user deleted")
            else:
                # Update old admin user to new credentials
                print(f"[INFO] Updating admin user email from {old_email} to {new_email}")
                old_admin.email = new_email
                old_admin.name = "ADMIN"
                old_admin.password_hash = generate_password_hash(new_password)
                old_admin.is_admin = True
                db.session.commit()
                print("[OK] Admin user credentials updated")
        elif new_admin:
            print(f"[INFO] Admin user already exists with new email: {new_email}")
            print("[INFO] Updating credentials...")
            new_admin.name = "ADMIN"
            new_admin.password_hash = generate_password_hash(new_password)
            new_admin.is_admin = True
            db.session.commit()
            print("[OK] Admin user credentials updated")
        else:
            print(f"[INFO] No admin user found. Creating new one: {new_email}")
            # This will be handled by ensure_admin_user.py
            print("[INFO] Please run ensure_admin_user.py to create the admin user")
        
        print(f"\nAdmin Login Credentials:")
        print(f"  Email: {new_email}")
        print(f"  Password: {new_password}")

if __name__ == "__main__":
    migrate_admin_credentials()



