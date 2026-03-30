FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PyMySQL/Cryptography
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Fly.io uses 8080 by default
EXPOSE 8080

# Run with eventlet worker for Socket.IO support
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:8080", "app:app"]
