"""Add dummy suppliers and products for testing"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import app, db
from app import Company, Product, Category, User
from datetime import datetime

def add_dummy_data():
    with app.app_context():
        try:
            # Get or create categories
            categories = []
            category_names = ["Electronics", "Machinery", "Textiles", "Chemicals", "Food & Beverages"]
            
            for cat_name in category_names:
                category = Category.query.filter_by(name=cat_name).first()
                if not category:
                    category = Category(name=cat_name)
                    db.session.add(category)
                    db.session.flush()
                categories.append(category)
            
            # Get first category as default
            default_category = categories[0] if categories else Category.query.first()
            if not default_category:
                default_category = Category(name="General")
                db.session.add(default_category)
                db.session.flush()
            
            # Supplier data
            suppliers_data = [
                {
                    "name": "TechSolutions India Pvt Ltd",
                    "description": "Leading supplier of electronic components and IT equipment. We provide high-quality products with excellent customer service.",
                    "location": "Mumbai, Maharashtra, India",
                    "website": "https://techsolutions-india.com"
                },
                {
                    "name": "Global Machinery Works",
                    "description": "Manufacturer and exporter of industrial machinery and equipment. Serving clients worldwide for over 20 years.",
                    "location": "Delhi, NCR, India",
                    "website": "https://globalmachinery.com"
                },
                {
                    "name": "Premium Textiles Export",
                    "description": "Wholesale supplier of premium quality textiles, fabrics, and garments. Exporting to 50+ countries.",
                    "location": "Ahmedabad, Gujarat, India",
                    "website": "https://premiumtextiles.com"
                },
                {
                    "name": "ChemCorp Industries",
                    "description": "Leading chemical manufacturer specializing in industrial chemicals, pharmaceuticals, and specialty chemicals.",
                    "location": "Chennai, Tamil Nadu, India",
                    "website": "https://chemcorp-india.com"
                },
                {
                    "name": "Fresh Foods International",
                    "description": "Exporters of premium quality food products, spices, and beverages. Certified organic and quality assured.",
                    "location": "Bangalore, Karnataka, India",
                    "website": "https://freshfoods-intl.com"
                }
            ]
            
            # Product templates per supplier
            product_templates = [
                # Electronics supplier products
                [
                    {"name": "LED Display Panel 55 inch", "description": "High-resolution 4K LED display panel, perfect for commercial and residential use.", "price": 45000},
                    {"name": "Wireless Bluetooth Headphones", "description": "Premium noise-cancelling wireless headphones with 30-hour battery life.", "price": 3500},
                    {"name": "Smart Home Security Camera", "description": "AI-powered 1080p security camera with night vision and mobile app.", "price": 2500},
                    {"name": "Portable Power Bank 20000mAh", "description": "Fast-charging power bank with USB-C and wireless charging support.", "price": 1200},
                    {"name": "USB-C Hub Multiport Adapter", "description": "7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and more.", "price": 1800}
                ],
                # Machinery supplier products
                [
                    {"name": "Industrial CNC Milling Machine", "description": "Precision CNC milling machine for metal and plastic fabrication.", "price": 850000},
                    {"name": "Hydraulic Press Machine 50 Ton", "description": "Heavy-duty hydraulic press for industrial applications.", "price": 450000},
                    {"name": "Conveyor Belt System 10m", "description": "Automated conveyor belt system for material handling.", "price": 125000},
                    {"name": "Industrial Welding Machine", "description": "Professional arc welding machine with digital controls.", "price": 35000},
                    {"name": "Air Compressor 50 HP", "description": "Industrial air compressor with automatic pressure control.", "price": 280000}
                ],
                # Textiles supplier products
                [
                    {"name": "Premium Cotton Fabric Roll", "description": "High-quality 100% cotton fabric, 50 meters per roll, various colors available.", "price": 8500},
                    {"name": "Silk Saree Collection", "description": "Handwoven silk sarees with intricate designs, premium quality.", "price": 12000},
                    {"name": "Denim Fabric 14oz", "description": "Heavy-duty denim fabric for jeans manufacturing, 30 meters per roll.", "price": 6500},
                    {"name": "Polyester Blend Fabric", "description": "Durable polyester-cotton blend fabric, suitable for uniforms.", "price": 4500},
                    {"name": "Woolen Blanket Set", "description": "Premium woolen blankets, set of 2, various sizes available.", "price": 3500}
                ],
                # Chemicals supplier products
                [
                    {"name": "Industrial Grade Sulfuric Acid", "description": "98% pure sulfuric acid, 25kg drum, industrial grade.", "price": 8500},
                    {"name": "Sodium Hydroxide Flakes", "description": "99% pure sodium hydroxide flakes, 50kg bag, for industrial use.", "price": 12000},
                    {"name": "Hydrogen Peroxide 30%", "description": "Pharmaceutical grade hydrogen peroxide, 20L container.", "price": 4500},
                    {"name": "Ethanol 99.9% Pure", "description": "Laboratory grade ethanol, 5L bottle, for research and industrial use.", "price": 3500},
                    {"name": "Acetone Technical Grade", "description": "High-purity acetone, 20L drum, for industrial applications.", "price": 2800}
                ],
                # Food supplier products
                [
                    {"name": "Premium Basmati Rice 25kg", "description": "Aged basmati rice, premium quality, export grade, 25kg bag.", "price": 2500},
                    {"name": "Organic Turmeric Powder", "description": "100% organic turmeric powder, 1kg pack, certified organic.", "price": 450},
                    {"name": "Black Pepper Whole 1kg", "description": "Premium quality whole black pepper, 1kg pack, export grade.", "price": 650},
                    {"name": "Green Cardamom Pods", "description": "Premium green cardamom pods, 500g pack, high quality.", "price": 1200},
                    {"name": "Honey Pure 1kg", "description": "100% pure natural honey, 1kg jar, unprocessed and organic.", "price": 550}
                ]
            ]
            
            # Create suppliers and products
            created_suppliers = []
            created_products = []
            
            for idx, supplier_data in enumerate(suppliers_data):
                # Check if company already exists
                existing_company = Company.query.filter_by(name=supplier_data["name"]).first()
                if existing_company:
                    print(f"[INFO] Company already exists: {supplier_data['name']}")
                    company = existing_company
                else:
                    # Create company
                    company = Company(
                        name=supplier_data["name"],
                        description=supplier_data["description"],
                        location=supplier_data["location"],
                        website=supplier_data["website"],
                        verified=True  # Auto-verify for dummy data
                    )
                    db.session.add(company)
                    db.session.flush()
                    print(f"[OK] Created company: {supplier_data['name']}")
                
                created_suppliers.append(company)
                
                # Create products for this supplier
                products_for_supplier = product_templates[idx]
                category = categories[idx % len(categories)] if categories else default_category
                
                for product_data in products_for_supplier:
                    # Check if product already exists
                    existing_product = Product.query.filter_by(
                        name=product_data["name"],
                        company_id=company.id
                    ).first()
                    
                    if existing_product:
                        print(f"[INFO] Product already exists: {product_data['name']}")
                        continue
                    
                    product = Product(
                        name=product_data["name"],
                        description=product_data["description"],
                        price=product_data["price"],
                        category_id=category.id,
                        company_id=company.id,
                        approved=True,  # Auto-approve for dummy data
                        featured=(idx == 0)  # Make first supplier's products featured
                    )
                    db.session.add(product)
                    created_products.append(product)
                    print(f"[OK] Created product: {product_data['name']} for {supplier_data['name']}")
            
            # Commit all changes
            db.session.commit()
            
            print(f"\n[SUCCESS] Dummy data created successfully!")
            print(f"  - Suppliers created: {len(created_suppliers)}")
            print(f"  - Products created: {len(created_products)}")
            print(f"\nAll suppliers are verified and all products are approved.")
            
        except Exception as e:
            print(f"[ERROR] Failed to create dummy data: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()

if __name__ == "__main__":
    add_dummy_data()



