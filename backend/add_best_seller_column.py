#!/usr/bin/env python3
"""Add best_seller column to Company table"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, Company, ensure_db
from sqlalchemy import inspect, text

def add_best_seller_column():
    with app.app_context():
        ensure_db()
        
        inspector = inspect(db.engine)
        
        # Check if 'best_seller' column exists in 'company' table
        columns = [col['name'] for col in inspector.get_columns('company')]
        
        if 'best_seller' not in columns:
            print("Adding 'best_seller' column to Company table...")
            with db.engine.connect() as connection:
                connection.execute(text("ALTER TABLE company ADD COLUMN best_seller BOOLEAN DEFAULT 0 NOT NULL"))
                connection.commit()
            print("[OK] 'best_seller' column added.")
        else:
            print("[OK] 'best_seller' column already exists.")
        
        # Verify
        company_count = Company.query.count()
        best_seller_count = Company.query.filter_by(best_seller=True).count()
        print(f"\n[INFO] Total companies: {company_count}")
        print(f"[INFO] Best sellers: {best_seller_count}")

if __name__ == "__main__":
    add_best_seller_column()



