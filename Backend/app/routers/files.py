from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
import os

from app.database import get_db
from app.models.all_models import User, File
from app.routers.deps import get_current_active_user
from app.schemas.file_schema import FileResponse
from app.controllers.files_controller import (
    save_file_to_storage,
    create_file_record,
    get_files_by_user,
    get_file_by_id,
    delete_file_record,
)
from app.controllers.event_controller import create_event

router = APIRouter(prefix="/api/files", tags=["Archivos"])


@router.post("/upload", response_model=FileResponse)
def upload_file(
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Calculate current storage used by the user
    user_storage = db.query(func.sum(File.tamano)).filter(File.id_usuario == current_user.id_usuario).scalar() or 0
    storage_limit = 10737418240  # 10 GB in bytes

    result = save_file_to_storage(file, current_user.id_usuario)

    if user_storage + result["size"] > storage_limit:
        from app.s3_service import storage_service
        storage_service.delete_file(result["path"])
        raise HTTPException(
            status_code=400,
            detail="Límite de almacenamiento de 10 GB superado para este usuario."
        )

    db_file = create_file_record(
        db=db,
        user_id=current_user.id_usuario,
        filename=file.filename,
        content_type=result["content_type"],
        size=result["size"],
        path=result["path"],
    )

    create_event(
        db, current_user.id_usuario,
        "SUBIDA_ARCHIVO",
        f"El usuario subio el archivo: {file.filename} ({result['size']} bytes)"
    )

    return FileResponse(
        id_archivo=db_file.id_archivo,
        id_usuario=db_file.id_usuario,
        nombre_archivo=db_file.nombre_archivo,
        tipo_archivo=db_file.tipo_archivo,
        tamano=db_file.tamano,
        ruta_s3=db_file.ruta_s3,
        fecha_subida=db_file.fecha_subida,
    )


@router.get("/my-files", response_model=List[FileResponse])
def list_my_files(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    files = get_files_by_user(db, current_user.id_usuario, skip, limit)
    return [
        FileResponse(
            id_archivo=f.id_archivo,
            id_usuario=f.id_usuario,
            nombre_archivo=f.nombre_archivo,
            tipo_archivo=f.tipo_archivo,
            tamano=f.tamano,
            ruta_s3=f.ruta_s3,
            fecha_subida=f.fecha_subida,
        )
        for f in files
    ]


@router.delete("/{file_id}", response_model=dict)
def delete_my_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    db_file = get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    if db_file.id_usuario != current_user.id_usuario:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este archivo")

    filename = db_file.nombre_archivo
    delete_file_record(db, db_file)

    create_event(
        db, current_user.id_usuario,
        "ELIMINACION_ARCHIVO",
        f"El usuario elimino el archivo: {filename}"
    )

    return {"message": f"Archivo '{filename}' eliminado exitosamente"}


@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    import urllib.parse
    from fastapi.responses import StreamingResponse
    from app.s3_service import storage_service

    db_file = get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    # Access control: users can only download their own files, admins/auditors can download any file
    if db_file.id_usuario != current_user.id_usuario and current_user.id_rol not in [1, 3]:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para descargar este archivo"
        )

    file_stream, content_type, filename = storage_service.get_file_stream(db_file.ruta_s3)
    
    safe_filename = urllib.parse.quote(filename)
    headers = {
        "Content-Disposition": f"attachment; filename*=utf-8''{safe_filename}",
        "Access-Control-Expose-Headers": "Content-Disposition"
    }

    create_event(
        db, current_user.id_usuario,
        "DESCARGA_ARCHIVO",
        f"El usuario descargo el archivo: {filename}"
    )

    return StreamingResponse(file_stream, media_type=content_type, headers=headers)
