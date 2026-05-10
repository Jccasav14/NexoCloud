from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    nombre: str
    correo: EmailStr

class UserCreate(UserBase):
    password: str
    id_rol: Optional[int] = None

class UserLogin(BaseModel):
    correo: EmailStr
    password: str

class UserResponse(UserBase):
    id_usuario: int
    id_rol: int
    estado: str
    fecha_registro: datetime

    class Config:
        from_attributes = True

class RoleResponse(BaseModel):
    id_rol: int
    nombre_rol: str

    class Config:
        from_attributes = True

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
