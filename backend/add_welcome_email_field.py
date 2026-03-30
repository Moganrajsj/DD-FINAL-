"""Add welcome_email_sent field to User table"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import app, db
from sqlalchemy import text

def add_welcome_email_field():
    with app.app_context():
        try:
            # Check if column already exists
            inspector = db.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('user')]
            
            if 'welcome_email_sent' in columns:
                print("[INFO] welcome_email_sent column already exists")
                return
            
            # Add the column
            db.session.execute(text("ALTER TABLE user ADD COLUMN welcome_email_sent BOOLEAN DEFAULT 0"))
            db.session.commit()
            print("[OK] Added welcome_email_sent column to User table")
            
            # Update existing users to have welcome_email_sent = False
            db.session.execute(text("UPDATE user SET welcome_email_sent = 0 WHERE welcome_email_sent IS NULL"))
            db.session.commit()
            print("[OK] Updated existing users")
            
        except Exception as e:
            print(f"[ERROR] Failed to add welcome_email_sent column: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    add_welcome_email_field()

