from app import app, db, User, Company
from werkzeug.security import generate_password_hash

def create_seller():
    with app.app_context():
        # Find or create a seller
        email = 'seller@test.com'
        u = User.query.filter_by(email=email).first()
        if u:
            db.session.delete(u)
            db.session.commit()
            print(f"Deleted existing user {email}")
        
        # Get the first company and ensure it's verified
        company = Company.query.first()
        if not company:
            print("No company found to associate with seller.")
            return
            
        company.verified = True
        
        # Create new seller user
        new_seller = User(
            name='Test Seller',
            email=email,
            password_hash=generate_password_hash('password123'),
            company=company,
            is_admin=False
        )
        db.session.add(new_seller)
        db.session.commit()
        print(f"SUCCESS: Created seller {email} with password 'password123' linked to {company.name}")

if __name__ == "__main__":
    create_seller()
