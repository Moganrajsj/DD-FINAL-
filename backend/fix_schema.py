#!/usr/bin/env python3
"""Fix database schema by recreating it"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, seed_data, Category

def fix_schema():
    with app.app_context():
        db_path = os.path.join(os.path.dirname(__file__), "data", "tradeindia.db")
        
        print("Checking database schema...")
        
        try:
            # Check if database exists and has data
            category_count = 0
            product_count = 0
            try:
                category_count = db.session.execute(db.text("SELECT COUNT(*) FROM category")).scalar()
                product_count = db.session.execute(db.text("SELECT COUNT(*) FROM product")).scalar()
            except Exception as e:
                print(f"Error checking data: {e}")
            
            had_data = category_count > 0 or product_count > 0
            
            if had_data:
                print(f"⚠ Database has existing data: {category_count} categories, {product_count} products")
                print("⚠ This will recreate the database and restore sample data")
                response = input("Continue? (yes/no): ")
                if response.lower() != 'yes':
                    print("Cancelled.")
                    return
            
            print("\nRecreating database with updated schema...")
            db.drop_all()
            db.create_all()
            print("✓ Database schema created")
            
            print("Seeding initial data...")
            seed_data()
            
            # Verify
            final_category_count = Category.query.count()
            from app import Product, Company
            final_product_count = Product.query.count()
            final_company_count = Company.query.count()
            
            print(f"\n✓ Database fixed!")
            print(f"  Categories: {final_category_count}")
            print(f"  Products: {final_product_count}")
            print(f"  Companies: {final_company_count}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    fix_schema()

