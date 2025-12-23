#!/usr/bin/env python3
"""Script to add products to the database without deleting existing data"""
import os
import sys
import random

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, Product, Category, Company
from werkzeug.security import generate_password_hash

def add_products():
    """Add products to the database if they don't exist"""
    with app.app_context():
        # Check if products already exist
        existing_count = Product.query.count()
        if existing_count > 0:
            print(f"ℹ Found {existing_count} existing products in database.")
            response = input("Do you want to add more products? (y/n): ")
            if response.lower() != 'y':
                print("Cancelled.")
                return
        
        # Get categories
        categories = Category.query.all()
        if not categories:
            print("❌ No categories found. Please run the app first to create categories.")
            return
        
        # Get companies
        companies = Company.query.all()
        if not companies:
            print("❌ No companies found. Please run the app first to create companies.")
            return
        
        print(f"✓ Found {len(categories)} categories and {len(companies)} companies")
        
        # Product templates for each category
        product_templates = {
            "Industrial Supplies": [
                ("Hydraulic Press Machine", "High performance hydraulic press for heavy duty operations", 250000),
                ("Steel Pipes & Tubes", "Premium quality steel pipes and tubes for industrial applications", 850),
                ("Industrial Safety Helmets", "High-quality safety helmets with adjustable straps", 450),
                ("Welding Electrodes", "Premium welding electrodes for various metal types", 1200),
                ("Industrial Bearings", "Precision ball bearings and roller bearings", 2500),
                ("Safety Gloves", "Industrial safety gloves with high durability", 250),
                ("Steel Sheets", "High-grade steel sheets for manufacturing", 1200),
                ("Industrial Valves", "Premium quality industrial valves", 3500),
                ("Gear Boxes", "Heavy-duty gear boxes for machinery", 45000),
                ("Conveyor Belts", "Industrial conveyor belts for material handling", 8500),
            ],
            "Electronics & Electrical": [
                ("Industrial Circuit Breaker", "Advanced electronic circuit breaker with overload protection", 15000),
                ("LED Industrial Lights", "Energy-efficient LED industrial lighting solutions", 3500),
                ("Electrical Control Panel", "Custom electrical control panels for automation", 45000),
                ("Power Transformers", "High-efficiency power transformers", 125000),
                ("Industrial Cables & Wires", "Premium quality industrial cables and wires", 850),
                ("Electric Motors", "High-performance electric motors", 25000),
                ("Switchgear", "Industrial switchgear equipment", 35000),
                ("Batteries", "Industrial batteries for backup power", 8500),
                ("Sensors", "Industrial sensors and automation components", 2500),
                ("PLC Systems", "Programmable Logic Controller systems", 75000),
            ],
            "Apparel & Fashion": [
                ("Premium Cotton T-Shirts", "High-quality cotton t-shirts with premium fabric", 450),
                ("Denim Jeans", "Premium quality denim jeans with stretch fabric", 1200),
                ("Silk Sarees", "Traditional silk sarees with intricate designs", 8500),
                ("Cotton Shirts", "Formal and casual cotton shirts", 650),
                ("Woolen Sweaters", "Premium woolen sweaters for winter", 1800),
                ("Leather Jackets", "Genuine leather jackets", 3500),
                ("Cotton Dresses", "Elegant cotton dresses", 1200),
                ("Formal Suits", "Premium formal business suits", 4500),
                ("Sports Wear", "High-performance sports wear", 850),
                ("Traditional Wear", "Ethnic and traditional clothing", 2500),
            ],
            "Machinery": [
                ("CNC Milling Machine", "Precision CNC milling machine for metal and plastic", 850000),
                ("Lathe Machine", "Heavy-duty lathe machine for metal turning", 450000),
                ("Drill Press Machine", "Industrial drill press with variable speed", 85000),
                ("Grinding Machine", "Surface grinding machine for precision finishing", 350000),
                ("Forklift Truck", "Industrial forklift for material handling", 650000),
                ("Compressor", "Industrial air compressor", 125000),
                ("Generator", "Diesel generator for power backup", 250000),
                ("Welding Machine", "Industrial welding equipment", 45000),
                ("Cutting Machine", "Precision cutting machinery", 85000),
                ("Packaging Machine", "Automated packaging equipment", 150000),
            ],
            "Construction & Real Estate": [
                ("Portland Cement (50kg)", "Premium quality Portland cement OPC 53 grade", 350),
                ("Steel Reinforcement Bars", "High-tensile steel reinforcement bars TMT grade", 65000),
                ("Ceramic Tiles", "Premium ceramic tiles for flooring and walls", 85),
                ("PVC Pipes", "High-quality PVC pipes for plumbing", 450),
                ("Ready Mix Concrete", "Ready mix concrete for construction", 4500),
                ("Bricks", "High-quality construction bricks", 8),
                ("Sand", "Construction grade sand", 500),
                ("Gravel", "Construction gravel and aggregates", 600),
                ("Paint", "Premium quality paint for construction", 850),
                ("Roofing Sheets", "Metal roofing sheets", 450),
            ],
            "Chemicals": [
                ("Industrial Solvent Cleaner", "High-grade industrial solvent cleaner", 850),
                ("Sulfuric Acid", "Industrial grade sulfuric acid", 4500),
                ("Polymer Resins", "Premium polymer resins for manufacturing", 1250),
                ("Industrial Adhesives", "High-strength industrial adhesives", 650),
                ("Fertilizers (NPK)", "NPK fertilizers for agricultural use", 850),
                ("Paints & Coatings", "Industrial paints and protective coatings", 1200),
                ("Lubricants", "Industrial lubricants and oils", 850),
                ("Cleaning Chemicals", "Industrial cleaning chemicals", 650),
                ("Plastic Raw Materials", "Polymer and plastic raw materials", 2500),
                ("Dyes & Pigments", "Industrial dyes and color pigments", 1800),
            ],
            "Food & Beverage": [
                ("Premium Basmati Rice (25kg)", "Export quality long-grain Basmati rice", 2500),
                ("Wheat Flour (50kg)", "Premium quality wheat flour", 1800),
                ("Cooking Oil (20L)", "Refined cooking oil", 2200),
                ("Spices & Masalas", "Premium quality spices and masalas", 450),
                ("Packaged Tea (1kg)", "Premium quality packaged tea", 650),
                ("Sugar", "Premium quality refined sugar", 450),
                ("Pulses", "High-quality pulses and lentils", 850),
                ("Dry Fruits", "Premium quality dry fruits", 2500),
                ("Honey", "Pure natural honey", 1200),
                ("Beverages", "Packaged beverages and drinks", 350),
            ],
            "Health & Beauty": [
                ("Organic Face Serum", "Natural organic face serum with vitamin C", 1200),
                ("Moisturizing Cream", "Deep moisturizing cream for all skin types", 650),
                ("Hair Shampoo", "Natural hair shampoo with herbal extracts", 350),
                ("Body Lotion", "Silky smooth body lotion with vitamin E", 450),
                ("Face Cleanser", "Gentle face cleanser for daily use", 550),
                ("Sunscreen", "SPF protection sunscreen", 650),
                ("Hair Conditioner", "Deep conditioning hair treatment", 450),
                ("Face Mask", "Natural face mask for skin care", 550),
                ("Body Wash", "Refreshing body wash", 350),
                ("Lip Balm", "Moisturizing lip balm", 250),
            ],
        }
        
        products_added = 0
        for category in categories:
            category_name = category.name
            if category_name not in product_templates:
                continue
            
            templates = product_templates[category_name]
            # Add 100 products per category
            for i in range(100):
                template = templates[i % len(templates)]
                company = random.choice(companies)
                
                # Create product name with variation
                base_name = template[0]
                if i >= len(templates):
                    variations = ["Premium", "Professional", "Industrial", "Advanced", "Standard", "Deluxe"]
                    variation = random.choice(variations)
                    name = f"{variation} {base_name}"
                else:
                    name = base_name
                
                # Check if product already exists
                existing = Product.query.filter_by(name=name, category_id=category.id).first()
                if existing:
                    continue
                
                # Vary price slightly
                base_price = template[2]
                price_variation = random.uniform(0.8, 1.2)
                price = int(base_price * price_variation)
                
                # Create description
                description = template[1] + ". High quality and reliable product suitable for industrial and commercial use."
                
                # Featured products (first 2 per category)
                featured = (i < 2)
                
                # Generate product-specific images
                product_name_clean = name.replace(' ', '%20').replace('&', 'and').replace('(', '').replace(')', '').replace(',', '').replace('/', '-').replace('®', '').replace('™', '')
                product_name_display = product_name_clean[:25] if len(product_name_clean) > 25 else product_name_clean
                image_url = f"https://via.placeholder.com/400x300/4f46e5/ffffff?text={product_name_display}"
                
                product = Product(
                    name=name,
                    description=description,
                    price=price,
                    image_url=image_url,
                    featured=featured,
                    category_id=category.id,
                    company_id=company.id,
                )
                db.session.add(product)
                products_added += 1
        
        db.session.commit()
        total_products = Product.query.count()
        print(f"✓ Added {products_added} new products!")
        print(f"✓ Total products in database: {total_products}")

if __name__ == "__main__":
    print("Adding products to database...")
    add_products()
    print("\n✓ Done! Refresh the frontend to see the products.")

