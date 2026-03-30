from app import db, Category, Product, app
import os

def check():
    with app.app_context():
        categories = Category.query.all()
        print(f"{'ID':<5} | {'Category Name':<30} | {'Products':<10}")
        print("-" * 50)
        for cat in categories:
            product_count = Product.query.filter_by(category_id=cat.id).count()
            print(f"{cat.id:<5} | {cat.name:<30} | {product_count:<10}")

if __name__ == "__main__":
    check()
