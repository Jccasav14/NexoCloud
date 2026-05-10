from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routers import auth
from app.seed import init_db

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

# Poblar roles iniciales y admin
db = SessionLocal()
try:
    init_db(db)
finally:
    db.close()

app = FastAPI(title="NexoCloud API", description="API para la plataforma empresarial NexoCloud")

# Configurar CORS para permitir comunicación con el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Para producción se debe limitar a los dominios del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar Routers
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to NexoCloud API"}
