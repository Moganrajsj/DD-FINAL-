import os
import shutil
import json
from datetime import datetime
from werkzeug.security import generate_password_hash
from app import app, db, User, Company, Category, Product, ProductImage

# Configuration
SOURCE_DIR = r"C:\Users\mogan\b2b-marketplace\Ugan foods\dist\products"
BACKEND_UPLOADS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "products")
DEFAULT_PASSWORD = "UganFoods2026!"

SELLER_NAME = "UGAN foods"
SELLER_EMAIL = "uganfoodproducts@gmail.com"
SELLER_PHONE = "+91 82202 13220"
SELLER_ADDRESS = "Nandhini Nagar, Thandgam Main Road, Vennampatti, Dharmapuri, Tamil Nadu 636705"

CATEGORIES = {
    "Spices & Masalas": [
        "biryani-masala", "chana-masala", "chicken-65-masala", "chilli-powder", 
        "chukka-masala", "corinder-powder", "curry-masala", "fish-fry-masala", 
        "fish-kulambu-masala", "garam-masala", "kulambu-masala", "sambar-masala", 
        "turmeric-powder"
    ],
    "Cooking Oils": ["coconut-oil", "groundnut-oil", "sesame-oil"],
    "Health & Nutrition": ["coco-health-mix-finalfinal", "health-mix-aatta-flour", "health-mix-choco"]
}

def get_product_name(filename):
    # Strip extension
    name = os.path.splitext(filename)[0]
    
    # Handle specific renames
    if name == "corinder-powder":
        return "Coriander Powder"
    if name == "coco-health-mix-finalfinal":
        return "Coco Health Mix"
    
    # Generic formatting: dash to space and title case
    return name.replace("-", " ").title()

def get_category_for_file(filename):
    name_slug = os.path.splitext(filename)[0]
    for cat_name, items in CATEGORIES.items():
        if name_slug in items:
            return cat_name
    return "Food & Beverages"

def run_import():
    with app.app_context():
        print(f"Starting import for {SELLER_NAME}...")
        
        # 1. Create or Get Company
        company = Company.query.filter_by(name=SELLER_NAME).first()
        if not company:
            print(f"Creating company: {SELLER_NAME}")
            company = Company(
                name=SELLER_NAME,
                description="Manufacturer of premium masalas, edible oils, and health mixes.",
                location=SELLER_ADDRESS,
                phone=SELLER_PHONE,
                verified=True,
                membership_tier="GOLD"
            )
            db.session.add(company)
            db.session.commit()
        else:
            print(f"Company {SELLER_NAME} already exists.")
            
        # 2. Create or Get User
        user = User.query.filter_by(email=SELLER_EMAIL).first()
        if not user:
            print(f"Creating user: {SELLER_EMAIL}")
            user = User(
                name=SELLER_NAME,
                email=SELLER_EMAIL,
                password_hash=generate_password_hash(DEFAULT_PASSWORD),
                company_id=company.id,
                phone=SELLER_PHONE,
                membership_tier="PREMIUM"
            )
            db.session.add(user)
            db.session.commit()
        else:
            print(f"User {SELLER_EMAIL} already exists.")

        # 3. Import Products
        if not os.path.exists(SOURCE_DIR):
            print(f"Error: Source directory {SOURCE_DIR} not found.")
            return

        os.makedirs(BACKEND_UPLOADS, exist_ok=True)
        
        files = [f for f in os.listdir(SOURCE_DIR) if os.path.isfile(os.path.join(SOURCE_DIR, f))]
        
        for filename in files:
            # Skip duplicates/old versions
            if "old" in filename.lower():
                print(f"Skipping {filename} (old version)")
                continue
                
            product_name = get_product_name(filename)
            cat_name = get_category_for_file(filename)
            
            # Ensure category exists
            category = Category.query.filter_by(name=cat_name).first()
            if not category:
                print(f"Creating category: {cat_name}")
                category = Category(name=cat_name)
                db.session.add(category)
                db.session.commit()
            
            # Check if product already exists for this company
            existing_product = Product.query.filter_by(name=product_name, company_id=company.id).first()
            if existing_product:
                print(f"Product {product_name} already exists, skipping...")
                continue
                
            print(f"Importing Product: {product_name} in category {cat_name}")
            
            # Copy Image
            new_filename = f"{filename}" # Keeping original name for now
            dest_path = os.path.join(BACKEND_UPLOADS, new_filename)
            shutil.copy2(os.path.join(SOURCE_DIR, filename), dest_path)
            
            # Relative path for DB
            rel_image_url = f"/uploads/products/{new_filename}"
            
            # Create Product
            new_product = Product(
                name=product_name,
                description=f"High-quality {product_name} by {SELLER_NAME}.",
                price=0.0,  # Default price
                image_url=rel_image_url,
                category_id=category.id,
                company_id=company.id,
                approved=True,
                location="Dharmapuri, Tamil Nadu",
                stock_quantity=100,
                min_order_quantity=1,
                featured=True
            )
            db.session.add(new_product)
            db.session.flush() # Get ID
            
            # Create primary ProductImage
            prod_img = ProductImage(
                product_id=new_product.id,
                image_url=rel_image_url,
                is_primary=True
            )
            db.session.add(prod_img)
            
        db.session.commit()
        print("Import completed successfully!")

if __name__ == "__main__":
    run_import()
