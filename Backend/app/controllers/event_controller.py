from sqlalchemy.orm import Session
from app.models.all_models import Event


def create_event(db: Session, user_id: int, tipo: str, descripcion: str):
    evento = Event(
        id_usuario=user_id,
        tipo_evento=tipo,
        descripcion=descripcion
    )
    db.add(evento)
    db.commit()
    db.refresh(evento)
    return evento


def get_events_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 50):
    return (
        db.query(Event)
        .filter(Event.id_usuario == user_id)
        .order_by(Event.fecha_evento.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_all_events(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Event)
        .order_by(Event.fecha_evento.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
