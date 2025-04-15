FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    unixodbc \
    unixodbc-dev \
    gcc \
    g++ \
    libpq-dev \
    curl \
    gnupg \
    wget \
    && wget https://packages.microsoft.com/debian/12/prod/pool/main/m/msodbcsql18/msodbcsql18_18.3.2.1-1_amd64.deb \ 
    && dpkg -i msodbcsql18_18.3.2.1-1_amd64.deb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
