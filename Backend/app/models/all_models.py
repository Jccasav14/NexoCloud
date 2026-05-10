from sqlalchemy import Column, Integer, String, BigInteger, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Role(Base):
    __tablename__ = "roles"

    id_rol = Column(Integer, primary_key=True, index=True)
    nombre_rol = Column(String, unique=True, index=True)

    usuarios = relationship("User", back_populates="rol")

class User(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True)
    id_rol = Column(Integer, ForeignKey("roles.id_rol"))
    nombre = Column(String, index=True)
    correo = Column(String, unique=True, index=True)
    password_hash = Column(String)
    estado = Column(String, default="activo")
    fecha_registro = Column(DateTime, default=datetime.utcnow)

    rol = relationship("Role", back_populates="usuarios")
    archivos = relationship("File", back_populates="usuario")
    eventos = relationship("Event", back_populates="usuario")

class File(Base):
    __tablename__ = "archivos"

    id_archivo = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"))
    nombre_archivo = Column(String)
    tipo_archivo = Column(String)
    tamano = Column(BigInteger)
    ruta_s3 = Column(String)
    fecha_subida = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("User", back_populates="archivos")

class Event(Base):
    __tablename__ = "eventos"

    id_evento = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"))
    tipo_evento = Column(String)
    descripcion = Column(Text)
    fecha_evento = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("User", back_populates="eventos")
