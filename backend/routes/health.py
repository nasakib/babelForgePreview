from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["health"])

@router.get("/health")
def health_check():
    """Liveness probe used by Navbar indicators and status panels."""
    return {"status": "healthy"}
