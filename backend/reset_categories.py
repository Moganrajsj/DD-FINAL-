#!/usr/bin/env python3
"""Clear existing categories and add 10 general categories"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, ensure_db, Category

def reset_categories(skip_confirmation=False):
    """Clear all existing categories and add 10 general categories"""
    with app.app_context():
        ensure_db()
        
        print("=" * 60)
        print("RESETTING CATEGORIES")
        print("=" * 60)
        
        # Count existing categories
        existing_count = Category.query.count()
        print(f"\nCurrent categories: {existing_count}")
        
        if existing_count > 0:
            # List existing categories
            existing_categories = Category.query.all()
            print("\nExisting categories:")
            for cat in existing_categories:
                print(f"  - {cat.name}")
        
        # Define 10 general categories
        general_categories = [
            "Electronics",
            "Clothing & Apparel",
            "Food & Beverages",
            "Home & Garden",
            "Automotive",
            "Health & Beauty",
            "Sports & Outdoors",
            "Industrial & Machinery",
            "Textiles & Fabrics",
            "Construction Materials"
        ]
        
        print(f"\n[INFO] Will clear all existing categories and add {len(general_categories)} general categories:")
        for cat in general_categories:
            print(f"  - {cat}")
        
        # Check if any products reference categories
        from app import Product
        products_with_categories = Product.query.filter(Product.category_id.isnot(None)).count()
        if products_with_categories > 0:
            print(f"\n[WARN] {products_with_categories} products currently reference categories.")
            print("       Their category_id will be set to NULL.")
        
        if not skip_confirmation:
            response = input("\nContinue? (yes/no): ")
            if response.lower() != 'yes':
                print("\n[CANCELLED] Operation aborted.")
                return
        else:
            print("\n[INFO] Auto-confirming reset (--yes flag used)")
        
        print("\n" + "=" * 60)
        print("RESETTING CATEGORIES...")
        print("=" * 60)
        
        # Set product category_id to NULL before deleting categories
        if products_with_categories > 0:
            Product.query.filter(Product.category_id.isnot(None)).update({Product.category_id: None})
            print(f"[OK] Set category_id to NULL for {products_with_categories} products")
        
        # Delete all existing categories
        deleted_count = Category.query.delete()
        print(f"[OK] Deleted {deleted_count} existing categories")
        
        # Add new general categories
        new_categories = [Category(name=name) for name in general_categories]
        db.session.add_all(new_categories)
        db.session.commit()
        
        print(f"[OK] Added {len(general_categories)} new general categories")
        
        print("\n" + "=" * 60)
        print("CATEGORIES RESET COMPLETE!")
        print("=" * 60)
        
        # Show final categories
        final_categories = Category.query.order_by(Category.name).all()
        print(f"\nFinal categories ({len(final_categories)}):")
        for cat in final_categories:
            print(f"  - {cat.name}")
        
        print("\n[OK] Categories have been reset successfully!")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Reset categories to 10 general categories')
    parser.add_argument(
        '--yes',
        action='store_true',
        help='Skip confirmation prompt (useful for automated scripts)'
    )
    
    args = parser.parse_args()
    reset_categories(skip_confirmation=args.yes)

