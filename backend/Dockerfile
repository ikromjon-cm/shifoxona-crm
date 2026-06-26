FROM python:3.12-slim AS builder

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-user --prefix=/install -r requirements.txt


FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev curl && rm -rf /var/lib/apt/lists/* && \
    addgroup --system django && adduser --system --ingroup django django

COPY --from=builder /install /usr/local

COPY --chown=django:django . .

RUN mkdir -p logs media staticfiles && \
    chmod +x entrypoint.sh wait-for-it.sh

USER django
EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
