import os
import shutil
from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.models.all_models import File

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_file_locally(upload_file: UploadFile, user_id: int) -> dict:
    user_dir = os.path.join(UPLOAD_DIR, str(user_id))
    os.makedirs(user_dir, exist_ok=True)

    file_path = os.path.join(user_dir, upload_file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    file_size = os.path.getsize(file_path)
    relative_path = f"uploads/{user_id}/{upload_file.filename}"

    return {
        "path": relative_path,
        "size": file_size,
        "content_type": upload_file.content_type or "application/octet-stream",
    }


def create_file_record(
    db: Session,
    user_id: int,
    filename: str,
    content_type: str,
    size: int,
    path: str,
) -> File:
    db_file = File(
        id_usuario=user_id,
        nombre_archivo=filename,
        tipo_archivo=content_type,
        tamano=size,
        ruta_s3=path,
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


def get_files_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 50):
    return (
        db.query(File)
        .filter(File.id_usuario == user_id)
        .order_by(File.fecha_subida.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_all_files(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(File)
        .order_by(File.fecha_subida.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_file_by_id(db: Session, file_id: int):
    return db.query(File).filter(File.id_archivo == file_id).first()


def delete_file_record(db: Session, db_file: File):
    file_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        db_file.ruta_s3,
    )
    if os.path.exists(file_path):
        os.remove(file_path)
    db.delete(db_file)
    db.commit()
