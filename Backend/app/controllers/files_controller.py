import os
from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.models.all_models import File
from app.s3_service import storage_service


def save_file_to_storage(upload_file: UploadFile, user_id: int) -> dict:
    return storage_service.save_file(upload_file, user_id)


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
    storage_service.delete_file(db_file.ruta_s3)
    db.delete(db_file)
    db.commit()
