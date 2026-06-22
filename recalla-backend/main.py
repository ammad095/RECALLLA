from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.meetings import router as meetings_router

app = FastAPI(
    title="Recalla Backend",
    description="AI-powered meeting memory assistant API",
    version="1.0.0"
)

# ── CORS — allow React frontend ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(meetings_router, prefix="/api/meetings", tags=["Meetings"])

@app.get("/")
def root():
    return {"message": "Recalla API is running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}

# ── Standalone runner ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("\nStarting Recalla backend on http://localhost:8001")
    print("API docs available at http://localhost:8001/docs\n")
    uvicorn.run(app, host="127.0.0.1", port=8001)