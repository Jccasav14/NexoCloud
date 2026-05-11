from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.all_models import User
from app.routers.deps import require_role
from app.schemas.user_schema import UserResponse
from app.schemas.file_schema import FileResponse
from app.schemas.event_schema import EventResponse
from app.controllers.files_controller import get_all_files, get_file_by_id, delete_file_record
from app.controllers.event_controller import get_all_events, create_event

router = APIRouter(prefix="/api/admin", tags=["Administracion"])

admin_dep = require_role(["Administrador"])


@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dep),
):
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dep),
):
    user = db.query(User).filter(User.id_usuario == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.put("/users/{user_id}/deactivate", response_model=dict)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dep),
):
    user = db.query(User).filter(User.id_usuario == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id_usuario == current_user.id_usuario:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta")

    user.estado = "inactivo"
    db.commit()

    create_event(
        db, current_user.id_usuario,
        "DESACTIVACION_USUARIO",
        f"El administrador desactivo al usuario: {user.nombre} (ID: {user.id_usuario})"
    )

    return {"message": f"Usuario '{user.nombre}' desactivado exitosamente"}


@router.put("/users/{user_id}/activate", response_model=dict)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dep),
):
    user = db.query(User).filter(User.id_usuario == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.estado = "activo"
    db.commit()

    create_event(
        db, current_user.id_usuario,
        "ACTIVACION_USUARIO",
        f"El administrador activo al usuario: {user.nombre} (ID: {user.id_usuario})"
    )

    return {"message": f"Usuario '{user.nombre}' activado exitosamente"}


@router.put("/users/{user_id}/role/{role_id}", response_model=dict)
def change_user_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dep),
):
    user = db.query(User).filter(User.id_usuario == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    old_role = user.id_rol
    user.id_rol = role_id
    db.commit()

    create_event(
        db, current_user.id_usuario,
        "CAMBIO_ROL",
        f"El administrador cambio el rol del usuario {user.nombre} de {old_role} a {role_id}"
    )

    return {"message": f"Rol del usuario '{user.nombre}' actualizado exitosamente"}


@router.get("/files", response_model=List[FileResponse])
def list_all_files(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dep),
):
    files = get_all_files(db, skip, limit)
    result = []
    for f in files:
        result.append(FileResponse(
            id_archivo=f.id_archivo,
            id_usuario=f.id_usuario,
            nombre_archivo=f.nombre_archivo,
            tipo_archivo=f.tipo_archivo,
            tamano=f.tamano,
            ruta_s3=f.ruta_s3,
            fecha_subida=f.fecha_subida,
            nombre_usuario=f.usuario.nombre if f.usuario else None,
        ))
    return result


@router.delete("/files/{file_id}", response_model=dict)
def admin_delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dep),
):
    db_file = get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    filename = db_file.nombre_archivo
    owner_id = db_file.id_usuario
    delete_file_record(db, db_file)

    create_event(
        db, current_user.id_usuario,
        "ADMIN_ELIMINACION_ARCHIVO",
        f"El administrador elimino el archivo: {filename} (del usuario ID: {owner_id})"
    )

    return {"message": f"Archivo '{filename}' eliminado exitosamente"}


@router.get("/events", response_model=List[EventResponse])
def list_all_events(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_dep),
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
