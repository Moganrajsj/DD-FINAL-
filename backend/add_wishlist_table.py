"""Add Wishlist table to database"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import app, db

def add_wishlist_table():
    with app.app_context():
        try:
            # Check if table already exists
            inspector = db.inspect(db.engine)
            if 'wishlist' in inspector.get_table_names():
                print("[INFO] Wishlist table already exists")
                return
            
            # Create the table
            from app import Wishlist
            db.create_all()
            print("[OK] Wishlist table created successfully")
        except Exception as e:
            print(f"[ERROR] Failed to create wishlist table: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    add_wishlist_table()



