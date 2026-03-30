import mysql.connector
import os

def update_schema():
    print("Checking database schema...")
    try:
        # Get credentials from app.py (hardcoded for now as I see them in logs/app.py)
        # Host: srv1743.hstgr.io, User: u962734523_deals_user, DB: u962734523_dealsdouble_db
        conn = mysql.connector.connect(
            host="srv1743.hstgr.io",
            user="u962734523_deals_user",
            password="[REDACTED]", 
            database="u962734523_dealsdouble_db"
        )
        cursor = conn.cursor()
        
        # Add columns if they don't exist
        cols = [
            ("ai_summary", "TEXT"),
            ("price_trend", "FLOAT DEFAULT 0.0"),
            ("bulk_pricing_json", "TEXT")
        ]
        
        for col_name, col_type in cols:
            try:
                cursor.execute(f"ALTER TABLE product ADD COLUMN {col_name} {col_type}")
                print(f"Added column: {col_name}")
            except Exception as e:
                if "Duplicate column name" in str(e):
                    print(f"Column {col_name} already exists.")
                else:
                    print(f"Error adding {col_name}: {e}")
        
        conn.commit()
        cursor.close()
        conn.close()
        print("Schema update complete.")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    update_schema()
