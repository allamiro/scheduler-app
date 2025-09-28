from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import redis
from datetime import datetime

from database import engine, get_db
from models import Base
from auth import get_current_user, User
from routers import auth, users, doctors, schedules, published
from config import settings

# Initialize Redis
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    redis_client.close()

app = FastAPI(
    title="Duty Scheduler API",
    description="API for managing radiology duty rosters",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(doctors.router, prefix="/api/doctors", tags=["doctors"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["schedules"])
app.include_router(published.router, prefix="/api/published", tags=["published"])

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        db = next(get_db())
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        
        # Check Redis connection
        redis_client.ping()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": "connected",
                "redis": "connected"
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}"
        )

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(doctors.router, prefix="/api/doctors", tags=["doctors"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["schedules"])
app.include_router(published.router, prefix="/api/published", tags=["published"])

@app.get("/")
async def root():
    return {"message": "Duty Scheduler API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
