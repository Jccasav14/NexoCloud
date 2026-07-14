from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.all_models import User
from app.routers.deps import require_role
from app.schemas.event_schema import EventResponse
from app.controllers.event_controller import get_all_events

router = APIRouter(prefix="/api/audit", tags=["Auditoria"])

auditor_dep = require_role(["Administrador", "Supervisor/Auditor", "Auditor"])


@router.get("/events", response_model=List[EventResponse])
def list_audit_events(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(auditor_dep),
):
    events = get_all_events(db, skip, limit)
    result = []
    for e in events:
        result.append(EventResponse(
            id_evento=e.id_evento,
            id_usuario=e.id_usuario,
            tipo_evento=e.tipo_evento,
            descripcion=e.descripcion,
            fecha_evento=e.fecha_evento,
            nombre_usuario=e.usuario.nombre if e.usuario else None,
        ))
    return result
