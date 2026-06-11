from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.health import router as health_router
from routes.topology import router as topology_router
from routes.pharma import router as pharma_router
from routes.chat import router as chat_router
from routes.simulate import router as simulate_router
from routes.fmri import router as fmri_router

app = FastAPI(
    title="babelForge API",
    description="Modularized Computational Neuroscience and Holographic Topology Engine API"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router)
app.include_router(topology_router)
app.include_router(pharma_router)
app.include_router(chat_router)
app.include_router(simulate_router)
app.include_router(fmri_router)
