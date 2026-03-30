import random
from app import app, db, Company, Product, Category

def seed_premium():
    with app.app_context():
        print("Scaffolding Premium & AI Data...")
        
        # 1. Elevate some companies to Premium Tiers
        companies = Company.query.all()
        if not companies:
            print("No companies found to elevate.")
            return
            
        premium_tiers = ["GOLD", "PLATINUM"]
        for i in range(min(15, len(companies))):
            company = companies[i]
            company.membership_tier = random.choice(premium_tiers)
            company.priority_score = random.randint(80, 100)
            company.verified = True
            print(f"Elevated {company.name} to {company.membership_tier}")
        
        # 2. Add tags and priority to products of premium companies
        products = Product.query.all()
        categories = Category.query.all()
        cat_map = {c.id: c.name for c in categories}
        
        for p in products:
            # If company is premium, mark product as priority
            if p.company and p.company.membership_tier in premium_tiers:
                p.is_priority = True
            
            # Generate smart tags based on name and category
            tags = [cat_map.get(p.category_id, "Industrial").lower()]
            name_parts = p.name.lower().split()
            if len(name_parts) > 0:
                tags.append(name_parts[0])
            if len(name_parts) > 1:
                tags.append(name_parts[1])
                
            p.tags = ",".join(list(set(tags)))
            
            # Add a placeholder AI description if empty
            if not p.ai_description:
                p.ai_description = f"AI Analysis: This {p.name} is a high-performance solution in the {cat_map.get(p.category_id, 'Industrial')} sector. Ideal for bulk B2B procurement."

        db.session.commit()
        print("\n✓ Seeded Premium & AI data successfully!")

if __name__ == "__main__":
    seed_premium()
