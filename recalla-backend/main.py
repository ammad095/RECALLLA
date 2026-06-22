from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.meetings import router as meetings_router

app = FastAPI(
    title="Recalla Backend",
    description="AI-powered meeting memory assistant API",
    version="1.0.0"
)

# Allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(meetings_router, prefix="/api/meetings", tags=["Meetings"])

@app.get("/")
def root():
    return {"message": "Recalla API is running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}