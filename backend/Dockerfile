# =============================================================================
# Backend — Multi-stage Dockerfile
# =============================================================================
# Stage 1 (builder): install all Python dependencies into a user-local prefix.
# Stage 2 (runtime): copy only what is needed to run; no build tools or tests.
# =============================================================================

# ---- builder ----------------------------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /build

# Install wheels for packages that need compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install production deps only (exclude test packages) into /install
RUN pip install --no-cache-dir --prefix=/install \
    $(grep -vE '^\s*(pytest|pytest-asyncio|httpx)\b' requirements.txt | grep -v '^\s*#' | grep -v '^\s*$')


# ---- runtime ----------------------------------------------------------------
FROM python:3.11-slim AS runtime

WORKDIR /app

# curl is needed for the HEALTHCHECK
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user before copying anything
RUN useradd --create-home --shell /bin/bash --uid 1001 app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source, owned by app user from the start
COPY --chown=app:app . .

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=25s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Two workers gives basic parallelism without over-complicating the setup.
# Increase WEB_CONCURRENCY env var for higher-traffic deployments.
CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]
