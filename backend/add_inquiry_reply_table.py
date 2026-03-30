#!/usr/bin/env python3
"""Add InquiryReply table to database"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from sqlalchemy import text

def add_inquiry_reply_table():
    with app.app_context():
        try:
            # Check if table already exists
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'inquiry_reply' in tables:
                print("[INFO] inquiry_reply table already exists")
                return
            
            # Create the table
            with db.engine.connect() as connection:
                connection.execute(text("""
                    CREATE TABLE inquiry_reply (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        inquiry_id INTEGER NOT NULL,
                        user_id INTEGER NOT NULL,
                        message TEXT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (inquiry_id) REFERENCES inquiry (id),
                        FOREIGN KEY (user_id) REFERENCES user (id)
                    )
                """))
                connection.commit()
            print("[OK] Created inquiry_reply table")
            
        except Exception as e:
            print(f"[ERROR] Failed to create inquiry_reply table: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    add_inquiry_reply_table()



