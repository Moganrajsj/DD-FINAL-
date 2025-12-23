import os
import random
import hashlib
import json
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from werkzeug.security import check_password_hash, generate_password_hash
from dotenv import load_dotenv

# Optional imports
try:
    import razorpay
    RAZORPAY_AVAILABLE = True
except ImportError:
    RAZORPAY_AVAILABLE = False
    razorpay = None

load_dotenv()

try:
    from locations import get_all_locations, get_states_by_country, get_districts_by_state, get_countries
except ImportError:
    # Fallback if locations module doesn't exist
    def get_all_locations():
        return []
    def get_states_by_country(country):
        return []
    def get_districts_by_state(country, state):
        return []
    def get_countries():
        return []

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "tradeindia.db")

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")

# Email configuration
app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER", "smtp.gmail.com")
app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = os.getenv("MAIL_USE_TLS", "True").lower() == "true"
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME", "")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD", "")

# Razorpay configuration
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
razorpay_client = None
if RAZORPAY_AVAILABLE and RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    try:
        razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    except Exception as e:
        print(f"Warning: Failed to initialize Razorpay client: {e}")
        razorpay_client = None

# File upload configuration
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, "products"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, "avatars"), exist_ok=True)

CORS(app)
db = SQLAlchemy(app)
mail = Mail(app)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"))
    avatar_url = db.Column(db.String(255), default="")
    phone = db.Column(db.String(20), default="")
    bio = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    company = db.relationship("Company", back_populates="users")


class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, default="")
    location = db.Column(db.String(120), default="India")
    website = db.Column(db.String(255), default="")
    phone = db.Column(db.String(20), default="")
    gst_number = db.Column(db.String(20), default="")
    verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    products = db.relationship("Product", back_populates="company")
    users = db.relationship("User", back_populates="company")


class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    plan_type = db.Column(db.String(50), nullable=False)  # 'basic', 'premium', 'enterprise'
    is_active = db.Column(db.Boolean, default=True)
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="subscriptions")


class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    products = db.relationship("Product", back_populates="category")


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, default="")
    price = db.Column(db.Float, nullable=True)
    image_url = db.Column(db.String(255), default="")
    featured = db.Column(db.Boolean, default=False)
    location = db.Column(db.String(120), default="India")
    stock_quantity = db.Column(db.Integer, default=0)
    min_order_quantity = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    category_id = db.Column(db.Integer, db.ForeignKey("category.id"))
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"))

    category = db.relationship("Category", back_populates="products")
    company = db.relationship("Company", back_populates="products")


class Inquiry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    quantity = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship("Product", backref="inquiries")


class BuyRequirement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    quantity = db.Column(db.String(50))
    location = db.Column(db.String(120))
    budget = db.Column(db.String(100))
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="buy_requirements")


class TradeLead(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'buy' or 'sell'
    category = db.Column(db.String(100))
    location = db.Column(db.String(120))
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    company = db.relationship("Company", backref="trade_leads")


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False)
    buyer_name = db.Column(db.String(120), nullable=False)
    buyer_email = db.Column(db.String(120), nullable=False)
    buyer_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    quantity = db.Column(db.Integer, default=1)
    unit_price = db.Column(db.Float, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending, processing, shipped, delivered, completed, cancelled
    payment_status = db.Column(db.String(20), default="pending")  # pending, paid, failed, refunded
    payment_method = db.Column(db.String(50), default="")
    payment_id = db.Column(db.String(255), default="")  # Razorpay payment ID
    tracking_number = db.Column(db.String(100), default="")
    shipping_address = db.Column(db.Text, default="")
    shipping_carrier = db.Column(db.String(100), default="")
    estimated_delivery = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = db.relationship("Product", backref="orders")
    company = db.relationship("Company", backref="orders")
    buyer = db.relationship("User", backref="orders")


class ProductImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship("Product", backref="images")


class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    title = db.Column(db.String(200), default="")
    comment = db.Column(db.Text, default="")
    is_verified_purchase = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = db.relationship("Product", backref="reviews")
    user = db.relationship("User", backref="reviews")


class OrderTracking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, default="")
    location = db.Column(db.String(200), default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    order = db.relationship("Order", backref="tracking_history")


class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=True)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sender = db.relationship("User", foreign_keys=[sender_id], backref="sent_messages")
    receiver = db.relationship("User", foreign_keys=[receiver_id], backref="received_messages")
    product = db.relationship("Product", backref="chat_messages")
    order = db.relationship("Order", backref="chat_messages")


def ensure_db():
    """Create the database and seed minimal data if empty."""
    os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
    
    with app.app_context():
        # Always create all tables (SQLAlchemy handles "IF NOT EXISTS" logic)
        db.create_all()
        
        # Check if schema needs updating by testing if new columns exist
        try:
            # Try a simple query to check if Product table has new columns
            result = db.session.execute(db.text("PRAGMA table_info(product)")).fetchall()
            columns = [row[1] for row in result]  # Column names are in index 1
            
            if 'stock_quantity' not in columns or 'min_order_quantity' not in columns:
                # Schema is outdated, need to recreate
                print("⚠ Database schema outdated. Recreating tables...")
                had_data = Category.query.count() > 0 or Product.query.count() > 0
                db.drop_all()
                db.create_all()
                # Reseed if we had data before
                if had_data:
                    print("✓ Reseeding data...")
                    seed_data()
        except Exception as e:
            # If we can't check, just ensure tables exist
            print(f"⚠ Could not verify schema: {e}")
            db.create_all()
        
        # Seed data if categories are empty
        if Category.query.count() == 0:
            seed_data()


def seed_data():
    categories = [
        "Industrial Supplies",
        "Electronics & Electrical",
        "Apparel & Fashion",
        "Machinery",
        "Construction & Real Estate",
        "Chemicals",
        "Food & Beverage",
        "Health & Beauty",
    ]
    category_objs = [Category(name=c) for c in categories]
    db.session.add_all(category_objs)
    db.session.flush()

    # Create 50 manufacturers
    locations = ["Mumbai, India", "Delhi, India", "Bangalore, India", "Chennai, India", "Kolkata, India", 
                 "Hyderabad, India", "Pune, India", "Ahmedabad, India", "Surat, India", "Jaipur, India",
                 "Lucknow, India", "Kanpur, India", "Nagpur, India", "Indore, India", "Thane, India",
                 "Bhopal, India", "Visakhapatnam, India", "Patna, India", "Vadodara, India", "Ghaziabad, India"]
    
    company_types = [
        ("Industries", "Leading manufacturer and exporter of industrial goods"),
        ("Works", "Premium products and industrial supplies manufacturer"),
        ("Systems", "Advanced technology and components manufacturer"),
        ("Apparel", "Premium textile and fashion manufacturing company"),
        ("Corp", "Industrial machinery and equipment manufacturing specialists"),
        ("Construction", "Construction materials and real estate development company"),
        ("Industries", "Chemical manufacturing and distribution company"),
        ("Processors", "Food and beverage processing and packaging company"),
        ("Products", "Health and beauty products manufacturer"),
        ("Ltd", "High-precision industrial tools and equipment"),
        ("Inc", "Electronic components and semiconductor manufacturer"),
        ("Masters", "Premium manufacturing and export company"),
        ("Equipment Co", "Heavy machinery and power equipment manufacturer"),
        ("Builders", "Construction and infrastructure development company"),
        ("Solutions", "Comprehensive supplies and solutions provider"),
        ("Electronics", "Smart electronic devices and IoT solutions manufacturer"),
        ("Textiles", "Luxury textile and fabric manufacturing company"),
        ("Manufacturing", "Professional manufacturing and production services"),
        ("Enterprises", "Diversified business enterprise with multiple product lines"),
        ("Group", "Large-scale industrial group with multiple divisions"),
    ]
    
    company_names = [
        "Acme", "Global", "Tech", "Fashion", "Heavy", "Build", "Chem", "Fresh", "Beauty", "Precision",
        "Digital", "Textile", "Power", "Urban", "Agro", "Gourmet", "Wellness", "Industrial", "Smart", "Premium",
        "Elite", "Prime", "Supreme", "Royal", "Imperial", "Noble", "Grand", "Mega", "Ultra", "Pro",
        "Advanced", "Modern", "Innovative", "Dynamic", "Stellar", "Apex", "Summit", "Peak", "Zenith", "Crown",
        "Diamond", "Platinum", "Gold", "Silver", "Bronze", "Titan", "Giant", "Master", "Expert", "Professional"
    ]
    
    manufacturers_data = []
    used_names = set()
    
    for i in range(50):
        # Generate unique company name
        while True:
            name_base = random.choice(company_names)
            company_type = random.choice(company_types)
            name = f"{name_base} {company_type[0]}"
            if name not in used_names:
                used_names.add(name)
                break
        
        # Generate company data
        location = random.choice(locations)
        website = f"https://{name.lower().replace(' ', '').replace(',', '')}.com"
        verified = random.choice([True, True, True, False])  # 75% verified
        phone = f"+91 {random.randint(9000000000, 9999999999)}"
        
        manufacturers_data.append({
            "name": name,
            "description": company_type[1] + ".",
            "location": location,
            "website": website,
            "phone": phone,
            "verified": verified,
        })

    companies = []
    for mfg_data in manufacturers_data:
        company = Company(
            name=mfg_data["name"],
            description=mfg_data["description"],
            location=mfg_data["location"],
            website=mfg_data["website"],
            phone=mfg_data.get("phone", ""),
            verified=mfg_data.get("verified", False),
        )
        companies.append(company)
        db.session.add(company)
    
    db.session.flush()

    # Generate 100 products per category (800 products total)
    # Product templates for each category
    product_templates = {
        0: [  # Industrial Supplies
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
        1: [  # Electronics & Electrical
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
        2: [  # Apparel & Fashion
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
        3: [  # Machinery
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
        4: [  # Construction & Real Estate
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
        5: [  # Chemicals
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
        6: [  # Food & Beverage
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
        7: [  # Health & Beauty
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
    
    products_data = []
    for category_idx in range(8):
        templates = product_templates[category_idx]
        for i in range(100):
            # Select a template and create variations
            template = templates[i % len(templates)]
            company_idx = random.randint(0, len(companies) - 1)
            
            # Create product name with variation
            base_name = template[0]
            if i >= len(templates):
                variations = ["Premium", "Professional", "Industrial", "Advanced", "Standard", "Deluxe"]
                variation = random.choice(variations)
                name = f"{variation} {base_name}"
            else:
                name = base_name
            
            # Vary price slightly
            base_price = template[2]
            price_variation = random.uniform(0.8, 1.2)
            price = int(base_price * price_variation)
            
            # Create description
            description = template[1] + ". High quality and reliable product suitable for industrial and commercial use."
            
            # Featured products (first 2 per category)
            featured = (i < 2)
            
            # Generate product-specific images showing the actual product name
            # Clean product name for URL
            product_name_clean = name.replace(' ', '%20').replace('&', 'and').replace('(', '').replace(')', '').replace(',', '').replace('/', '-').replace('®', '').replace('™', '')
            # Limit to 25 chars for better display
            product_name_display = product_name_clean[:25] if len(product_name_clean) > 25 else product_name_clean
            
            # Use placeholder service that displays the product name
            # This ensures users can see what product it is
            # Format: https://via.placeholder.com/width/height/background/text
            image_url = f"https://via.placeholder.com/400x300/4f46e5/ffffff?text={product_name_display}"
            
            products_data.append({
                "name": name,
                "description": description,
                "price": price,
                "image_url": image_url,
                "featured": featured,
                "category_idx": category_idx,
                "company_idx": company_idx,
            })

    products = []
    for prod_data in products_data:
        product = Product(
            name=prod_data["name"],
            description=prod_data["description"],
            price=prod_data["price"],
            image_url=prod_data["image_url"],
            featured=prod_data["featured"],
            category=category_objs[prod_data["category_idx"]],
            company=companies[prod_data["company_idx"]],
        )
        products.append(product)
        db.session.add(product)
    
    db.session.flush()

    # Add sample trade leads
    trade_leads = [
        TradeLead(
            title="Looking to Buy Industrial Machinery",
            description="We are looking to purchase heavy-duty industrial machinery for our manufacturing unit. Interested suppliers please contact.",
            type="buy",
            category="Machinery",
            location="Delhi, India",
            company=companies[0]
        ),
        TradeLead(
            title="Export Quality Textiles Available",
            description="Premium quality cotton and silk textiles available for export. Competitive pricing and bulk orders welcome.",
            type="sell",
            category="Apparel & Fashion",
            location="Mumbai, India",
            company=companies[3]
        ),
        TradeLead(
            title="Require Electronic Components",
            description="Bulk requirement for electronic components including resistors, capacitors, and ICs. Verified suppliers preferred.",
            type="buy",
            category="Electronics & Electrical",
            location="Bangalore, India",
            company=companies[2]
        ),
    ]
    db.session.add_all(trade_leads)

    # Create demo user associated with first company
    demo_user = User(
        name="Demo Supplier",
        email="demo@dealsdouble.ai",
        password_hash=generate_password_hash("password123"),
        company=companies[0],
    )
    db.session.add(demo_user)
    db.session.flush()
    
    # Generate sample orders for analytics
    from datetime import timedelta
    buyer_names = ["John Smith", "Priya Sharma", "Raj Kumar", "Anita Patel", "Mohammed Ali", 
                   "Sneha Reddy", "Vikram Singh", "Meera Nair", "Arjun Desai", "Kavita Joshi"]
    buyer_emails = [f"buyer{i}@example.com" for i in range(1, 11)]
    statuses = ["completed", "completed", "completed", "pending", "cancelled"]  # 60% completed
    
    orders = []
    # Generate orders for the last 6 months
    for i in range(200):  # Generate 200 sample orders
        product = random.choice(products)
        company = product.company
        days_ago = random.randint(0, 180)  # Last 6 months
        order_date = datetime.utcnow() - timedelta(days=days_ago)
        
        quantity = random.randint(1, 50)
        unit_price = product.price or random.randint(1000, 50000)
        total_amount = unit_price * quantity
        status = random.choice(statuses)
        
        buyer_idx = random.randint(0, len(buyer_names) - 1)
        order = Order(
            product_id=product.id,
            company_id=company.id,
            buyer_name=buyer_names[buyer_idx],
            buyer_email=buyer_emails[buyer_idx],
            quantity=quantity,
            unit_price=unit_price,
            total_amount=total_amount,
            status=status,
            created_at=order_date
        )
        orders.append(order)
    
    db.session.add_all(orders)
    db.session.commit()


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/categories")
def list_categories():
    ensure_db()
    categories = Category.query.order_by(Category.name).all()
    return jsonify([{"id": c.id, "name": c.name} for c in categories])


@app.route("/api/categories", methods=["POST"])
def create_category():
    """Create a new category"""
    ensure_db()
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    
    if not name:
        return jsonify({"error": "Category name is required"}), 400
    
    # Check if category already exists
    existing = Category.query.filter_by(name=name).first()
    if existing:
        return jsonify({"error": "Category already exists"}), 400
    
    # Create new category
    category = Category(name=name)
    db.session.add(category)
    db.session.commit()
    
    return jsonify({"id": category.id, "name": category.name}), 201


@app.route("/api/products")
def list_products():
    ensure_db()
    query = Product.query.join(Company).join(Category)

    search = request.args.get("search")
    category = request.args.get("category")
    featured = request.args.get("featured")
    limit = request.args.get("limit", type=int)
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)

    if search:
        like = f"%{search}%"
        query = query.filter(Product.name.ilike(like) | Product.description.ilike(like))
    if category:
        query = query.filter(Product.category_id == category)
    if featured:
        query = query.filter(Product.featured.is_(True))
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    query = query.order_by(Product.created_at.desc())
    if limit:
        query = query.limit(limit)

    products = query.all()
    
    # Get ratings for products
    product_ids = [p.id for p in products]
    ratings = db.session.query(Review.product_id, db.func.avg(Review.rating).label("avg_rating"), db.func.count(Review.id).label("count")).filter(Review.product_id.in_(product_ids)).group_by(Review.product_id).all() if product_ids else []
    rating_dict = {r.product_id: {"rating": round(float(r.avg_rating), 1), "count": r.count} for r in ratings}
    
    return jsonify(
        [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "price": p.price,
                "image_url": p.image_url,
                "featured": p.featured,
                "category_id": p.category_id,
                "category_name": p.category.name if p.category else None,
                "company_id": p.company_id,
                "company_name": p.company.name if p.company else None,
                "location": p.company.location if p.company else "India",
                "rating": rating_dict.get(p.id, {}).get("rating", 0),
                "review_count": rating_dict.get(p.id, {}).get("count", 0),
            }
            for p in products
        ]
    )


@app.route("/api/products/<int:product_id>")
def get_product(product_id: int):
    ensure_db()
    product = Product.query.get_or_404(product_id)
    
    # Get images
    images = ProductImage.query.filter_by(product_id=product_id).order_by(ProductImage.display_order, ProductImage.id).all()
    image_list = [img.image_url for img in images] if images else ([product.image_url] if product.image_url else [])
    
    # Get rating
    rating_data = db.session.query(db.func.avg(Review.rating).label("avg_rating"), db.func.count(Review.id).label("count")).filter_by(product_id=product_id).first()
    avg_rating = round(float(rating_data.avg_rating), 1) if rating_data and rating_data.avg_rating else 0
    review_count = rating_data.count if rating_data else 0
    
    return jsonify(
        {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "image_url": product.image_url,
            "images": image_list,
            "featured": product.featured,
            "category_id": product.category_id,
            "category_name": product.category.name if product.category else None,
            "company_id": product.company_id,
            "company_name": product.company.name if product.company else None,
            "company_description": product.company.description if product.company else "",
            "company_phone": product.company.phone if product.company else "",
            "location": product.company.location if product.company else "India",
            "rating": avg_rating,
            "review_count": review_count,
            "stock_quantity": product.stock_quantity,
            "min_order_quantity": product.min_order_quantity,
        }
    )


@app.route("/api/suppliers")
def list_suppliers():
    ensure_db()
    companies = Company.query.order_by(Company.name).all()
    return jsonify(
        [
            {
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "location": c.location,
                "website": c.website,
                "verified": c.verified,
                "product_count": len(c.products),
            }
            for c in companies
        ]
    )


@app.route("/api/suppliers/<int:company_id>")
def get_supplier(company_id: int):
    ensure_db()
    company = Company.query.get_or_404(company_id)
    return jsonify(
        {
            "id": company.id,
            "name": company.name,
            "description": company.description,
            "location": company.location,
            "website": company.website,
            "verified": company.verified,
            "products": [
                {
                    "id": p.id,
                    "name": p.name,
                    "price": p.price,
                    "image_url": p.image_url,
                    "category_name": p.category.name if p.category else None,
                }
                for p in company.products
            ],
        }
    )


@app.route("/api/auth/register", methods=["POST"])
def register():
    ensure_db()
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    if not all([name, email, password]):
        return jsonify({"error": "Missing fields"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    user = User(name=name, email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return jsonify({"token": "demo-token", "user": {"id": user.id, "name": user.name, "email": user.email}})


@app.route("/api/auth/login", methods=["POST"])
def login():
    ensure_db()
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Get company info if user has one
    company = None
    if user.company_id:
        company = Company.query.get(user.company_id)
    
    return jsonify({
        "token": "demo-token", 
        "user": {
            "id": user.id, 
            "name": user.name, 
            "email": user.email,
            "company_id": user.company_id,
            "has_company": user.company_id is not None,
            "company_verified": company.verified if company else False
        }
    })


@app.route("/api/dashboard")
def dashboard():
    ensure_db()
    # For simplicity, return aggregate stats and recent products
    product_count = Product.query.count()
    supplier_count = Company.query.count()
    category_count = Category.query.count()
    latest_products = (
        Product.query.order_by(Product.created_at.desc()).limit(5).all()
    )
    return jsonify(
        {
            "stats": {
                "products": product_count,
                "suppliers": supplier_count,
                "categories": category_count,
            },
            "latest_products": [
                {"id": p.id, "name": p.name, "price": p.price, "company_name": p.company.name if p.company else None}
                for p in latest_products
            ],
        }
    )


@app.route("/api/post-product", methods=["POST"])
def post_product():
    ensure_db()
    data = request.get_json() or {}
    name = data.get("name")
    description = data.get("description", "")
    price = data.get("price")
    image_url = data.get("image_url", "")
    category_id = data.get("category_id")
    company_id = data.get("company_id")
    user_id = data.get("user_id")  # Get user_id from request

    if not all([name, category_id]):
        return jsonify({"error": "Missing required fields"}), 400

    # If company_id not provided, get from user
    if not company_id and user_id:
        user = User.query.get(user_id)
        if not user or not user.company_id:
            return jsonify({"error": "User must have a registered company"}), 400
        company_id = user.company_id
    
    if not company_id:
        return jsonify({"error": "Company ID is required"}), 400

    # Check if company is verified
    company = Company.query.get(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404
    
    if not company.verified:
        return jsonify({"error": "Your company is pending verification. You can post products once your company is verified by admin."}), 403

    product = Product(
        name=name,
        description=description,
        price=price,
        image_url=image_url,
        category_id=category_id,
        company_id=company_id,
        featured=False,
    )
    db.session.add(product)
    db.session.commit()
    return jsonify({"message": "Product created", "id": product.id}), 201


@app.route("/api/stats")
def stats():
    ensure_db()
    return jsonify(
        {
            "products": Product.query.count(),
            "suppliers": Company.query.count(),
            "categories": Category.query.count(),
        }
    )


@app.route("/api/inquiries", methods=["POST"])
def create_inquiry():
    ensure_db()
    data = request.get_json() or {}
    
    product_id = data.get("product_id")
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    message = data.get("message")
    quantity = data.get("quantity", "")
    
    if not all([product_id, name, email, phone, message]):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Check if product exists
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    inquiry = Inquiry(
        product_id=product_id,
        name=name,
        email=email,
        phone=phone,
        message=message,
        quantity=quantity
    )
    db.session.add(inquiry)
    db.session.commit()
    
    return jsonify({"message": "Inquiry sent successfully", "id": inquiry.id}), 201


@app.route("/api/buy-requirements", methods=["GET", "POST"])
def buy_requirements():
    ensure_db()
    if request.method == "GET":
        requirements = BuyRequirement.query.order_by(BuyRequirement.created_at.desc()).all()
        return jsonify([
            {
                "id": r.id,
                "product_name": r.product_name,
                "description": r.description,
                "quantity": r.quantity,
                "location": r.location,
                "budget": r.budget,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in requirements
        ])
    else:  # POST
        data = request.get_json() or {}
        requirement = BuyRequirement(
            product_name=data.get("product_name"),
            description=data.get("description"),
            quantity=data.get("quantity", ""),
            location=data.get("location", ""),
            budget=data.get("budget", "")
        )
        db.session.add(requirement)
        db.session.commit()
        return jsonify({"message": "Buy requirement posted", "id": requirement.id}), 201


@app.route("/api/trade-leads", methods=["GET"])
def trade_leads():
    ensure_db()
    lead_type = request.args.get("type", "all")
    
    query = TradeLead.query
    if lead_type != "all":
        query = query.filter(TradeLead.type == lead_type)
    
    leads = query.order_by(TradeLead.created_at.desc()).all()
    return jsonify([
        {
            "id": l.id,
            "title": l.title,
            "description": l.description,
            "type": l.type,
            "category": l.category,
            "location": l.location,
            "created_at": l.created_at.isoformat() if l.created_at else None
        }
        for l in leads
    ])


@app.route("/api/products/<int:product_id>/phone", methods=["GET"])
def get_product_phone(product_id: int):
    ensure_db()
    # Check if user is authenticated
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token or token == "null":
        return jsonify({"error": "Authentication required"}), 401
    
    # Get user_id from query params (simplified - in production, verify JWT token)
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
    
    # Check subscription
    subscription = Subscription.query.filter_by(
        user_id=user_id,
        is_active=True
    ).first()
    
    if not subscription:
        return jsonify({"error": "Active subscription required to view phone numbers"}), 403
    
    product = Product.query.get_or_404(product_id)
    if not product.company or not product.company.phone:
        return jsonify({"error": "Phone number not available"}), 404
    
    return jsonify({
        "phone": product.company.phone,
        "company_name": product.company.name
    })


@app.route("/api/subscriptions", methods=["POST"])
def create_subscription():
    ensure_db()
    data = request.get_json() or {}
    user_id = data.get("user_id")
    plan_type = data.get("plan_type", "basic")
    
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
    
    # Check if user already has active subscription
    existing = Subscription.query.filter_by(
        user_id=user_id,
        is_active=True
    ).first()
    
    if existing:
        return jsonify({"message": "Subscription already active", "id": existing.id}), 200
    
    subscription = Subscription(
        user_id=user_id,
        plan_type=plan_type,
        is_active=True
    )
    db.session.add(subscription)
    db.session.commit()
    
    return jsonify({"message": "Subscription created", "id": subscription.id}), 201


@app.route("/api/subscriptions/check/<int:user_id>")
def check_subscription(user_id: int):
    ensure_db()
    subscription = Subscription.query.filter_by(
        user_id=user_id,
        is_active=True
    ).first()
    
    return jsonify({
        "has_subscription": subscription is not None,
        "plan_type": subscription.plan_type if subscription else None
    })


@app.route("/api/locations")
def get_locations():
    """Get all locations"""
    return jsonify(get_all_locations())

@app.route("/api/locations/countries")
def get_countries_list():
    """Get all available countries"""
    return jsonify(get_countries())

@app.route("/api/locations/states")
def get_states():
    """Get states by country"""
    country = request.args.get("country")
    countries = get_countries()
    selected_country = country or (countries[0] if countries else "India")
    return jsonify(get_states_by_country(selected_country))


@app.route("/api/locations/districts")
def get_districts():
    """Get districts by state"""
    countries = get_countries()
    default_country = countries[0] if countries else "India"
    country = request.args.get("country", default_country)
    state = request.args.get("state")
    if not state:
        return jsonify({"error": "State parameter required"}), 400
    return jsonify(get_districts_by_state(country, state))


@app.route("/api/companies/register", methods=["POST"])
def register_company():
    """Register a new company for a user"""
    ensure_db()
    data = request.get_json() or {}
    user_id = data.get("user_id")
    name = data.get("name")
    description = data.get("description", "")
    location = data.get("location", "India")
    website = data.get("website", "")
    phone = data.get("phone", "")
    gst_number = data.get("gst_number", "")
    
    if not user_id or not name:
        return jsonify({"error": "User ID and company name are required"}), 400
    
    if not gst_number:
        return jsonify({"error": "GST number is required"}), 400
    
    # Check if user already has a company
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if user.company_id:
        return jsonify({"error": "User already has a company registered"}), 400
    
    # Create new company
    company = Company(
        name=name,
        description=description,
        location=location,
        website=website,
        phone=phone,
        gst_number=gst_number,
        verified=False  # Admin needs to verify
    )
    db.session.add(company)
    db.session.flush()
    
    # Link company to user
    user.company_id = company.id
    db.session.commit()
    
    return jsonify({
        "message": "Company registered successfully. Waiting for admin verification.",
        "company_id": company.id,
        "company_name": company.name
    }), 201


@app.route("/api/companies/verify/<int:company_id>", methods=["POST"])
def verify_company(company_id):
    """Admin endpoint to verify a company"""
    ensure_db()
    company = Company.query.get_or_404(company_id)
    company.verified = True
    db.session.commit()
    
    return jsonify({
        "message": "Company verified successfully",
        "company_id": company.id,
        "company_name": company.name
    })


@app.route("/api/companies/pending", methods=["GET"])
def get_pending_companies():
    """Get all companies pending verification"""
    ensure_db()
    pending_companies = Company.query.filter_by(verified=False).all()
    
    return jsonify([
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "location": c.location,
            "website": c.website,
            "phone": c.phone,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "user_name": c.users[0].name if c.users else None,
            "user_email": c.users[0].email if c.users else None
        }
        for c in pending_companies
    ])


@app.route("/api/seller/inquiries")
def get_seller_inquiries():
    """Get inquiries for seller's company products"""
    ensure_db()
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
    
    user = User.query.get(user_id)
    if not user or not user.company_id:
        return jsonify({"error": "User must have a company"}), 400
    
    # Get all inquiries for products belonging to user's company
    inquiries = db.session.query(Inquiry).join(Product).filter(
        Product.company_id == user.company_id
    ).order_by(Inquiry.created_at.desc()).all()
    
    return jsonify([
        {
            "id": i.id,
            "product_id": i.product_id,
            "product_name": i.product.name,
            "buyer_name": i.name,
            "buyer_email": i.email,
            "buyer_phone": i.phone,
            "message": i.message,
            "quantity": i.quantity,
            "created_at": i.created_at.isoformat() if i.created_at else None
        }
        for i in inquiries
    ])


@app.route("/api/seller/orders")
def get_seller_orders():
    """Get orders for seller's company"""
    ensure_db()
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
    
    user = User.query.get(user_id)
    if not user or not user.company_id:
        return jsonify({"error": "User must have a company"}), 400
    
    # Get all orders for user's company
    orders = Order.query.filter_by(company_id=user.company_id).order_by(Order.created_at.desc()).all()
    
    return jsonify([
        {
            "id": o.id,
            "product_id": o.product_id,
            "product_name": o.product.name,
            "buyer_name": o.buyer_name,
            "buyer_email": o.buyer_email,
            "quantity": o.quantity,
            "unit_price": o.unit_price,
            "total_amount": o.total_amount,
            "status": o.status,
            "created_at": o.created_at.isoformat() if o.created_at else None
        }
        for o in orders
    ])


@app.route("/api/orders/<int:order_id>/status", methods=["PUT"])
def update_order_status(order_id):
    """Update order status - allows buyer to update their own order or seller to update their company's orders"""
    ensure_db()
    data = request.get_json() or {}
    new_status = data.get("status")
    user_id = data.get("user_id")  # Get user_id from request
    
    if not new_status:
        return jsonify({"error": "Status is required"}), 400
    
    if new_status not in ["pending", "completed", "cancelled"]:
        return jsonify({"error": "Invalid status"}), 400
    
    order = Order.query.get_or_404(order_id)
    
    # Authorization: Check if user is the buyer or the seller (company owner)
    is_authorized = False
    if user_id:
        user = User.query.get(user_id)
        if user:
            # Check if user is the buyer (by email match)
            if user.email == order.buyer_email:
                is_authorized = True
            # Check if user is the seller (company owner)
            elif user.company_id and user.company_id == order.company_id:
                is_authorized = True
    
    if not is_authorized:
        return jsonify({"error": "Unauthorized: You can only update your own orders"}), 403
    
    order.status = new_status
    db.session.commit()
    
    return jsonify({
        "message": "Order status updated successfully",
        "order_id": order.id,
        "status": order.status
    })


@app.route("/api/seller/orders/<int:order_id>/status", methods=["PUT"])
def update_seller_order_status(order_id):
    """Update order status - seller only endpoint (for backward compatibility)"""
    ensure_db()
    data = request.get_json() or {}
    new_status = data.get("status")
    user_id = data.get("user_id")
    
    if not new_status:
        return jsonify({"error": "Status is required"}), 400
    
    if new_status not in ["pending", "completed", "cancelled"]:
        return jsonify({"error": "Invalid status"}), 400
    
    order = Order.query.get_or_404(order_id)
    
    # Authorization: Check if user is the seller (company owner)
    if user_id:
        user = User.query.get(user_id)
        if user and user.company_id and user.company_id == order.company_id:
            order.status = new_status
            db.session.commit()
            return jsonify({
                "message": "Order status updated successfully",
                "order_id": order.id,
                "status": order.status
            })
    
    return jsonify({"error": "Unauthorized: Only the seller can update this order"}), 403


@app.route("/api/orders/<int:order_id>", methods=["PUT"])
def update_order(order_id):
    """Update order details including payment method and status"""
    ensure_db()
    data = request.get_json() or {}
    user_id = data.get("user_id")
    
    order = Order.query.get_or_404(order_id)
    
    # Authorization: Check if user is the buyer (by email match)
    is_authorized = False
    if user_id:
        user = User.query.get(user_id)
        if user and user.email == order.buyer_email:
            is_authorized = True
    
    if not is_authorized:
        return jsonify({"error": "Unauthorized: You can only update your own orders"}), 403
    
    # Update payment method if provided
    if 'payment_method' in data:
        order.payment_method = data.get('payment_method')
    
    # Update payment status if provided
    if 'payment_status' in data:
        order.payment_status = data.get('payment_status')
    
    # Update status if provided
    if 'status' in data:
        order.status = data.get('status')
    
    order.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        "message": "Order updated successfully",
        "order_id": order.id,
        "status": order.status,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status
    })


@app.route("/api/orders", methods=["POST"])
def create_order():
    """Create a new order when a buyer clicks Buy Now.

    We accept buyer_name and buyer_email from the frontend so the order
    still works even if the stored user_id no longer exists (e.g. after reseeding).
    """
    ensure_db()
    data = request.get_json() or {}

    user_id = data.get("user_id")
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)
    buyer_name = data.get("buyer_name")
    buyer_email = data.get("buyer_email")

    if not product_id:
        return jsonify({"error": "Product ID is required"}), 400

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        quantity = 1

    if quantity <= 0:
        quantity = 1

    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    if not product.company_id:
        return jsonify({"error": "Product is not linked to a company"}), 400

    # If we have a user_id, try to pull missing name/email from that user,
    # but don't fail the order if the user record is gone.
    if user_id and (not buyer_name or not buyer_email):
        user = User.query.get(user_id)
        if user:
            buyer_name = buyer_name or user.name
            buyer_email = buyer_email or user.email

    if not buyer_name or not buyer_email:
        return jsonify({"error": "Buyer name and email are required"}), 400

    unit_price = product.price or 0
    total_amount = (unit_price or 0) * quantity

    order = Order(
        product_id=product.id,
        company_id=product.company_id,
        buyer_name=buyer_name,
        buyer_email=buyer_email,
        buyer_id=user_id if user_id else None,
        quantity=quantity,
        unit_price=unit_price,
        total_amount=total_amount,
        status="pending",
        payment_status="pending",
    )
    db.session.add(order)
    db.session.commit()

    return jsonify(
        {
            "id": order.id,
            "product_id": order.product_id,
            "product_name": product.name,
            "company_id": order.company_id,
            "company_name": product.company.name if product.company else None,
            "buyer_name": order.buyer_name,
            "buyer_email": order.buyer_email,
            "quantity": order.quantity,
            "unit_price": order.unit_price,
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        }
    ), 201


@app.route("/api/my-orders")
def get_my_orders():
    """Get orders for the logged-in buyer (by user_id / email)"""
    ensure_db()
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
    
    # Get user to check email
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get orders by buyer_id OR buyer_email (for backward compatibility)
    orders = (
        Order.query.filter(
            (Order.buyer_id == user_id) | (Order.buyer_email == user.email)
        )
        .order_by(Order.created_at.desc())
        .all()
    )

    return jsonify(
        [
            {
                "id": o.id,
                "product_id": o.product_id,
                "product_name": o.product.name if o.product else None,
                "company_name": o.company.name if o.company else None,
                "quantity": o.quantity,
                "unit_price": o.unit_price,
                "total_amount": o.total_amount,
                "status": o.status,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in orders
        ]
    )


@app.route("/api/admin/analytics")
def get_admin_analytics():
    """Get comprehensive analytics for admin dashboard"""
    ensure_db()
    from sqlalchemy import func, extract
    from datetime import timedelta
    
    # Total orders
    total_orders = Order.query.count()
    
    # Total revenue (completed orders only)
    total_revenue = db.session.query(func.sum(Order.total_amount)).filter(
        Order.status == "completed"
    ).scalar() or 0
    
    # Revenue by month (last 6 months)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    monthly_revenue = db.session.query(
        extract('year', Order.created_at).label('year'),
        extract('month', Order.created_at).label('month'),
        func.sum(Order.total_amount).label('revenue')
    ).filter(
        Order.status == "completed",
        Order.created_at >= six_months_ago
    ).group_by(
        extract('year', Order.created_at),
        extract('month', Order.created_at)
    ).order_by('year', 'month').all()
    
    revenue_by_month = [
        {
            "month": f"{int(r.month):02d}/{int(r.year)}",
            "revenue": float(r.revenue) if r.revenue else 0
        }
        for r in monthly_revenue
    ]
    
    # Top selling companies (by revenue)
    top_companies = db.session.query(
        Company.id,
        Company.name,
        func.sum(Order.total_amount).label('total_revenue'),
        func.count(Order.id).label('order_count')
    ).join(Order, Company.id == Order.company_id).filter(
        Order.status == "completed"
    ).group_by(Company.id, Company.name).order_by(
        func.sum(Order.total_amount).desc()
    ).limit(10).all()
    
    top_companies_data = [
        {
            "id": c.id,
            "name": c.name,
            "revenue": float(c.total_revenue) if c.total_revenue else 0,
            "orders": c.order_count
        }
        for c in top_companies
    ]
    
    # Category analysis (products sold by category)
    category_analysis = db.session.query(
        Category.id,
        Category.name,
        func.count(Order.id).label('order_count'),
        func.sum(Order.total_amount).label('revenue')
    ).join(Product, Category.id == Product.category_id).join(
        Order, Product.id == Order.product_id
    ).filter(
        Order.status == "completed"
    ).group_by(Category.id, Category.name).order_by(
        func.sum(Order.total_amount).desc()
    ).all()
    
    category_data = [
        {
            "id": c.id,
            "name": c.name,
            "orders": c.order_count,
            "revenue": float(c.revenue) if c.revenue else 0
        }
        for c in category_analysis
    ]
    
    # Orders by status
    orders_by_status = db.session.query(
        Order.status,
        func.count(Order.id).label('count')
    ).group_by(Order.status).all()
    
    status_data = {s.status: s.count for s in orders_by_status}
    
    # Recent orders (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_orders_count = Order.query.filter(
        Order.created_at >= thirty_days_ago
    ).count()
    
    # Revenue forecast (simple linear projection based on last 3 months)
    forecast_data = []
    if len(revenue_by_month) >= 2:
        last_3_months = revenue_by_month[-3:] if len(revenue_by_month) >= 3 else revenue_by_month
        avg_revenue = sum(r["revenue"] for r in last_3_months) / len(last_3_months)
        
        # Forecast next 3 months
        for i in range(1, 4):
            forecast_month = datetime.utcnow() + timedelta(days=30 * i)
            forecast_data.append({
                "month": forecast_month.strftime("%m/%Y"),
                "forecasted_revenue": avg_revenue * (1 + 0.1 * i)  # 10% growth assumption
            })
    
    return jsonify({
        "total_orders": total_orders,
        "total_revenue": float(total_revenue) if total_revenue else 0,
        "recent_orders_30d": recent_orders_count,
        "revenue_by_month": revenue_by_month,
        "top_companies": top_companies_data,
        "category_analysis": category_data,
        "orders_by_status": status_data,
        "forecast": forecast_data
    })


# ==================== NEW FEATURE ENDPOINTS ====================

# Image Upload
@app.route("/api/upload/image", methods=["POST"])
def upload_image():
    """Upload image for products or avatars."""
    ensure_db()
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    upload_type = request.form.get("type", "product")  # "product" or "avatar"
    
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{random.randint(1000, 9999)}_{filename}"
        folder = "products" if upload_type == "product" else "avatars"
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], folder, unique_filename)
        file.save(filepath)
        
        url = f"/uploads/{folder}/{unique_filename}"
        return jsonify({"url": url, "filename": unique_filename})
    
    return jsonify({"error": "Invalid file type"}), 400


@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    """Serve uploaded files."""
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# Product Images
@app.route("/api/products/<int:product_id>/images", methods=["GET", "POST"])
def product_images(product_id):
    """Get or add product images."""
    ensure_db()
    product = Product.query.get_or_404(product_id)
    
    if request.method == "GET":
        images = ProductImage.query.filter_by(product_id=product_id).order_by(ProductImage.display_order, ProductImage.id).all()
        return jsonify([{"id": img.id, "url": img.image_url, "is_primary": img.is_primary} for img in images])
    
    # POST - Add image
    data = request.get_json() or {}
    image_url = data.get("image_url")
    is_primary = data.get("is_primary", False)
    
    if not image_url:
        return jsonify({"error": "image_url is required"}), 400
    
    # If setting as primary, unset others
    if is_primary:
        ProductImage.query.filter_by(product_id=product_id, is_primary=True).update({"is_primary": False})
    
    image = ProductImage(product_id=product_id, image_url=image_url, is_primary=is_primary)
    db.session.add(image)
    db.session.commit()
    
    return jsonify({"id": image.id, "url": image.image_url, "is_primary": image.is_primary})


@app.route("/api/products/<int:product_id>/images/<int:image_id>", methods=["DELETE"])
def delete_product_image(product_id, image_id):
    """Delete a product image."""
    ensure_db()
    image = ProductImage.query.filter_by(id=image_id, product_id=product_id).first_or_404()
    db.session.delete(image)
    db.session.commit()
    return jsonify({"message": "Image deleted"})


# Reviews and Ratings
@app.route("/api/products/<int:product_id>/reviews", methods=["GET", "POST"])
def product_reviews(product_id):
    """Get or add product reviews."""
    ensure_db()
    product = Product.query.get_or_404(product_id)
    
    if request.method == "GET":
        reviews = Review.query.filter_by(product_id=product_id).order_by(Review.created_at.desc()).all()
        avg_rating = db.session.query(db.func.avg(Review.rating)).filter_by(product_id=product_id).scalar() or 0
        
        return jsonify({
            "reviews": [{
                "id": r.id,
                "user_id": r.user_id,
                "user_name": r.user.name,
                "user_avatar": r.user.avatar_url,
                "rating": r.rating,
                "title": r.title,
                "comment": r.comment,
                "is_verified_purchase": r.is_verified_purchase,
                "created_at": r.created_at.isoformat()
            } for r in reviews],
            "average_rating": round(float(avg_rating), 1),
            "total_reviews": len(reviews)
        })
    
    # POST - Add review
    data = request.get_json() or {}
    user_id = data.get("user_id")
    rating = data.get("rating")
    title = data.get("title", "")
    comment = data.get("comment", "")
    
    if not user_id or not rating:
        return jsonify({"error": "user_id and rating are required"}), 400
    
    if rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400
    
    # Check if user already reviewed
    existing = Review.query.filter_by(product_id=product_id, user_id=user_id).first()
    if existing:
        return jsonify({"error": "You have already reviewed this product"}), 400
    
    # Check if user purchased (for verified purchase badge)
    has_purchase = Order.query.filter_by(product_id=product_id, buyer_id=user_id, status="completed").first() is not None
    
    review = Review(
        product_id=product_id,
        user_id=user_id,
        rating=rating,
        title=title,
        comment=comment,
        is_verified_purchase=has_purchase
    )
    db.session.add(review)
    db.session.commit()
    
    return jsonify({
        "id": review.id,
        "rating": review.rating,
        "title": review.title,
        "comment": review.comment,
        "is_verified_purchase": review.is_verified_purchase
    })


# Order Tracking
@app.route("/api/orders/<int:order_id>/tracking", methods=["GET", "POST"])
def order_tracking(order_id):
    """Get or add order tracking updates."""
    ensure_db()
    order = Order.query.get_or_404(order_id)
    
    if request.method == "GET":
        tracking = OrderTracking.query.filter_by(order_id=order_id).order_by(OrderTracking.created_at.desc()).all()
        return jsonify([{
            "id": t.id,
            "status": t.status,
            "message": t.message,
            "location": t.location,
            "created_at": t.created_at.isoformat()
        } for t in tracking])
    
    # POST - Add tracking update
    data = request.get_json() or {}
    status = data.get("status")
    message = data.get("message", "")
    location = data.get("location", "")
    
    if not status:
        return jsonify({"error": "status is required"}), 400
    
    tracking = OrderTracking(order_id=order_id, status=status, message=message, location=location)
    db.session.add(tracking)
    
    # Update order status if provided
    if data.get("update_order_status"):
        order.status = status
        order.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        "id": tracking.id,
        "status": tracking.status,
        "message": tracking.message,
        "created_at": tracking.created_at.isoformat()
    })


@app.route("/api/orders/<int:order_id>/tracking-number", methods=["PUT"])
def update_tracking_number(order_id):
    """Update order tracking number."""
    ensure_db()
    order = Order.query.get_or_404(order_id)
    data = request.get_json() or {}
    
    tracking_number = data.get("tracking_number")
    shipping_carrier = data.get("shipping_carrier", "")
    
    if tracking_number:
        order.tracking_number = tracking_number
        order.shipping_carrier = shipping_carrier
        order.status = "shipped"
        order.updated_at = datetime.utcnow()
        
        # Add tracking entry
        tracking = OrderTracking(
            order_id=order_id,
            status="shipped",
            message=f"Order shipped via {shipping_carrier or 'carrier'}",
            location=""
        )
        db.session.add(tracking)
        db.session.commit()
        
        return jsonify({"message": "Tracking number updated", "tracking_number": tracking_number})
    
    return jsonify({"error": "tracking_number is required"}), 400


# Payment Gateway (Razorpay)
@app.route("/api/payments/create-order", methods=["POST"])
def create_payment_order():
    """Create Razorpay order."""
    ensure_db()
    if not razorpay_client:
        return jsonify({"error": "Payment gateway not configured"}), 500
    
    data = request.get_json() or {}
    amount = data.get("amount")
    currency = data.get("currency", "INR")
    order_id = data.get("order_id")  # Our internal order ID
    
    if not amount or not order_id:
        return jsonify({"error": "amount and order_id are required"}), 400
    
    try:
        # Create Razorpay order
        razorpay_order = razorpay_client.order.create({
            "amount": int(amount * 100),  # Convert to paise
            "currency": currency,
            "receipt": f"order_{order_id}",
            "notes": {
                "order_id": order_id
            }
        })
        
        return jsonify({
            "razorpay_order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "key_id": RAZORPAY_KEY_ID
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/payments/verify", methods=["POST"])
def verify_payment():
    """Verify Razorpay payment."""
    ensure_db()
    if not razorpay_client:
        return jsonify({"error": "Payment gateway not configured"}), 500
    
    data = request.get_json() or {}
    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_signature = data.get("razorpay_signature")
    order_id = data.get("order_id")
    
    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id]):
        return jsonify({"error": "Missing payment details"}), 400
    
    try:
        # Verify signature
        params_dict = {
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature
        }
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Update order
        order = Order.query.get_or_404(order_id)
        order.payment_status = "paid"
        order.payment_id = razorpay_payment_id
        order.status = "processing"
        order.updated_at = datetime.utcnow()
        
        # Add tracking
        tracking = OrderTracking(
            order_id=order_id,
            status="processing",
            message="Payment received, order is being processed",
            location=""
        )
        db.session.add(tracking)
        db.session.commit()
        
        # Send email notification
        try:
            send_order_confirmation_email(order)
        except:
            pass  # Don't fail if email fails
        
        return jsonify({"message": "Payment verified successfully", "order_id": order_id})
    except Exception as e:
        return jsonify({"error": f"Payment verification failed: {str(e)}"}), 400


# User Profiles
@app.route("/api/users/<int:user_id>/profile", methods=["GET", "PUT"])
def user_profile(user_id):
    """Get or update user profile."""
    ensure_db()
    user = User.query.get_or_404(user_id)
    
    if request.method == "GET":
        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "avatar_url": user.avatar_url,
            "phone": user.phone,
            "bio": user.bio,
            "company_id": user.company_id,
            "created_at": user.created_at.isoformat()
        })
    
    # PUT - Update profile
    data = request.get_json() or {}
    if "name" in data:
        user.name = data["name"]
    if "phone" in data:
        user.phone = data["phone"]
    if "bio" in data:
        user.bio = data["bio"]
    if "avatar_url" in data:
        user.avatar_url = data["avatar_url"]
    
    db.session.commit()
    return jsonify({"message": "Profile updated", "user": {
        "id": user.id,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "phone": user.phone,
        "bio": user.bio
    }})


# Order History
@app.route("/api/users/<int:user_id>/orders", methods=["GET"])
def user_orders(user_id):
    """Get user's order history."""
    ensure_db()
    user = User.query.get_or_404(user_id)
    
    orders = Order.query.filter_by(buyer_id=user_id).order_by(Order.created_at.desc()).all()
    
    return jsonify([{
        "id": o.id,
        "product_id": o.product_id,
        "product_name": o.product.name if o.product else "Unknown",
        "company_name": o.company.name if o.company else "Unknown",
        "quantity": o.quantity,
        "unit_price": o.unit_price,
        "total_amount": o.total_amount,
        "status": o.status,
        "payment_status": o.payment_status,
        "tracking_number": o.tracking_number,
        "created_at": o.created_at.isoformat(),
        "updated_at": o.updated_at.isoformat() if o.updated_at else None
    } for o in orders])


# Advanced Search
@app.route("/api/products/search", methods=["GET"])
def advanced_search():
    """Advanced product search with multiple filters."""
    ensure_db()
    query = Product.query.join(Company).join(Category)
    
    # Text search
    search = request.args.get("search")
    if search:
        like = f"%{search}%"
        query = query.filter(Product.name.ilike(like) | Product.description.ilike(like))
    
    # Category filter
    category = request.args.get("category")
    if category:
        query = query.filter(Product.category_id == category)
    
    # Price range
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    # Rating filter (requires join with reviews)
    min_rating = request.args.get("min_rating", type=float)
    if min_rating is not None:
        subquery = db.session.query(Review.product_id, db.func.avg(Review.rating).label("avg_rating")).group_by(Review.product_id).having(db.func.avg(Review.rating) >= min_rating).subquery()
        query = query.join(subquery, Product.id == subquery.c.product_id)
    
    # Location filter
    location = request.args.get("location")
    if location:
        query = query.filter(Company.location.ilike(f"%{location}%"))
    
    # Sort options
    sort_by = request.args.get("sort_by", "created_at")
    sort_order = request.args.get("sort_order", "desc")
    
    if sort_by == "price":
        query = query.order_by(Product.price.desc() if sort_order == "desc" else Product.price.asc())
    elif sort_by == "rating":
        # Sort by average rating
        subquery = db.session.query(Review.product_id, db.func.avg(Review.rating).label("avg_rating")).group_by(Review.product_id).subquery()
        query = query.outerjoin(subquery, Product.id == subquery.c.product_id)
        query = query.order_by(subquery.c.avg_rating.desc() if sort_order == "desc" else subquery.c.avg_rating.asc())
    else:
        query = query.order_by(Product.created_at.desc() if sort_order == "desc" else Product.created_at.asc())
    
    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    products = pagination.items
    
    # Get average ratings for products
    product_ids = [p.id for p in products]
    ratings = db.session.query(Review.product_id, db.func.avg(Review.rating).label("avg_rating"), db.func.count(Review.id).label("count")).filter(Review.product_id.in_(product_ids)).group_by(Review.product_id).all()
    rating_dict = {r.product_id: {"rating": round(float(r.avg_rating), 1), "count": r.count} for r in ratings}
    
    return jsonify({
        "products": [{
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "image_url": p.image_url,
            "category_id": p.category_id,
            "category_name": p.category.name if p.category else None,
            "company_id": p.company_id,
            "company_name": p.company.name if p.company else None,
            "location": p.company.location if p.company else "India",
            "rating": rating_dict.get(p.id, {}).get("rating", 0),
            "review_count": rating_dict.get(p.id, {}).get("count", 0)
        } for p in products],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": pagination.total,
            "pages": pagination.pages
        }
    })


# Real-time Chat
@app.route("/api/chat/conversations", methods=["GET"])
def get_conversations():
    """Get all conversations for a user."""
    ensure_db()
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    # Get all unique conversations (users who sent/received messages)
    sent_conversations = db.session.query(ChatMessage.receiver_id).filter_by(sender_id=user_id).distinct().all()
    received_conversations = db.session.query(ChatMessage.sender_id).filter_by(receiver_id=user_id).distinct().all()
    
    all_user_ids = set([c[0] for c in sent_conversations] + [c[0] for c in received_conversations])
    
    conversations = []
    for other_user_id in all_user_ids:
        other_user = User.query.get(other_user_id)
        if not other_user:
            continue
        
        # Get last message
        last_message = ChatMessage.query.filter(
            ((ChatMessage.sender_id == user_id) & (ChatMessage.receiver_id == other_user_id)) |
            ((ChatMessage.sender_id == other_user_id) & (ChatMessage.receiver_id == user_id))
        ).order_by(ChatMessage.created_at.desc()).first()
        
        # Count unread
        unread_count = ChatMessage.query.filter_by(sender_id=other_user_id, receiver_id=user_id, is_read=False).count()
        
        conversations.append({
            "user_id": other_user_id,
            "user_name": other_user.name,
            "user_avatar": other_user.avatar_url,
            "last_message": last_message.message if last_message else "",
            "last_message_time": last_message.created_at.isoformat() if last_message else None,
            "unread_count": unread_count
        })
    
    # Sort by last message time
    conversations.sort(key=lambda x: x["last_message_time"] or "", reverse=True)
    
    return jsonify(conversations)


@app.route("/api/chat/messages", methods=["GET", "POST"])
def chat_messages():
    """Get or send chat messages."""
    ensure_db()
    
    if request.method == "GET":
        sender_id = request.args.get("sender_id", type=int)
        receiver_id = request.args.get("receiver_id", type=int)
        product_id = request.args.get("product_id", type=int)
        
        if not sender_id or not receiver_id:
            return jsonify({"error": "sender_id and receiver_id are required"}), 400
        
        query = ChatMessage.query.filter(
            ((ChatMessage.sender_id == sender_id) & (ChatMessage.receiver_id == receiver_id)) |
            ((ChatMessage.sender_id == receiver_id) & (ChatMessage.receiver_id == sender_id))
        )
        
        if product_id:
            query = query.filter_by(product_id=product_id)
        
        messages = query.order_by(ChatMessage.created_at.asc()).all()
        
        # Mark as read
        ChatMessage.query.filter_by(sender_id=receiver_id, receiver_id=sender_id, is_read=False).update({"is_read": True})
        db.session.commit()
        
        return jsonify([{
            "id": m.id,
            "sender_id": m.sender_id,
            "sender_name": m.sender.name,
            "receiver_id": m.receiver_id,
            "receiver_name": m.receiver.name,
            "message": m.message,
            "product_id": m.product_id,
            "order_id": m.order_id,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat()
        } for m in messages])
    
    # POST - Send message
    data = request.get_json() or {}
    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    message = data.get("message")
    product_id = data.get("product_id")
    order_id = data.get("order_id")
    
    if not all([sender_id, receiver_id, message]):
        return jsonify({"error": "sender_id, receiver_id, and message are required"}), 400
    
    chat_message = ChatMessage(
        sender_id=sender_id,
        receiver_id=receiver_id,
        message=message,
        product_id=product_id,
        order_id=order_id
    )
    db.session.add(chat_message)
    db.session.commit()
    
    return jsonify({
        "id": chat_message.id,
        "sender_id": chat_message.sender_id,
        "receiver_id": chat_message.receiver_id,
        "message": chat_message.message,
        "created_at": chat_message.created_at.isoformat()
    })


# Email notification helper
def send_order_confirmation_email(order):
    """Send order confirmation email."""
    if not app.config.get("MAIL_USERNAME"):
        return  # Email not configured
    
    try:
        msg = Message(
            subject=f"Order Confirmation - Order #{order.id}",
            recipients=[order.buyer_email],
            body=f"""
Dear {order.buyer_name},

Thank you for your order!

Order ID: {order.id}
Product: {order.product.name if order.product else 'N/A'}
Quantity: {order.quantity}
Total Amount: ₹{order.total_amount}

Your order is being processed and you will receive updates soon.

Best regards,
DealsDouble.AI Team
            """,
            html=f"""
            <html>
            <body>
            <h2>Order Confirmation</h2>
            <p>Dear {order.buyer_name},</p>
            <p>Thank you for your order!</p>
            <ul>
            <li>Order ID: {order.id}</li>
            <li>Product: {order.product.name if order.product else 'N/A'}</li>
            <li>Quantity: {order.quantity}</li>
            <li>Total Amount: ₹{order.total_amount}</li>
            </ul>
            <p>Your order is being processed and you will receive updates soon.</p>
            <p>Best regards,<br>DealsDouble.AI Team</p>
            </body>
            </html>
            """
        )
        mail.send(msg)
    except Exception as e:
        print(f"Failed to send email: {e}")


if __name__ == "__main__":
    ensure_db()
    app.run(host="0.0.0.0", port=5000, debug=True)

