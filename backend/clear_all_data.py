#!/usr/bin/env python3
"""Clear all data from database while preserving admin user and database structure"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import (
    app, db, ensure_db,
    User, Company, Product, Category, 
    Order, OrderTracking, Inquiry, Review, ProductImage,
    Subscription, BuyRequirement, TradeLead, ChatMessage, OTP
)

def clear_all_data(preserve_categories=False, skip_confirmation=False):
    """Clear all data from database, preserving admin user and optionally categories."""
    with app.app_context():
        ensure_db()
        
        print("=" * 60)
        print("DATABASE CLEANUP - Removing all data for production deployment")
        print("=" * 60)
        
        # Get admin user email
        admin_email = "techdlt@gmail.com"
        admin_user = User.query.filter_by(email=admin_email).first()
        
        if not admin_user:
            print(f"\n[WARN] Admin user '{admin_email}' not found!")
            print("       The admin user will not be preserved.")
            admin_user_id = None
            admin_company_id = None
        else:
            admin_user_id = admin_user.id
            admin_company_id = admin_user.company_id
            print(f"\n[OK] Found admin user: {admin_email} (ID: {admin_user_id})")
            if admin_company_id:
                print(f"     Admin company ID: {admin_company_id}")
        
        # Count records before deletion
        counts = {
            'OrderTracking': OrderTracking.query.count(),
            'ChatMessage': ChatMessage.query.count(),
            'Order': Order.query.count(),
            'Review': Review.query.count(),
            'ProductImage': ProductImage.query.count(),
            'Inquiry': Inquiry.query.count(),
            'Product': Product.query.count(),
            'TradeLead': TradeLead.query.count(),
            'BuyRequirement': BuyRequirement.query.count(),
            'Subscription': Subscription.query.count(),
            'Company': Company.query.count(),
            'User': User.query.count(),
            'OTP': OTP.query.count(),
            'Category': Category.query.count(),
        }
        
        print("\nCurrent data counts:")
        for model_name, count in counts.items():
            if count > 0:
                print(f"  {model_name}: {count}")
        
        # Confirm deletion
        total_records = sum(counts.values())
        if total_records == 0:
            print("\n[INFO] Database is already empty. Nothing to delete.")
            return
        
        print(f"\n[WARN] About to delete {total_records} records from the database.")
        print("       Admin user will be preserved.")
        if preserve_categories:
            print("       Categories will be preserved.")
        else:
            print("       Categories will be deleted.")
        
        if not skip_confirmation:
            response = input("\nContinue? (yes/no): ")
            if response.lower() != 'yes':
                print("\n[CANCELLED] Cleanup aborted.")
                return
        else:
            print("\n[INFO] Auto-confirming deletion (--yes flag used)")
        
        print("\n" + "=" * 60)
        print("DELETING DATA...")
        print("=" * 60)
        
        # Delete in order to respect foreign key constraints
        deleted_counts = {}
        
        # 1. OrderTracking (references Order)
        count = OrderTracking.query.delete()
        deleted_counts['OrderTracking'] = count
        print(f"[OK] Deleted {count} OrderTracking records")
        
        # 2. ChatMessage (references Order, Product, User)
        count = ChatMessage.query.delete()
        deleted_counts['ChatMessage'] = count
        print(f"[OK] Deleted {count} ChatMessage records")
        
        # 3. Order (references Product, Company, User)
        count = Order.query.delete()
        deleted_counts['Order'] = count
        print(f"[OK] Deleted {count} Order records")
        
        # 4. Review (references Product, User)
        count = Review.query.delete()
        deleted_counts['Review'] = count
        print(f"[OK] Deleted {count} Review records")
        
        # 5. ProductImage (references Product)
        count = ProductImage.query.delete()
        deleted_counts['ProductImage'] = count
        print(f"[OK] Deleted {count} ProductImage records")
        
        # 6. Inquiry (references Product)
        count = Inquiry.query.delete()
        deleted_counts['Inquiry'] = count
        print(f"[OK] Deleted {count} Inquiry records")
        
        # 7. Product (references Category, Company)
        count = Product.query.delete()
        deleted_counts['Product'] = count
        print(f"[OK] Deleted {count} Product records")
        
        # 8. TradeLead (references Company)
        count = TradeLead.query.delete()
        deleted_counts['TradeLead'] = count
        print(f"[OK] Deleted {count} TradeLead records")
        
        # 9. BuyRequirement (references User)
        if admin_user_id:
            count = BuyRequirement.query.filter(BuyRequirement.user_id != admin_user_id).delete()
        else:
            count = BuyRequirement.query.delete()
        deleted_counts['BuyRequirement'] = count
        print(f"[OK] Deleted {count} BuyRequirement records")
        
        # 10. Subscription (references User)
        if admin_user_id:
            count = Subscription.query.filter(Subscription.user_id != admin_user_id).delete()
        else:
            count = Subscription.query.delete()
        deleted_counts['Subscription'] = count
        print(f"[OK] Deleted {count} Subscription records")
        
        # 11. Company (preserve admin's company if exists)
        if admin_company_id:
            count = Company.query.filter(Company.id != admin_company_id).delete()
            print(f"[OK] Deleted {count} Company records (preserved admin company ID: {admin_company_id})")
        else:
            count = Company.query.delete()
            print(f"[OK] Deleted {count} Company records")
        deleted_counts['Company'] = count
        
        # 12. User (preserve admin user)
        if admin_user_id:
            count = User.query.filter(User.id != admin_user_id).delete()
            print(f"[OK] Deleted {count} User records (preserved admin user)")
        else:
            count = User.query.delete()
            print(f"[OK] Deleted {count} User records")
        deleted_counts['User'] = count
        
        # 13. OTP (clear all expired/unused OTPs)
        count = OTP.query.delete()
        deleted_counts['OTP'] = count
        print(f"[OK] Deleted {count} OTP records")
        
        # 14. Category (optional)
        if not preserve_categories:
            count = Category.query.delete()
            deleted_counts['Category'] = count
            print(f"[OK] Deleted {count} Category records")
        else:
            print(f"[OK] Preserved {Category.query.count()} Category records")
        
        # Commit all deletions
        db.session.commit()
        
        print("\n" + "=" * 60)
        print("CLEANUP COMPLETE!")
        print("=" * 60)
        
        # Verify admin user still exists
        if admin_user_id:
            admin_user = User.query.get(admin_user_id)
            if admin_user:
                print(f"\n[OK] Admin user preserved: {admin_user.email}")
                print(f"     Admin privileges: {admin_user.is_admin}")
            else:
                print(f"\n[ERROR] Admin user was deleted! This should not happen.")
        
        # Show final counts
        print("\nFinal data counts:")
        final_counts = {
            'User': User.query.count(),
            'Company': Company.query.count(),
            'Product': Product.query.count(),
            'Category': Category.query.count(),
            'Order': Order.query.count(),
            'Inquiry': Inquiry.query.count(),
            'Review': Review.query.count(),
        }
        
        for model_name, count in final_counts.items():
            print(f"  {model_name}: {count}")
        
        print("\n[OK] Database is now clean and ready for production deployment!")
        print("     Only the admin user (and optionally categories) remain.")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Clear all data from database')
    parser.add_argument(
        '--preserve-categories',
        action='store_true',
        help='Preserve category data (useful if you want to keep category structure)'
    )
    parser.add_argument(
        '--yes',
        action='store_true',
        help='Skip confirmation prompt (useful for automated scripts)'
    )
    
    args = parser.parse_args()
    clear_all_data(preserve_categories=args.preserve_categories, skip_confirmation=args.yes)

