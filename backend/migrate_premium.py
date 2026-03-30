import os
from app import app, db
from sqlalchemy import text

def migrate():
    with app.app_context():
        # Check database type
        engine = db.engine
        print(f"Connecting to database: {engine.url}")
        
        # Helper to add columns if they don't exist
        def add_column(table, column, type_str, default=None):
            try:
                # Try to add the column
                default_clause = f" DEFAULT {default}" if default is not None else ""
                db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {type_str}{default_clause}"))
                db.session.commit()
                print(f"Added column {column} to {table}")
            except Exception as e:
                db.session.rollback()
                if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                    print(f"Column {column} already exists in {table}")
                else:
                    print(f"ERROR adding {column} to {table}: {e}")

        print("--- Migrating Company table ---")
        add_column("company", "membership_tier", "VARCHAR(20)", "'FREE'")
        add_column("company", "priority_score", "INTEGER", "0")

        print("--- Migrating Product table ---")
        add_column("product", "tags", "TEXT", "''")
        add_column("product", "ai_description", "TEXT", "''")
        add_column("product", "is_priority", "BOOLEAN", "0")

        print("\n✓ Migration complete!")

if __name__ == "__main__":
    migrate()
