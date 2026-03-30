#!/usr/bin/env python3
"""Delete all products and companies from the database"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import (
    app, db, ensure_db,
    Product, Company, Inquiry, Order, Review, ProductImage,
    OrderTracking, ChatMessage, TradeLead, User
)

def delete_all_products_and_companies(skip_confirmation=False):
    """Delete all products and companies from the database"""
    with app.app_context():
        ensure_db()
        
        print("=" * 60)
        print("DELETING ALL PRODUCTS AND COMPANIES")
        print("=" * 60)
        
        # Count records before deletion
        product_count = Product.query.count()
        company_count = Company.query.count()
        inquiry_count = Inquiry.query.count()
        order_count = Order.query.count()
        review_count = Review.query.count()
        product_image_count = ProductImage.query.count()
        order_tracking_count = OrderTracking.query.count()
        chat_message_count = ChatMessage.query.count()
        trade_lead_count = TradeLead.query.count()
        
        print(f"\nCurrent data counts:")
        print(f"  Products: {product_count}")
        print(f"  Companies: {company_count}")
        print(f"  Inquiries: {inquiry_count}")
        print(f"  Orders: {order_count}")
        print(f"  Reviews: {review_count}")
        print(f"  Product Images: {product_image_count}")
        print(f"  Order Tracking: {order_tracking_count}")
        print(f"  Chat Messages: {chat_message_count}")
        print(f"  Trade Leads: {trade_lead_count}")
        
        if product_count == 0 and company_count == 0:
            print("\n[INFO] No products or companies found. Nothing to delete.")
            return
        
        print(f"\n[WARN] About to delete all products and companies.")
        print("       This will also delete related records (inquiries, orders, reviews, etc.)")
        print("       User records will be preserved, but their company_id will be set to NULL.")
        
        if not skip_confirmation:
            response = input("\nContinue? (yes/no): ")
            if response.lower() != 'yes':
                print("\n[CANCELLED] Deletion aborted.")
                return
        else:
            print("\n[INFO] Auto-confirming deletion (--yes flag used)")
        
        print("\n" + "=" * 60)
        print("DELETING DATA...")
        print("=" * 60)
        
        # Delete in order to respect foreign key constraints
        
        # 1. OrderTracking (references Order)
        count = OrderTracking.query.delete()
        print(f"[OK] Deleted {count} OrderTracking records")
        
        # 2. ChatMessage (references Order, Product, User)
        count = ChatMessage.query.delete()
        print(f"[OK] Deleted {count} ChatMessage records")
        
        # 3. Order (references Product, Company)
        count = Order.query.delete()
        print(f"[OK] Deleted {count} Order records")
        
        # 4. Review (references Product, User)
        count = Review.query.delete()
        print(f"[OK] Deleted {count} Review records")
        
        # 5. ProductImage (references Product)
        count = ProductImage.query.delete()
        print(f"[OK] Deleted {count} ProductImage records")
        
        # 6. Inquiry (references Product)
        count = Inquiry.query.delete()
        print(f"[OK] Deleted {count} Inquiry records")
        
        # 7. TradeLead (references Company)
        count = TradeLead.query.delete()
        print(f"[OK] Deleted {count} TradeLead records")
        
        # 8. Set user.company_id to NULL before deleting companies
        users_updated = User.query.filter(User.company_id.isnot(None)).update({User.company_id: None})
        print(f"[OK] Set company_id to NULL for {users_updated} users")
        
        # 9. Product (references Category, Company)
        count = Product.query.delete()
        print(f"[OK] Deleted {count} Product records")
        
        # 10. Company
        count = Company.query.delete()
        print(f"[OK] Deleted {count} Company records")
        
        # Commit all deletions
        db.session.commit()
        
        print("\n" + "=" * 60)
        print("DELETION COMPLETE!")
        print("=" * 60)
        
        # Show final counts
        print("\nFinal data counts:")
        print(f"  Products: {Product.query.count()}")
        print(f"  Companies: {Company.query.count()}")
        print(f"  Inquiries: {Inquiry.query.count()}")
        print(f"  Orders: {Order.query.count()}")
        print(f"  Reviews: {Review.query.count()}")
        
        print("\n[OK] All products and companies have been deleted.")
        print("     User records have been preserved (company_id set to NULL).")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Delete all products and companies from database')
    parser.add_argument(
        '--yes',
        action='store_true',
        help='Skip confirmation prompt (useful for automated scripts)'
    )
    
    args = parser.parse_args()
    delete_all_products_and_companies(skip_confirmation=args.yes)

