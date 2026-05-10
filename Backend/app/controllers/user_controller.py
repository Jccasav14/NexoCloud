from sqlalchemy.orm import Session
from app.models.all_models import User, Role
from app.schemas.user_schema import UserCreate
from app.controllers.auth_controller import get_password_hash

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.correo == email).first()

def get_role_by_name(db: Session, role_name: str):
    return db.query(Role).filter(Role.nombre_rol == role_name).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    
    role_id = user.id_rol
    if not role_id:
        default_role = get_role_by_name(db, "Usuario empresarial")
        if default_role:
            role_id = default_role.id_rol
    
    db_user = User(
        nombre=user.nombre,
        correo=user.correo,
        password_hash=hashed_password,
        id_rol=role_id,
        estado="activo"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def change_user_password(db: Session, user: User, new_password: str):
    hashed_password = get_password_hash(new_password)
    user.password_hash = hashed_password
    db.commit()
    db.refresh(user)
    return user
