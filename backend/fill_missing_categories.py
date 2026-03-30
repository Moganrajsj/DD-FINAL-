import random
from datetime import datetime
from app import db, Category, Product, Company, app, ensure_db

def seed_missing():
    with app.app_context():
        # 1. Categories we expect
        target_categories = [
            "Industrial Supplies",
            "Electronics & Electrical",
            "Apparel & Fashion",
            "Machinery",
            "Construction & Real Estate",
            "Chemicals",
            "Food & Beverage",
            "Health & Beauty",
        ]
        
        print("Ensuring categories exist...")
        db_categories = {c.name: c for c in Category.query.all()}
        
        for name in target_categories:
            if name not in db_categories:
                cat = Category(name=name)
                db.session.add(cat)
                print(f"Created category: {name}")
            else:
                print(f"Category already exists: {name}")
        
        db.session.commit()
        
        # Refresh category map
        db_categories = {c.name: c for c in Category.query.all()}
        
        # 2. Get companies to attribute products to
        companies = Company.query.all()
        if not companies:
            print("No companies found to attribute products to! Please run a company seed script first.")
            return

        # 3. Product templates
        product_templates = {
            "Electronics & Electrical": [
                ("Industrial Circuit Breaker", "Advanced electronic circuit breaker with overload protection", 15000),
                ("LED Industrial Lights", "Energy-efficient LED industrial lighting solutions", 3500),
                ("Electrical Control Panel", "Custom electrical control panels for automation", 45000),
                ("Power Transformers", "High-efficiency power transformers", 125000),
                ("Industrial Cables & Wires", "Premium quality industrial cables and wires", 850),
            ],
            "Apparel & Fashion": [
                ("Premium Cotton T-Shirts", "High-quality cotton t-shirts with premium fabric", 450),
                ("Denim Jeans", "Premium quality denim jeans with stretch fabric", 1200),
                ("Silk Sarees", "Traditional silk sarees with intricate designs", 8500),
                ("Cotton Shirts", "Formal and casual cotton shirts", 650),
                ("Woolen Sweaters", "Premium woolen sweaters for winter", 1800),
            ],
            "Machinery": [
                ("CNC Milling Machine", "Precision CNC milling machine for metal and plastic", 850000),
                ("Lathe Machine", "Heavy-duty lathe machine for metal turning", 450000),
                ("Drill Press Machine", "Industrial drill press with variable speed", 85000),
                ("Grinding Machine", "Surface grinding machine for precision finishing", 350000),
                ("Forklift Truck", "Industrial forklift for material handling", 650000),
            ],
            "Construction & Real Estate": [
                ("Portland Cement (50kg)", "Premium quality Portland cement OPC 53 grade", 350),
                ("Steel Reinforcement Bars", "High-tensile steel reinforcement bars TMT grade", 65000),
                ("Ceramic Tiles", "Premium ceramic tiles for flooring and walls", 85),
                ("PVC Pipes", "High-quality PVC pipes for plumbing", 450),
                ("Ready Mix Concrete", "Ready mix concrete for construction", 4500),
            ],
            "Chemicals": [
                ("Industrial Solvent Cleaner", "High-grade industrial solvent cleaner", 850),
                ("Sulfuric Acid", "Industrial grade sulfuric acid", 4500),
                ("Polymer Resins", "Premium polymer resins for manufacturing", 1250),
                ("Industrial Adhesives", "High-strength industrial adhesives", 650),
                ("Fertilizers (NPK)", "NPK fertilizers for agricultural use", 850),
            ],
            "Food & Beverage": [
                ("Organic Green Tea", "Premium organic green tea leaves for industrial supply", 1200),
                ("Processed Wheat Flour (50kg)", "High-quality processed wheat flour for bakery use", 1500),
                ("Refined Sunflower Oil", "Premium refined sunflower oil for food industry", 2500),
                ("Canned Fruit Pulp", "Natural fruit pulp in bulk packaging", 850),
                ("Spices & Condiments", "High-quality bulk spices for industrial kitchens", 450),
            ],
        }

        print("Seeding products for missing categories...")
        for cat_name, templates in product_templates.items():
            cat = db_categories.get(cat_name)
            if not cat: continue
            
            # Check if cat already has products
            count = Product.query.filter_by(category_id=cat.id).count()
            if count > 0:
                print(f"Skipping {cat_name} because it already has {count} products.")
                continue
            
            print(f"Adding products to {cat_name}...")
            for i in range(50):
                name, desc, base_price = random.choice(templates)
                # Add a suffix for uniqueness if needed
                product_name = f"{name} - Model {random.randint(100, 999)}"
                price = base_price * (1 + (random.random() * 0.4 - 0.2)) # +/- 20%
                
                company = random.choice(companies)
                
                prod = Product(
                    name=product_name,
                    description=desc,
                    price=round(price, 2),
                    category_id=cat.id,
                    company_id=company.id,
                    location=company.location or "India",
                    featured=random.choice([True, False, False, False]), # 25% featured
                    approved=True
                )
                db.session.add(prod)
            
            db.session.commit()
            print(f"Completed seeding for {cat_name}.")

if __name__ == "__main__":
    seed_missing()
