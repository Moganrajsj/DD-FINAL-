#!/usr/bin/env python3
"""Delete all login credentials (users) from the database"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, User, ensure_db

def delete_all_credentials():
    """Delete all users and their credentials from the database"""
    with app.app_context():
        ensure_db()
        
        # Get count of users before deletion
        user_count = User.query.count()
        
        if user_count == 0:
            print("No users found in the database. Nothing to delete.")
            return
        
        print(f"Found {user_count} user(s) in the database.")
        print("Deleting all users and their credentials...")
        
        # Delete all users
        User.query.delete()
        db.session.commit()
        
        print(f"✓ Successfully deleted {user_count} user(s) and all their login credentials.")
        print("All login credentials have been removed from the database.")

if __name__ == "__main__":
    delete_all_credentials()





