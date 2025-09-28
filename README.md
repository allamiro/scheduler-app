# Duty Scheduler

A responsive web application for managing radiology duty rosters with drag-and-drop scheduling, capacity constraints, and public publishing capabilities.

## Features

- **Drag-and-Drop Scheduling**: Assign doctors to duty slots with intuitive drag-and-drop interface
- **Capacity Management**: Enforce capacity constraints for each assignment type
- **Conflict Prevention**: Prevent double-booking of doctors on the same date
- **Public Publishing**: Generate immutable, printable schedule snapshots with unique URLs
- **Role-Based Access**: Admin and Editor roles with appropriate permissions
- **Responsive Design**: Works on desktop and mobile devices
- **Print-Friendly**: Published schedules are optimized for A4 printing

## Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, and shadcn/ui
- **Backend**: FastAPI with SQLAlchemy ORM
- **Database**: PostgreSQL with Redis for caching
- **Authentication**: JWT-based authentication
- **Deployment**: Docker Compose with all services
- **Proxy**: Caddy for automatic HTTPS and reverse proxy

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git
- At least 4GB RAM available for Docker
- Ports 3001, 8001, 8081, 5433, and 6380 available

### Development Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd scheduler-app
```

2. **Start all services:**
```bash
docker-compose up -d
```

3. **Wait for services to be healthy** (check with `docker-compose ps`)

4. **Seed the database with initial data:**
```bash
docker-compose exec api python seed_data.py
```

5. **Access the application:**
- **Web UI**: http://localhost:3001
- **API Documentation**: http://localhost:8001/docs
- **Proxy (recommended)**: http://localhost:8081

### Default Credentials

- **Admin**: username=`admin`, password=`admin`
- **Editor**: username=`editor`, password=`editor`
- **Viewer**: username=`viewer`, password=`viewer`

> **Security Note**: Change these default credentials immediately in production!

## Usage

### Creating Schedules

1. Log in with your credentials
2. Navigate to the dashboard
3. Use the week navigator to select a week
4. Drag doctors from the sidebar into the schedule grid
5. The system will validate capacity constraints and prevent double-booking

### Publishing Schedules

1. Create and populate a schedule
2. Click "Publish Schedule" button
3. Copy the generated public URL
4. Share the URL for public access to the read-only schedule

### Managing Doctors

- Add new doctors using the "Add Doctor" button
- Edit doctor information by clicking the edit icon
- Deactivate doctors by clicking the delete icon
- Search doctors using the search box

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/me` - Get current user info

### Doctors
- `GET /api/doctors` - List all doctors
- `POST /api/doctors` - Create new doctor
- `PUT /api/doctors/{id}` - Update doctor
- `DELETE /api/doctors/{id}` - Delete doctor

### Schedules
- `GET /api/schedules` - List all schedules
- `GET /api/schedules/week/{date}` - Get schedule for specific week
- `POST /api/schedules` - Create new schedule
- `POST /api/schedules/{id}/assignments` - Create assignment
- `DELETE /api/schedules/{id}/assignments/{assignment_id}` - Delete assignment

### Published Schedules
- `POST /api/published/{schedule_id}/publish` - Publish schedule
- `GET /api/published/{slug}` - Get published schedule (public)

## Development

### Running Tests

```bash
# Backend tests
docker-compose exec api pytest

# Frontend tests (if implemented)
docker-compose exec web npm test
```

### Database Migrations

```bash
# Generate migration
docker-compose exec api alembic revision --autogenerate -m "Description"

# Apply migrations
docker-compose exec api alembic upgrade head
```

## Environment Configuration

### Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the project root:

#### Development Configuration

```env
# Database Configuration
DATABASE_URL=postgresql://scheduler_user:scheduler_password@db:5432/scheduler_db

# Redis Cache Configuration  
REDIS_URL=redis://cache:6379

# JWT Authentication
JWT_SECRET_KEY=your-secret-key-change-in-production

# CORS Configuration
CORS_ORIGINS=http://localhost:3001,http://localhost:8081

# Frontend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8001

# Optional: Debug Mode
DEBUG=false
```

#### Production Configuration

```env
# Database Configuration
DATABASE_URL=postgresql://scheduler_user:STRONG_PASSWORD_HERE@db:5432/scheduler_db

# Redis Cache Configuration
REDIS_URL=redis://cache:6379

# JWT Authentication (generate strong random key)
JWT_SECRET_KEY=your-very-strong-secret-key-32-chars-minimum

# CORS Configuration (replace with your domain)
CORS_ORIGINS=https://your-domain.com

# Frontend API Configuration (replace with your domain)
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# Production Settings
DEBUG=false
LOG_LEVEL=INFO
```

### Environment Variable Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `REDIS_URL` | Redis connection string | - | Yes |
| `JWT_SECRET_KEY` | Secret key for JWT token signing | - | Yes |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | - | Yes |
| `NEXT_PUBLIC_API_URL` | Public API URL for frontend | - | Yes |
| `DEBUG` | Enable debug mode | `false` | No |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) | `INFO` | No |

### Security Considerations

#### JWT Secret Key Generation

Generate a strong JWT secret key:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Database Password

Use a strong database password:

```bash
# Generate strong password
openssl rand -base64 16
```

#### CORS Configuration

For production, restrict CORS to your domain only:

```env
# Single domain
CORS_ORIGINS=https://your-domain.com

# Multiple domains
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Development (less secure)
CORS_ORIGINS=http://localhost:3001,http://localhost:8081
```

### Docker Environment Override

You can override environment variables in `docker-compose.yml`:

```yaml
services:
  api:
    environment:
      - DATABASE_URL=postgresql://scheduler_user:scheduler_password@db:5432/scheduler_db
      - REDIS_URL=redis://cache:6379
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - CORS_ORIGINS=${CORS_ORIGINS}
      - DEBUG=${DEBUG:-false}

  web:
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
```

### Environment File Templates

Create environment-specific files:

**`.env.development`**:
```env
DATABASE_URL=postgresql://scheduler_user:scheduler_password@db:5432/scheduler_db
REDIS_URL=redis://cache:6379
JWT_SECRET_KEY=dev-secret-key-not-for-production
CORS_ORIGINS=http://localhost:3001,http://localhost:8081
NEXT_PUBLIC_API_URL=http://localhost:8001
DEBUG=true
```

**`.env.production`**:
```env
DATABASE_URL=postgresql://scheduler_user:PRODUCTION_PASSWORD@db:5432/scheduler_db
REDIS_URL=redis://cache:6379
JWT_SECRET_KEY=PRODUCTION_SECRET_KEY_32_CHARS_MINIMUM
CORS_ORIGINS=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
DEBUG=false
LOG_LEVEL=INFO
```

Load specific environment file:

```bash
# Development
cp .env.development .env
docker-compose up -d

# Production
cp .env.production .env
docker-compose up -d
```

## Deployment

### Development Deployment

The application is designed to run entirely in Docker containers for easy development setup.

#### Services Overview

- **Frontend (web)**: Next.js application on port 3001
- **Backend (api)**: FastAPI application on port 8001  
- **Database (db)**: PostgreSQL on port 5433
- **Cache (cache)**: Redis on port 6380
- **Proxy (proxy)**: Caddy reverse proxy on port 8081

#### Step-by-Step Development Setup

1. **Clone and navigate to the project:**
```bash
git clone <repository-url>
cd scheduler-app
```

2. **Start all services:**
```bash
docker-compose up -d
```

3. **Monitor service health:**
```bash
# Check all services are running
docker-compose ps

# View logs if needed
docker-compose logs -f
```

4. **Initialize the database:**
```bash
# Wait for database to be ready, then seed
docker-compose exec api python seed_data.py
```

5. **Access the application:**
- **Primary Access**: http://localhost:8081 (via Caddy proxy)
- **Direct Frontend**: http://localhost:3001
- **Direct API**: http://localhost:8001/docs

#### Development Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Rebuild services after code changes
docker-compose up -d --build

# View logs for specific service
docker-compose logs -f api
docker-compose logs -f web

# Execute commands in containers
docker-compose exec api bash
docker-compose exec web sh
```

### Production Deployment

#### Prerequisites

- Server with Docker and Docker Compose installed
- Domain name pointing to your server
- At least 2GB RAM and 10GB disk space
- Ports 80 and 443 open for HTTP/HTTPS

#### Production Setup Steps

1. **Prepare your server:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Clone and configure the application:**
```bash
git clone <repository-url>
cd scheduler-app
```

3. **Create production environment file:**
```bash
cp .env.example .env
```

4. **Edit `.env` with production values:**
```env
# Database
DATABASE_URL=postgresql://scheduler_user:STRONG_PASSWORD_HERE@db:5432/scheduler_db

# Redis
REDIS_URL=redis://cache:6379

# JWT Secret (generate a strong random string)
JWT_SECRET_KEY=your-very-strong-secret-key-here

# CORS (replace with your domain)
CORS_ORIGINS=https://your-domain.com

# Frontend API URL
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

5. **Configure Caddy for your domain:**
Edit `Caddyfile` and uncomment the production section:
```caddy
your-domain.com {
    # Frontend (Next.js)
    handle / {
        reverse_proxy web:3000
    }
    
    # API (FastAPI)
    handle /api/* {
        reverse_proxy api:8000
    }
    
    # Published schedules
    handle /p/* {
        reverse_proxy web:3000
    }
}
```

6. **Deploy the application:**
```bash
# Start all services
docker-compose up -d

# Wait for services to be healthy
docker-compose ps

# Initialize database
docker-compose exec api python seed_data.py
```

7. **Set up SSL certificates:**
Caddy automatically handles SSL certificates via Let's Encrypt. Ensure:
- Your domain points to the server
- Ports 80 and 443 are open
- No firewall blocks the ports

8. **Access your application:**
- **Production URL**: https://your-domain.com
- **API Documentation**: https://your-domain.com/api/docs

#### Production Security Checklist

- [ ] Change default admin credentials
- [ ] Use strong JWT_SECRET_KEY (32+ characters)
- [ ] Set up proper CORS origins
- [ ] Configure firewall rules
- [ ] Set up regular database backups
- [ ] Monitor application logs
- [ ] Keep Docker images updated

#### Backup and Maintenance

**Database Backup:**
```bash
# Create backup
docker-compose exec db pg_dump -U scheduler_user scheduler_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T db psql -U scheduler_user scheduler_db < backup_file.sql
```

**Application Updates:**
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Run migrations if needed
docker-compose exec api alembic upgrade head
```

## Docker Configuration

### Service Details

#### Frontend Service (`web`)
- **Base Image**: `node:18-alpine`
- **Port**: 3000 (mapped to 3001)
- **Build Context**: `./frontend`
- **Health Check**: HTTP check on port 3000
- **Dependencies**: Waits for API service to be healthy

#### Backend Service (`api`)
- **Base Image**: `python:3.11-slim`
- **Port**: 8000 (mapped to 8001)
- **Build Context**: `./backend`
- **Health Check**: HTTP check on `/health` endpoint
- **Dependencies**: Waits for database and cache services

#### Database Service (`db`)
- **Base Image**: `postgres:15`
- **Port**: 5432 (mapped to 5433)
- **Database**: `scheduler_db`
- **User**: `scheduler_user`
- **Password**: `scheduler_password`
- **Volume**: `postgres_data` for persistence

#### Cache Service (`cache`)
- **Base Image**: `redis:7-alpine`
- **Port**: 6379 (mapped to 6380)
- **Volume**: None (in-memory cache)

#### Proxy Service (`proxy`)
- **Base Image**: `caddy:2-alpine`
- **Ports**: 80 (mapped to 8081), 443 (mapped to 8444)
- **Configuration**: Uses `Caddyfile` for routing
- **Volumes**: `caddy_data` and `caddy_config` for SSL certificates

### Docker Compose Override

For development customization, create a `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  api:
    environment:
      - DEBUG=true
    volumes:
      - ./backend:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  web:
    environment:
      - NODE_ENV=development
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev
```

### Resource Requirements

**Minimum Requirements:**
- RAM: 2GB
- CPU: 1 core
- Disk: 5GB

**Recommended Requirements:**
- RAM: 4GB
- CPU: 2 cores
- Disk: 10GB

## Troubleshooting

### Common Issues

#### Services Won't Start

**Problem**: Services fail to start or show unhealthy status.

**Solutions**:
```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs api
docker-compose logs web
docker-compose logs db

# Check port conflicts
netstat -tulpn | grep -E ':(3001|8001|8081|5433|6380)'

# Restart specific service
docker-compose restart api
```

#### Database Connection Issues

**Problem**: API can't connect to database.

**Solutions**:
```bash
# Check database is running
docker-compose exec db pg_isready -U scheduler_user -d scheduler_db

# Test database connection
docker-compose exec api python -c "
from database import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text('SELECT 1'))
    print('Database connection successful')
"

# Reset database
docker-compose down
docker volume rm scheduler-app_postgres_data
docker-compose up -d
```

#### Frontend Build Failures

**Problem**: Frontend container fails to build.

**Solutions**:
```bash
# Clear npm cache
docker-compose exec web npm cache clean --force

# Rebuild without cache
docker-compose build --no-cache web

# Check Node.js version compatibility
docker-compose exec web node --version
```

#### SSL Certificate Issues

**Problem**: Caddy fails to obtain SSL certificates.

**Solutions**:
```bash
# Check domain DNS
nslookup your-domain.com

# Verify ports are open
telnet your-domain.com 80
telnet your-domain.com 443

# Check Caddy logs
docker-compose logs proxy

# Force certificate renewal
docker-compose exec proxy caddy reload --config /etc/caddy/Caddyfile
```

#### Memory Issues

**Problem**: Containers run out of memory.

**Solutions**:
```bash
# Check memory usage
docker stats

# Increase Docker memory limit
# Edit Docker Desktop settings or docker daemon config

# Optimize container resources
docker-compose down
docker system prune -a
docker-compose up -d
```

### Performance Optimization

#### Database Optimization
```bash
# Check database performance
docker-compose exec db psql -U scheduler_user -d scheduler_db -c "
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats 
WHERE schemaname = 'public';
"

# Analyze query performance
docker-compose exec db psql -U scheduler_user -d scheduler_db -c "ANALYZE;"
```

#### Application Monitoring
```bash
# Monitor container resources
docker stats

# Check application logs
docker-compose logs -f --tail=100 api

# Monitor database connections
docker-compose exec db psql -U scheduler_user -d scheduler_db -c "
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';
"
```

### Log Management

#### Viewing Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api

# With timestamps
docker-compose logs -f -t api
```

#### Log Rotation
Add to `docker-compose.yml` for production:
```yaml
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Monitoring and Maintenance

### Health Checks

The application includes built-in health checks for all services:

```bash
# Check all service health
docker-compose ps

# Check specific service health
curl http://localhost:8001/health  # API health
curl http://localhost:3001          # Frontend health
```

### Monitoring Commands

```bash
# Monitor resource usage
docker stats

# Check disk usage
docker system df

# Monitor logs in real-time
docker-compose logs -f

# Check database size
docker-compose exec db psql -U scheduler_user -d scheduler_db -c "
SELECT pg_size_pretty(pg_database_size('scheduler_db'));
"
```

### Regular Maintenance Tasks

#### Daily Tasks
- Monitor application logs for errors
- Check service health status
- Verify backup completion (if automated)

#### Weekly Tasks
- Review application performance metrics
- Check disk space usage
- Update security patches

#### Monthly Tasks
- Review and rotate logs
- Update Docker images
- Test backup restoration
- Review user access and permissions

### Backup Strategy

#### Automated Database Backup

Create a backup script (`backup.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/scheduler_backup_$DATE.sql"

# Create backup
docker-compose exec -T db pg_dump -U scheduler_user scheduler_db > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "scheduler_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

#### Setup Cron Job

```bash
# Add to crontab (daily backup at 2 AM)
0 2 * * * /path/to/backup.sh
```

### Performance Monitoring

#### Database Performance

```bash
# Check slow queries
docker-compose exec db psql -U scheduler_user -d scheduler_db -c "
SELECT query, mean_time, calls, total_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"

# Check table sizes
docker-compose exec db psql -U scheduler_user -d scheduler_db -c "
SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

#### Application Performance

```bash
# Monitor API response times
docker-compose logs api | grep -E "(GET|POST|PUT|DELETE)" | tail -20

# Check memory usage
docker-compose exec api python -c "
import psutil
print(f'Memory usage: {psutil.virtual_memory().percent}%')
print(f'CPU usage: {psutil.cpu_percent()}%')
"
```

### Security Monitoring

#### Check for Security Updates

```bash
# Update base images
docker-compose pull

# Check for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image scheduler-app_api:latest
```

#### Monitor Access Logs

```bash
# Check API access patterns
docker-compose logs api | grep -E "(GET|POST|PUT|DELETE)" | tail -50

# Monitor failed login attempts
docker-compose logs api | grep -i "login\|auth\|failed" | tail -20
```

## License

This project is licensed under the MIT License.