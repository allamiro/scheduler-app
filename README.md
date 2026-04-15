# Duty Scheduler

A web application for managing radiology duty rosters. Drag doctors from the sidebar into weekly schedule grids, enforce per-slot capacity limits, prevent double-booking, and publish immutable read-only snapshots with unique URLs.

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Quick Start (Local)](#quick-start-local)
4. [Environment Variables](#environment-variables)
5. [Production Deployment](#production-deployment)
6. [Service Reference](#service-reference)
7. [Database Operations](#database-operations)
8. [Useful Commands](#useful-commands)
9. [Troubleshooting](#troubleshooting)

---

## Features

- **Drag-and-drop scheduling** — assign doctors to slots with `@dnd-kit`
- **Capacity enforcement** — each assignment type has a configurable maximum
- **Conflict prevention** — blocks double-booking on the same date
- **Published schedules** — immutable, printable snapshots with unique public URLs
- **Role-based access** — Admin, Editor, and Viewer roles
- **Ethiopian holidays** — public holiday awareness in the weekly sidebar
- **Responsive layout** — works on mobile, tablet, and wide-screen displays

---

## Architecture

```
Browser
  │
  ▼
Caddy (proxy)          :8081 HTTP / :8444 HTTPS
  ├─▶ /api/*  ──────▶  FastAPI (api)       :8001 (also directly reachable)
  └─▶ /*      ──────▶  Next.js  (web)      :3001 (also directly reachable)
                           │
                     backend network
                       ├─▶ PostgreSQL (db)    internal only
                       └─▶ Redis     (cache)  internal only
```

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, SQLAlchemy 2, Pydantic v2, Alembic |
| Database | PostgreSQL 15 |
| Cache / sessions | Redis 7 |
| Proxy / TLS | Caddy 2 (automatic Let's Encrypt in production) |
| Container runtime | Docker Compose |

**Network isolation**: PostgreSQL and Redis are on a private `backend` network and are **not** exposed to the host. Only the API, frontend, and proxy ports are reachable from outside Docker.

---

## Quick Start (Local)

### Prerequisites

- Docker Engine 24+ and Docker Compose (v2 plugin or standalone v1.29+)
- Ports `3001`, `8001`, `8081`, and `8444` free on your machine

### 1. Clone

```bash
git clone <repository-url>
cd scheduler-app
```

### 2. Create your environment file

```bash
cp .env.example .env
```

The default values in `.env.example` are safe for local development and match what the running containers expect. **Do not commit `.env` to version control.**

### 3. Start all services

```bash
docker-compose up -d
```

Compose will:
- Build the backend (multi-stage, test deps excluded from image)
- Build the frontend (multi-stage Next.js standalone, ~3× smaller image)
- Wait for each service to pass its health check before starting dependents
- Automatically provision a default admin account and seed capacity rows on first startup

### 4. Verify everything is healthy

```bash
docker-compose ps
```

All five services (`db`, `cache`, `api`, `web`, `proxy`) should show **healthy**.

```bash
curl http://localhost:8001/health
# {"status":"healthy","services":{"database":"connected","redis":"connected"}}
```

### 5. Open the app

| URL | What it is |
|---|---|
| http://localhost:3001 | Frontend (direct) |
| http://localhost:8001/docs | FastAPI Swagger UI |
| http://localhost:8081 | Everything through the Caddy proxy |

### Default login

| Username | Password | Role |
|---|---|---|
| `admin` | `admin` | Admin |

> Change the password immediately after first login using the **Change Password** button in the top bar.

> There is no longer a need to run `seed_data.py` manually. The API seeds capacity rows and creates the default admin automatically at startup.

---

## Environment Variables

All configuration lives in a single `.env` file in the project root. Use `.env.example` as the authoritative template.

### Full variable reference

| Variable | Description | Default | Required |
|---|---|---|---|
| `POSTGRES_DB` | Database name | `scheduler_db` | Yes |
| `POSTGRES_USER` | Database user | `scheduler_user` | Yes |
| `POSTGRES_PASSWORD` | Database password | — | **Yes** |
| `REDIS_PASSWORD` | Redis auth password (blank = no auth) | `` | No |
| `JWT_SECRET_KEY` | Secret used to sign JWT tokens | — | **Yes** |
| `DEFAULT_ADMIN_USERNAME` | Username for the bootstrap admin account | `admin` | Yes |
| `DEFAULT_ADMIN_PASSWORD` | Password for the bootstrap admin account | — | **Yes** |
| `DEFAULT_ADMIN_EMAIL` | Email for the bootstrap admin account | `admin@scheduler.local` | No |
| `CORS_ORIGINS` | Comma-separated list of allowed browser origins | `http://localhost:3001,...` | Yes |
| `NEXT_PUBLIC_API_URL` | API base URL as seen **by the browser** | `http://localhost:8001` | Yes |
| `HTTP_PORT` | Host port the proxy listens on for HTTP | `8081` | No |
| `HTTPS_PORT` | Host port the proxy listens on for HTTPS | `8444` | No |

### Generating secrets

```bash
# JWT secret
python3 -c "import secrets; print(secrets.token_hex(32))"

# Strong password
openssl rand -base64 20
```

---

## Production Deployment

### Server requirements

- Ubuntu 22.04 LTS (or equivalent)
- Docker Engine + Docker Compose installed
- A domain name with an A record pointing to the server
- Ports **80** and **443** open (for Caddy + Let's Encrypt)
- 2 GB RAM minimum, 4 GB recommended

### Step 1 — Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Log out and back in, then verify:
docker info
```

### Step 2 — Clone and configure

```bash
git clone <repository-url>
cd scheduler-app
cp .env.example .env
```

Edit `.env` with production values:

```env
POSTGRES_DB=scheduler_db
POSTGRES_USER=scheduler_user
POSTGRES_PASSWORD=<strong-random-password>

REDIS_PASSWORD=<strong-random-password>

JWT_SECRET_KEY=<output-of-python3 -c "import secrets; print(secrets.token_hex(32))">

DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=<strong-password>
DEFAULT_ADMIN_EMAIL=admin@your-domain.com

CORS_ORIGINS=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com

HTTP_PORT=80
HTTPS_PORT=443
```

> `NEXT_PUBLIC_API_URL` is baked into the JavaScript bundle at image build time. If you change this value you must rebuild the `web` image (`docker-compose build web`).

### Step 3 — Configure the Caddy reverse proxy

Edit `Caddyfile` and replace the `localhost` block with your domain. A commented production template is included at the bottom of the file:

```caddy
your-domain.com {

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options  "nosniff"
        X-Frame-Options         "SAMEORIGIN"
        Referrer-Policy         "strict-origin-when-cross-origin"
        -Server
    }

    handle /api/* {
        reverse_proxy api:8000 {
            header_up X-Real-IP        {remote_host}
            header_up X-Forwarded-For  {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    handle /* {
        reverse_proxy web:3000 {
            header_up X-Real-IP        {remote_host}
            header_up X-Forwarded-For  {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }
}
```

Caddy automatically obtains and renews a Let's Encrypt TLS certificate — no additional configuration needed.

### Step 4 — Build and start

```bash
docker-compose build
docker-compose up -d
```

### Step 5 — Verify

```bash
docker-compose ps          # all services should show "healthy"
curl https://your-domain.com/api/health
```

### Step 6 — Change the default admin password

Log in at `https://your-domain.com` and use **Change Password** immediately.

### Production security checklist

- [ ] All passwords in `.env` are strong, randomly generated values
- [ ] `.env` is not committed to version control (`.gitignore` covers it)
- [ ] `JWT_SECRET_KEY` is at least 32 random bytes
- [ ] `CORS_ORIGINS` contains only your real domain(s)
- [ ] Default admin password changed after first login
- [ ] Server firewall allows only ports 80, 443, and 22 (SSH)
- [ ] Automatic security updates enabled on the host OS

---

## Service Reference

### Ports exposed to the host

| Service | Host port | Container port | Notes |
|---|---|---|---|
| `api` | 8001 | 8000 | Direct API access; also reachable via proxy at `/api/*` |
| `web` | 3001 | 3000 | Direct frontend access |
| `proxy` | 8081 / 8444 | 80 / 443 | Primary entry point (HTTP / HTTPS) |

PostgreSQL and Redis are **not** exposed to the host. Reach them from inside the containers only (see [Database Operations](#database-operations)).

### Image details

| Service | Base image | Notes |
|---|---|---|
| `api` | `python:3.11-slim` | Multi-stage; test deps (`pytest`, `httpx`) excluded from runtime image |
| `web` | `node:18-alpine` | Multi-stage Next.js standalone; only `server.js` + static assets in final image |
| `db` | `postgres:15-alpine` | Data persisted in `postgres_data` volume |
| `cache` | `redis:7-alpine` | Data persisted in `redis_data` volume; 128 MB memory cap, LRU eviction |
| `proxy` | `caddy:2-alpine` | TLS state persisted in `caddy_data` / `caddy_config` volumes |

### Resource limits (per service)

| Service | Memory limit |
|---|---|
| `db` | 512 MB |
| `cache` | 256 MB |
| `api` | 512 MB |
| `web` | 512 MB |
| `proxy` | 128 MB |

---

## Database Operations

### Connect to the database

```bash
docker-compose exec db psql -U scheduler_user -d scheduler_db
```

### Run Alembic migrations

```bash
# Apply all pending migrations
docker-compose exec api alembic upgrade head

# Generate a new migration after changing models
docker-compose exec api alembic revision --autogenerate -m "describe your change"
```

### Backup

```bash
# Create a timestamped SQL dump
docker-compose exec -T db pg_dump -U scheduler_user scheduler_db \
  > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore

```bash
docker-compose exec -T db psql -U scheduler_user scheduler_db < backup_file.sql
```

### Automated daily backup (cron)

```bash
# /usr/local/bin/scheduler-backup.sh
#!/bin/bash
set -e
BACKUP_DIR="/var/backups/scheduler"
mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/scheduler_$(date +%Y%m%d_%H%M%S).sql.gz"

cd /path/to/scheduler-app
docker-compose exec -T db pg_dump -U scheduler_user scheduler_db | gzip > "$FILE"

# Keep 30 days of backups
find "$BACKUP_DIR" -name "scheduler_*.sql.gz" -mtime +30 -delete
echo "Backup saved: $FILE"
```

```bash
chmod +x /usr/local/bin/scheduler-backup.sh

# Add to crontab — daily at 02:00
echo "0 2 * * * root /usr/local/bin/scheduler-backup.sh" \
  | sudo tee /etc/cron.d/scheduler-backup
```

---

## Useful Commands

### Day-to-day

```bash
# Check status of all services
docker-compose ps

# Follow logs (all services)
docker-compose logs -f

# Follow logs (single service)
docker-compose logs -f api

# Restart a single service
docker-compose restart api

# Open a shell in the API container
docker-compose exec api bash
```

### Building and updating

```bash
# Rebuild all images and restart
docker-compose up -d --build

# Rebuild a single image
docker-compose build --no-cache api
docker-compose up -d api

# Pull updated base images before rebuilding
docker-compose pull
docker-compose build
docker-compose up -d
```

### Stopping and cleaning up

```bash
# Stop all containers (data preserved)
docker-compose down

# Stop and remove volumes — WARNING: deletes all data
docker-compose down -v

# Remove unused Docker artefacts (images, build cache)
docker system prune -a
```

### Monitoring

```bash
# Live CPU / memory / network stats for all containers
docker stats

# Check disk usage by Docker
docker system df

# Check database connection count
docker-compose exec db psql -U scheduler_user -d scheduler_db \
  -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Check table sizes
docker-compose exec db psql -U scheduler_user -d scheduler_db -c "
SELECT tablename,
       pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS size
FROM   pg_tables
WHERE  schemaname = 'public'
ORDER  BY pg_total_relation_size('public.' || tablename) DESC;"
```

---

## Troubleshooting

### A service shows "unhealthy"

```bash
# See exactly what the health check returns
docker inspect scheduler-app-api-1 --format='{{json .State.Health.Log}}' | python3 -m json.tool

# Show the last 50 log lines for that service
docker-compose logs --tail=50 api
```

### API cannot connect to the database

```bash
# Confirm PostgreSQL is accepting connections
docker-compose exec db pg_isready -U scheduler_user -d scheduler_db

# Confirm the API can reach it
docker-compose exec api python3 -c "
from database import engine
from sqlalchemy import text
with engine.connect() as c:
    c.execute(text('SELECT 1'))
    print('OK')
"
```

### Frontend shows a blank page or 404 on reload

This usually means requests are going through the proxy but Caddy's routing is misconfigured. Check that your `Caddyfile` uses `handle /*` (not `handle /`) for the frontend — the trailing `/*` is required so that all Next.js client-side routes are proxied, not just the root path.

### Port already in use

```bash
# Find what is holding the port (example: 8001)
lsof -i :8001          # macOS / Linux
netstat -ano | findstr 8001   # Windows
```

Then either stop that process or change the host port in `.env` (`HTTP_PORT`, `HTTPS_PORT`) or in `docker-compose.yml`.

### Let's Encrypt certificate not issuing

- Confirm your domain's A record resolves to the server IP (`dig your-domain.com`)
- Confirm ports 80 and 443 are open in your firewall
- Check Caddy logs: `docker-compose logs proxy`
- Caddy retries automatically; wait ~60 seconds after fixing DNS/firewall

### Reset everything and start fresh

```bash
docker-compose down -v          # removes containers + volumes (all data lost)
docker-compose up -d            # rebuild and restart
```

---

## License

MIT
