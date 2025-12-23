#!/usr/bin/env python3
"""Script to delete and reseed the database with new products"""
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Delete the old database
db_path = os.path.join(os.path.dirname(__file__), "data", "tradeindia.db")
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"✓ Deleted old database: {db_path}")
else:
    print(f"ℹ Database file not found: {db_path}")

# Import and run the app to trigger seed_data
from app import app, ensure_db

print("✓ Creating new database and seeding with 800 products (100 per category)...")
with app.app_context():
    ensure_db()
    from app import Product
    count = Product.query.count()
    print(f"✓ Database reseeded! Total products: {count}")

print("\n✓ Done! Your new products are ready. Refresh the frontend to see them.")



