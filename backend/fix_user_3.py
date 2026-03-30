from app import app, db, User, Company
from werkzeug.security import generate_password_hash
from sqlalchemy import text

def fix_user_3():
    with app.app_context():
        # Check if user 3 exists
        u3 = User.query.get(3)
        if u3:
            print(f"User 3 already exists: {u3.email}")
            if not u3.company_id:
                company = Company.query.first()
                u3.company_id = company.id
                db.session.commit()
                print(f"Linked User 3 to company {company.name}")
            return

        # Get a company to link to
        company = Company.query.first()
        if not company:
            print("Creating a default company first...")
            company = Company(name="Test Default Company", verified=True)
            db.session.add(company)
            db.session.commit()

        # Insert User 3 manually to preserve ID
        try:
            # We use raw SQL to force the ID if needed, 
            # but usually for MySQL we can just insert and hope if the counter allows
            # actually better to use direct INSERT with ID
            password = generate_password_hash('password123')
            sql = text("INSERT INTO users (id, name, email, password_hash, company_id, is_admin, is_buyer_manager) VALUES (:id, :name, :email, :pw, :cid, :admin, :bm)")
            db.session.execute(sql, {
                "id": 3,
                "name": "Test Seller 3",
                "email": "seller3@test.com",
                "pw": password,
                "cid": company.id,
                "admin": False,
                "bm": False
            })
            db.session.commit()
            print("SUCCESS: Manually inserted User ID 3")
        except Exception as e:
            print(f"Failed to insert user 3: {e}")
            # Fallback: create normally and print ID
            new_u = User(name="Test Seller 3 (Fallback)", email="seller3_fallback@test.com", password_hash=password, company_id=company.id)
            db.session.add(new_u)
            db.session.commit()
            print(f"Created fallback user with ID: {new_u.id}")

if __name__ == "__main__":
    fix_user_3()
