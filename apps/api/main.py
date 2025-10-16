"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import health, followups, ai, sequences, analytics, connections
from app.routes import settings as settings_router

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix=settings.API_V1_PREFIX, tags=["health"])
app.include_router(connections.router, prefix=settings.API_V1_PREFIX, tags=["connections"])
app.include_router(followups.router, prefix=settings.API_V1_PREFIX, tags=["followups"])
app.include_router(ai.router, prefix=settings.API_V1_PREFIX, tags=["ai"])
app.include_router(sequences.router, prefix=settings.API_V1_PREFIX, tags=["sequences"])
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX, tags=["analytics"])
app.include_router(settings_router.router, prefix=settings.API_V1_PREFIX, tags=["settings"])

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Project Loom API",
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_PREFIX}/docs"
    }
