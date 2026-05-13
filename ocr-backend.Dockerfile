FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PINDOU_DEPLOYMENT_MODE=api_only \
    PINDOU_OCR_ENGINE=rapidocr \
    PINDOU_CACHE_DIR=/var/data/pindou-cache \
    PINDOU_STATE_FILE=/var/data/pindou-persist-state.json \
    PINDOU_OCR_MAX_EDGE=2000 \
    PINDOU_OCR_MAX_PIXELS=3500000 \
    PINDOU_OCR_LAYOUT_MAX_EDGE=800

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libxcb1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements-ocr.txt ./
RUN pip install --upgrade pip && pip install -r requirements-ocr.txt

COPY . .

CMD ["sh", "-c", "uvicorn pindou_server:app --host 0.0.0.0 --port ${PORT:-10000}"]
