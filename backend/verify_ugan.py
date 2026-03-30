from app import app, db, Company, User, Product, Category

with app.app_context():
    company = Company.query.filter_by(name='UGAN foods').first()
    user = User.query.filter_by(email='uganfoodproducts@gmail.com').first()
    
    if company:
        products = Product.query.filter_by(company_id=company.id).all()
        print(f"Company Found: {company.name} (ID: {company.id})")
        print(f"Address: {company.location}")
        print(f"Phone: {company.phone}")
        print(f"Product Count: {len(products)}")
        for i, p in enumerate(products[:5]):
            print(f"  {i+1}. {p.name} ({p.category.name if p.category else 'No Category'})")
    else:
        print("Company NOT FOUND")
        
    if user:
        print(f"User Found: {user.email} (ID: {user.id})")
    else:
        print("User NOT FOUND")
