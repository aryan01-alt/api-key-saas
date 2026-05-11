from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, projects, keys, validate, analytics, notifications, members

app = FastAPI(
    title="API Key Management SaaS",
    description="Generate, manage, and rate-limit API keys",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(keys.router)
app.include_router(validate.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(members.router)

@app.get("/health")
def health():
    return {"status": "ok"}