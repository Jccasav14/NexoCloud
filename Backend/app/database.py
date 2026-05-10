import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Obtener URL de conexión a la base de datos de la variable de entorno,
# con un valor por defecto para desarrollo local sin docker si es necesario.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://nexo_user:nexo_password@localhost:5432/nexocloud_db")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependencia para obtener la sesión de la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
