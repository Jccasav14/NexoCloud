from sqlalchemy.orm import Session
from app.models.all_models import Role, User
from app.controllers.auth_controller import get_password_hash

def init_db(db: Session):
    roles_iniciales = ["Administrador", "Usuario empresarial", "Supervisor/Auditor"]
    
    for nombre_rol in roles_iniciales:
        rol = db.query(Role).filter(Role.nombre_rol == nombre_rol).first()
        if not rol:
            nuevo_rol = Role(nombre_rol=nombre_rol)
            db.add(nuevo_rol)
    
    db.commit()

    admin_rol = db.query(Role).filter(Role.nombre_rol == "Administrador").first()
    
    admin_email = "admin@nexocloud.com"
    admin_user = db.query(User).filter(User.correo == admin_email).first()
    
    if not admin_user and admin_rol:
        nuevo_admin = User(
            nombre="Admin Principal",
            correo=admin_email,
            password_hash=get_password_hash("admin123"),
            id_rol=admin_rol.id_rol,
            estado="activo"
        )
        db.add(nuevo_admin)
        db.commit()
