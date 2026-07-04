from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models.all_models import User, File, Event, Role
from app.routers.deps import get_current_active_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=Dict[str, Any])
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    role_id = current_user.id_rol
    
    # 1. ADMIN DASHBOARD
    if role_id == 1:
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.estado == "activo").count()
        total_files = db.query(File).count()
        total_storage = db.query(func.sum(File.tamano)).scalar() or 0
        
        # Recent events with usernames
        recent_events = []
        db_events = db.query(Event).order_by(Event.fecha_evento.desc()).limit(5).all()
        for e in db_events:
            recent_events.append({
                "id_evento": e.id_evento,
                "tipo_evento": e.tipo_evento,
                "descripcion": e.descripcion,
                "fecha_evento": e.fecha_evento.isoformat(),
                "nombre_usuario": e.usuario.nombre if e.usuario else "Sistema"
            })
            
        # Recent files with usernames
        recent_files = []
        db_files = db.query(File).order_by(File.fecha_subida.desc()).limit(5).all()
        for f in db_files:
            recent_files.append({
                "id_archivo": f.id_archivo,
                "nombre_archivo": f.nombre_archivo,
                "tipo_archivo": f.tipo_archivo,
                "tamano": f.tamano,
                "fecha_subida": f.fecha_subida.isoformat(),
                "nombre_usuario": f.usuario.nombre if f.usuario else "Desconocido"
            })
            
        # Events breakdown
        event_types = db.query(Event.tipo_evento, func.count(Event.id_evento)).group_by(Event.tipo_evento).all()
        events_breakdown = {tipo: count for tipo, count in event_types}
        
        return {
            "role": "admin",
            "stats": {
                "total_users": total_users,
                "active_users": active_users,
                "total_files": total_files,
                "total_storage": total_storage
            },
            "recent_events": recent_events,
            "recent_files": recent_files,
            "events_breakdown": events_breakdown
        }
        
    # 2. BUSINESS USER DASHBOARD
    elif role_id == 2:
        user_files_count = db.query(File).filter(File.id_usuario == current_user.id_usuario).count()
        user_storage = db.query(func.sum(File.tamano)).filter(File.id_usuario == current_user.id_usuario).scalar() or 0
        storage_limit = 10737418240  # 10 GB default
        
        # Recent activity (events for this user)
        recent_events = []
        db_events = db.query(Event).filter(Event.id_usuario == current_user.id_usuario).order_by(Event.fecha_evento.desc()).limit(5).all()
        for e in db_events:
            recent_events.append({
                "id_evento": e.id_evento,
                "tipo_evento": e.tipo_evento,
                "descripcion": e.descripcion,
                "fecha_evento": e.fecha_evento.isoformat(),
                "nombre_usuario": current_user.nombre
            })
            
        # Recent uploads
        recent_files = []
        db_files = db.query(File).filter(File.id_usuario == current_user.id_usuario).order_by(File.fecha_subida.desc()).limit(5).all()
        for f in db_files:
            recent_files.append({
                "id_archivo": f.id_archivo,
                "nombre_archivo": f.nombre_archivo,
                "tipo_archivo": f.tipo_archivo,
                "tamano": f.tamano,
                "fecha_subida": f.fecha_subida.isoformat()
            })
            
        # File types breakdown
        user_files = db.query(File).filter(File.id_usuario == current_user.id_usuario).all()
        types_breakdown = {}
        for f in user_files:
            ext = f.tipo_archivo or "DESCONOCIDO"
            ext_clean = ext.split('/')[-1].upper() if '/' in ext else ext.upper()
            if len(ext_clean) > 8:
                ext_clean = ext_clean[:8]
            types_breakdown[ext_clean] = types_breakdown.get(ext_clean, 0) + 1
            
        return {
            "role": "user",
            "stats": {
                "total_files": user_files_count,
                "total_storage": user_storage,
                "storage_limit": storage_limit
            },
            "recent_events": recent_events,
            "recent_files": recent_files,
            "types_breakdown": types_breakdown
        }
        
    # 3. AUDITOR DASHBOARD
    elif role_id == 3:
        total_events = db.query(Event).count()
        unique_active_users = db.query(func.count(Event.id_usuario.distinct())).scalar() or 0
        
        # Get count of actions by category
        event_types = db.query(Event.tipo_evento, func.count(Event.id_evento)).group_by(Event.tipo_evento).all()
        events_breakdown = {tipo: count for tipo, count in event_types}
        
        # Recent events with usernames
        recent_events = []
        db_events = db.query(Event).order_by(Event.fecha_evento.desc()).limit(8).all()
        for e in db_events:
            recent_events.append({
                "id_evento": e.id_evento,
                "tipo_evento": e.tipo_evento,
                "descripcion": e.descripcion,
                "fecha_evento": e.fecha_evento.isoformat(),
                "nombre_usuario": e.usuario.nombre if e.usuario else "Sistema"
            })
            
        return {
            "role": "auditor",
            "stats": {
                "total_events": total_events,
                "unique_users": unique_active_users
            },
            "recent_events": recent_events,
            "events_breakdown": events_breakdown
        }
        
    else:
        return {"error": "Rol no reconocido"}
