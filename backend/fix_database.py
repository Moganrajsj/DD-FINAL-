#!/usr/bin/env python3
"""Script to fix database schema by recreating it with all new columns"""
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db

def fix_database():
    """Recreate database with updated schema"""
    db_path = os.path.join(os.path.dirname(__file__), "data", "tradeindia.db")
    
    print("⚠ WARNING: This will delete all existing data and recreate the database!")
    print(f"Database location: {db_path}")
    response = input("Continue? (yes/no): ")
    
    if response.lower() != 'yes':
        print("Cancelled.")
        return
    
    # Close any existing connections
    db.session.close()
    
    # Delete the database file
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            print(f"✓ Deleted old database: {db_path}")
        except PermissionError:
            print("❌ ERROR: Cannot delete database file. Please stop the Flask app first!")
            print("   Stop the app (Ctrl+C in the terminal running 'python app.py'), then run this script again.")
            return
    
    # Recreate database with new schema
    print("✓ Creating new database with updated schema...")
    with app.app_context():
        db.create_all()
        print("✓ Database schema created!")
        
        # Import and run seed_data
        from app import seed_data, Category
        if Category.query.count() == 0:
            print("✓ Seeding initial data...")
            seed_data()
            from app import Product
            count = Product.query.count()
            print(f"✓ Seeded {count} products!")
        else:
            print("ℹ Categories already exist, skipping seed.")
    
    print("\n✓ Done! Your database has been fixed. Restart the Flask app to use it.")

if __name__ == "__main__":
    fix_database()
