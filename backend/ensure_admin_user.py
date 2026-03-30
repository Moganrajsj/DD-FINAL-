#!/usr/bin/env python3
"""Ensure admin user exists with correct password"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, User, Company, generate_password_hash, ensure_db

def ensure_admin_user():
    with app.app_context():
        ensure_db()
        
        email = "techdlt@gmail.com"
        password = "Erode1213@"
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            print(f"Creating admin user: {email}")
            
            # Check if any company exists
            company = Company.query.first()
            if not company:
                print("Creating a demo company...")
                company = Company(
                    name="Demo Company",
                    description="Demo company for admin access",
                    location="India",
                    verified=True
                )
                db.session.add(company)
                db.session.flush()
            
            # Create user
            user = User(
                name="ADMIN",
                email=email,
                password_hash=generate_password_hash(password),
                company_id=company.id,
                is_admin=True  # Set as admin
            )
            db.session.add(user)
            db.session.commit()
            print(f"[OK] Created admin user: {email}")
        else:
            print(f"[OK] Admin user already exists: {email}")
            # Update password, name, and ensure admin flag is set
            user.name = "ADMIN"
            user.password_hash = generate_password_hash(password)
            user.is_admin = True  # Ensure admin flag is set
            db.session.commit()
            print(f"[OK] Name updated to: ADMIN")
            print(f"[OK] Password updated to: {password}")
            print(f"[OK] Admin privileges confirmed")
        
        print(f"\nAdmin Login Credentials:")
        print(f"  Email: {email}")
        print(f"  Password: {password}")

if __name__ == "__main__":
    ensure_admin_user()

