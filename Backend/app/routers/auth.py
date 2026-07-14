from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user_schema import UserCreate, UserResponse, PasswordChange
from app.schemas.token_schema import Token
from app.controllers.auth_controller import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.controllers.user_controller import get_user_by_email, create_user, change_user_password
from app.controllers.event_controller import create_event
from app.routers.deps import get_current_active_user
from app.models.all_models import User

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.correo)
    if db_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    nuevo_usuario = create_user(db=db, user=user)

    create_event(
        db, nuevo_usuario.id_usuario,
        "REGISTRO_USUARIO",
        f"Nueva cuenta registrada: {nuevo_usuario.correo}"
    )

    return nuevo_usuario

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    role_name = user.rol.nombre_rol if user.rol else None

    access_token = create_access_token(
        data={"sub": user.correo, "rol": role_name}, expires_delta=access_token_expires
    )

    create_event(
        db, user.id_usuario,
        "INICIO_SESION",
        f"El usuario {user.correo} inicio sesion"
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.put("/change-password", response_model=dict)
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )
    
    change_user_password(db, current_user, password_data.new_password)

    create_event(
        db, current_user.id_usuario,
        "CAMBIO_CONTRASENA",
        f"El usuario {current_user.correo} cambio su contraseña"
    )

    return {"message": "Contraseña actualizada exitosamente"}
