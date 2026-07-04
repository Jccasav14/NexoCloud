from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routers import auth, files, admin, audit, dashboard
from app.seed import init_db

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    init_db(db)
finally:
    db.close()

app = FastAPI(title="NexoCloud API", description="API para la plataforma empresarial NexoCloud")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(files.router)
app.include_router(admin.router)
app.include_router(audit.router)
app.include_router(dashboard.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to NexoCloud API"}

