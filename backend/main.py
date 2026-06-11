import uvicorn
from app import app

if __name__ == "__main__":
    # Standard entry point to run uvicorn server locally
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)