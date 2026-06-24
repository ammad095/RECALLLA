from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.meetings import router as meetings_router
from routes.agent   import router as agent_router

app = FastAPI(
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
app.include_router(meetings_router, prefix="/api/meetings", tags=["Meetings"])
app.include_router(agent_router,    prefix="/api/agent",    tags=["Agent"])

@app.get("/")
def root():
    return {"message": "Recalla API is running", "version": "1.1.0"}

@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    print("\nStarting Recalla backend on http://localhost:8001")
    print("API docs at http://localhost:8001/docs\n")
    uvicorn.run(app, host="0.0.0.0", port=8001)