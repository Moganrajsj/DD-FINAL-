from app import db, User, Company
import os

def check():
    users = User.query.all()
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}, Company ID: {u.company_id}")
    
    companies = Company.query.all()
    print(f"Total Companies: {len(companies)}")
    for c in companies:
        print(f"ID: {c.id}, Name: {c.name}")

if __name__ == "__main__":
    from app import app
    with app.app_context():
        check()
