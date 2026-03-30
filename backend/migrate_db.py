from app import app, db
from sqlalchemy import text

with app.app_context():
    try:
        db.session.execute(text('ALTER TABLE inquiry ADD COLUMN negotiation_status VARCHAR(20) DEFAULT "OPEN"'))
        db.session.commit()
        print("Successfully added negotiation_status column to inquiry table.")
    except Exception as e:
        db.session.rollback()
        if "Duplicate column name" in str(e):
            print("Column negotiation_status already exists.")
        else:
            print(f"Error adding column: {str(e)}")

    try:
        # Also ensure InquiryMessage table is created
        db.create_all()
        print("Ensured all tables are created.")
    except Exception as e:
        print(f"Error creating tables: {str(e)}")
