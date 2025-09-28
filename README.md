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

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd scheduler-app
```

2. Start all services:
```bash
docker-compose up -d
```

3. Seed the database with initial data:
```bash
docker-compose exec api python seed_data.py
```

4. Access the application:
- Web UI: http://localhost:3001
- API Documentation: http://localhost:8001/docs
- Proxy (optional): http://localhost:8081

### Default Credentials

- **Admin**: username=`admin`, password=`admin`
- **Editor**: username=`editor`, password=`editor`

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

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://scheduler_user:scheduler_password@localhost:5433/scheduler_db
REDIS_URL=redis://localhost:6380
JWT_SECRET_KEY=your-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Production Deployment

1. Update the Caddyfile with your domain name
2. Set strong JWT_SECRET_KEY in environment variables
3. Configure proper CORS origins
4. Use Docker Compose with production settings
5. Set up SSL certificates (automatic with Caddy)

## License

This project is licensed under the MIT License.