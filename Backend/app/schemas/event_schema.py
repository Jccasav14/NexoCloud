from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EventResponse(BaseModel):
    id_evento: int
    id_usuario: int
    tipo_evento: str
    descripcion: str
    fecha_evento: datetime
    nombre_usuario: Optional[str] = None

    class Config:
        from_attributes = True
