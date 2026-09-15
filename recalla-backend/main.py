from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.meetings import router as meetings_router
from routes.agent   import router as agent_router
from routes.auth    import router as auth_router
from routes.data    import router as data_router
from routes.connectors import router as connectors_router
from routes.chats   import router as chats_router
from routes.whatsapp import router as whatsapp_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run the reminder scheduler for as long as the server is up."""
    from models.scheduler import start, stop

    start()

    # Load the embedding model in the background. It takes a few seconds, and
    # paying that on a user's first question — right after they record their
    # first meeting — is exactly the wrong moment.
    import threading

    def _warm():
        try:
            from models.embeddings import get_model
            get_model()
        except Exception as e:
            print(f"[Recalla] Embedding warm-up skipped: {e}")

    threading.Thread(target=_warm, daemon=True).start()
    try:
        yield
    finally:
        stop()


app = FastAPI(
    lifespan=lifespan,
    title="Recalla Backend",
    description="AI-powered meeting memory assistant API",
    version="1.1.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────────────────
app.include_router(auth_router,     prefix="/api/auth",     tags=["Auth"])
app.include_router(data_router,     prefix="/api/data",     tags=["Data"])
app.include_router(connectors_router, prefix="/api/connectors", tags=["Connectors"])
app.include_router(meetings_router, prefix="/api/meetings", tags=["Meetings"])
app.include_router(agent_router,    prefix="/api/agent",    tags=["Agent"])
app.include_router(chats_router,    prefix="/api/chats",    tags=["Chats"])
app.include_router(whatsapp_router, prefix="/api/whatsapp", tags=["WhatsApp"])

@app.get("/")
def root():
    return {"message": "Recalla API is running", "version": "1.1.0"}

@app.get("/health")
def health():
    from db.session import db_healthy
    return {"status": "ok", "database": "up" if db_healthy() else "down"}


if __name__ == "__main__":
    import uvicorn
    print("\nStarting Recalla backend on http://localhost:8001")
    print("API docs at http://localhost:8001/docs\n")
    uvicorn.run(app, host="0.0.0.0", port=8001)