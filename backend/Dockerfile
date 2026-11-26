FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    ffmpeg \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

ENV WORKERS=1

CMD ["sh", "-c", "if [ $(ulimit -n) -lt 100000 ] 2>/dev/null; then ulimit -n 100000 2>/dev/null || true; fi; exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips=* --backlog 4096 --workers ${WORKERS:-1}"]
