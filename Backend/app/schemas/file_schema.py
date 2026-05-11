from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FileResponse(BaseModel):
    id_archivo: int
    id_usuario: int
    nombre_archivo: str
    tipo_archivo: Optional[str] = None
    tamano: int
    ruta_s3: str
    fecha_subida: datetime
    nombre_usuario: Optional[str] = None

    class Config:
        from_attributes = True
