from app import app, db, User
import sys

def designate_manager(email):
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        if user:
            user.is_buyer_manager = True
            db.session.commit()
            print(f"SUCCESS: User {user.name} ({email}) designated as Buyer Manager.")
            return True
        else:
            print(f"ERROR: User with email {email} not found.")
            return False

if __name__ == "__main__":
    # We'll designate user 'mogan@test.com' or just any user we know
    # For now, let's try to find an admin and make them manager
    with app.app_context():
        u = User.query.filter_by(role='Admin').first()
        if not u:
             u = User.query.first()
        
        if u:
            designate_manager(u.email)
        else:
            print("No users found in database.")
