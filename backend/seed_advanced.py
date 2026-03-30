from app import db, app, Product
import json

def seed_advanced():
    with app.app_context():
        # Update product with ID 1 (or any existing)
        p = Product.query.first()
        if p:
            p.ai_summary = "High-precision hydraulic valve designed for extreme industrial pressure (up to 5000 PSI). Features self-lubricating seals and an anti-corrosive stainless steel core. Optimized for construction and manufacturing workflows."
            p.price_trend = 4.2
            p.bulk_pricing_json = json.dumps([
                {"min": 1, "max": 99, "price": p.price},
                {"min": 100, "max": 499, "price": p.price * 0.95},
                {"min": 500, "max": 999, "price": p.price * 0.90},
                {"min": 1000, "max": None, "price": p.price * 0.85}
            ])
            db.session.commit()
            print(f"Updated product {p.id} with advanced AI metadata.")

if __name__ == "__main__":
    seed_advanced()
