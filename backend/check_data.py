#!/usr/bin/env python3
"""Check database state"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, Product, Company, User, Category

def check_data():
    with app.app_context():
        print("=== Database Status ===\n")
        
        # Count records
        product_count = Product.query.count()
        company_count = Company.query.count()
        user_count = User.query.count()
        category_count = Category.query.count()
        
        print(f"Products: {product_count}")
        print(f"Companies: {company_count}")
        print(f"Users: {user_count}")
        print(f"Categories: {category_count}\n")
        
        # List some companies
        if company_count > 0:
            print("=== Sample Companies ===")
            companies = Company.query.limit(5).all()
            for company in companies:
                print(f"  - {company.name} (ID: {company.id}, Verified: {company.verified})")
        else:
            print("⚠ No companies found!")
        
        print()
        
        # List some products
        if product_count > 0:
            print("=== Sample Products ===")
            products = Product.query.limit(5).all()
            for product in products:
                print(f"  - {product.name} (ID: {product.id}, Company: {product.company.name if product.company else 'None'})")
        else:
            print("⚠ No products found!")
        
        print()
        
        # Check database file
        db_path = os.path.join(os.path.dirname(__file__), "data", "tradeindia.db")
        if os.path.exists(db_path):
            size = os.path.getsize(db_path)
            print(f"Database file: {db_path}")
            print(f"Database size: {size / 1024:.2f} KB")
        else:
            print(f"⚠ Database file not found: {db_path}")

if __name__ == "__main__":
    check_data()

