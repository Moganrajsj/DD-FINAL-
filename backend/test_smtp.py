import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

# Load .env file
load_dotenv('.env')

MAIL_SERVER = os.getenv("MAIL_SERVER")
MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

print(f"Testing SMTP for: {MAIL_USERNAME}")
print(f"Server: {MAIL_SERVER}:{MAIL_PORT}")

msg = EmailMessage()
msg.set_content("This is a test email to verify SMTP settings for DealsDoubled.in.")
msg["Subject"] = "SMTP Test Connection"
msg["From"] = MAIL_USERNAME
msg["To"] = MAIL_USERNAME

try:
    print("Connecting to server...")
    with smtplib.SMTP(MAIL_SERVER, MAIL_PORT) as server:
        server.starttls()
        print("Logging in...")
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        print("Sending message...")
        server.send_message(msg)
    print("SUCCESS: SMTP connection and login successful!")
except Exception as e:
    print(f"FAILED: {str(e)}")
