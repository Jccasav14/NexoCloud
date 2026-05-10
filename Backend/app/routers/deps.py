from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.database import get_db
from app.controllers.auth_controller import SECRET_KEY, ALGORITHM
from app.models.all_models import User
from app.schemas.token_schema import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        correo: str = payload.get("sub")
        if correo is None:
            raise credentials_exception
        token_data = TokenData(correo=correo)
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.correo == token_data.correo).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.estado != "activo":
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return current_user

def require_role(role_names: list[str]):
    def role_checker(current_user: User = Depends(get_current_active_user)):
        if not current_user.rol or current_user.rol.nombre_rol not in role_names:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción"
            )
        return current_user
    return role_checker
