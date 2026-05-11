import { useState } from "react";
import { 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  Activity, 
  Settings,
  UploadCloud,
  User as UserIcon,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock
} from "lucide-react";
import { authService, type UserResponse } from "../services/authService";
import "./DashboardPage.css";

interface DashboardPageProps {
  user: UserResponse;
  onLogout: () => void;
}

export default function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const roleName = authService.getRoleNameById(user.id_rol);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPass !== confirmPass) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (newPass.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(currentPass, newPass);
      setSuccess("Contraseña actualizada exitosamente");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cambiar contraseña");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  const adminCards = [
    { icon: <Users size={24} />, title: "Gestión de Usuarios", desc: "Administra cuentas, roles y permisos de todos los usuarios de la plataforma.", badge: "Admin", iconClass: "icon-purple" },
    { icon: <FolderOpen size={24} />, title: "Gestión de Archivos", desc: "Supervisa todos los archivos almacenados en S3 y gestiona el espacio.", badge: "Admin", iconClass: "icon-cyan" },
    { icon: <Activity size={24} />, title: "Panel de Auditoría", desc: "Visualiza logs, eventos y trazabilidad completa del sistema.", badge: "Admin", iconClass: "icon-orange" },
    { icon: <Settings size={24} />, title: "Configuración", desc: "Ajustes generales del sistema, seguridad y parámetros de la plataforma.", badge: "Admin", iconClass: "icon-red" },
  ];

  const userCards = [
    { icon: <FolderOpen size={24} />, title: "Mis Archivos", desc: "Sube, descarga y organiza tus archivos almacenados en la nube.", badge: "Archivos", iconClass: "icon-cyan" },
    { icon: <UserIcon size={24} />, title: "Mi Perfil", desc: "Consulta y actualiza tu información personal y credenciales.", badge: "Perfil", iconClass: "icon-purple" },
    { icon: <UploadCloud size={24} />, title: "Subir Archivo", desc: "Carga nuevos archivos de forma segura a Amazon S3.", badge: "Acción", iconClass: "icon-green" },
  ];

  const auditorCards = [
    { icon: <Activity size={24} />, title: "Registro de Eventos", desc: "Consulta el historial completo de acciones realizadas en la plataforma.", badge: "Auditoría", iconClass: "icon-orange" },
    { icon: <Users size={24} />, title: "Usuarios Activos", desc: "Visualiza la lista de usuarios registrados y su estado actual.", badge: "Lectura", iconClass: "icon-purple" },
    { icon: <FolderOpen size={24} />, title: "Archivos del Sistema", desc: "Revisa los archivos almacenados sin capacidad de modificación.", badge: "Lectura", iconClass: "icon-cyan" },
  ];

  const getCards = () => {
    if (user.id_rol === 1) return adminCards;
    if (user.id_rol === 3) return auditorCards;
    return userCards;
  };

  const navItems = [
    { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { id: "settings", icon: <Settings size={20} />, label: "Configuración" },
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="NexoCloud Logo" />
            <span>NEXOCLOUD</span>
          </div>
          <button 
            className="toggle-sidebar-btn" 
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            {isSidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <div className="sidebar-content">
          {navItems.map((item) => (
            <div 
              key={item.id}
              className={`sidebar-nav-item ${activeView === item.id ? "active" : ""}`}
              onClick={() => setActiveView(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user.id_rol === 1 ? <Shield size={20} /> : <UserIcon size={20} />}
            </div>
            <div className="user-info">
              <span className="user-name">{user.nombre.split(" ")[0]}</span>
              <span className="user-role">{roleName}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          {isSidebarCollapsed && (
            <button 
              className="toggle-sidebar-btn-light" 
              onClick={() => setSidebarCollapsed(false)}
            >
              <Menu size={20} />
            </button>
          )}
          <div className="topbar-title">
            {activeView === "dashboard" ? "Panel de Control" : "Configuración de Cuenta"}
          </div>
        </header>

        <div className="dashboard-content">
          {activeView === "dashboard" ? (
            <>
              <div className="dashboard-welcome">
                <h1>Hola, {user.nombre.split(" ")[0]}</h1>
                <p>Bienvenido al panel de {roleName}. Aquí tienes acceso a tus herramientas.</p>
              </div>

              <div className="dashboard-grid">
                {getCards().map((card, i) => (
                  <div className="dashboard-card" key={i}>
                    <div className="dashboard-card-header">
                      <div className={`dashboard-card-icon ${card.iconClass}`}>
                        {card.icon}
                      </div>
                      <span className="dashboard-card-badge">{card.badge}</span>
                    </div>
                    <h3>{card.title}</h3>
                    <p>{card.desc}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="change-password-section">
              <h2>Cambiar contraseña</h2>
              {error && (
                <div className="alert alert-error">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="alert alert-success">
                  <CheckCircle2 size={18} />
                  <span>{success}</span>
                </div>
              )}
              <form onSubmit={handleChangePassword}>
                  <div className="dash-form-group">
                    <label className="dash-form-label">Contraseña actual</label>
                    <div className="dash-input-wrapper">
                      <span className="dash-input-icon"><Lock size={18} /></span>
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        className="dash-input"
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="dash-toggle-password"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                      >
                        {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="dash-form-group">
                    <label className="dash-form-label">Nueva contraseña</label>
                    <div className="dash-input-wrapper">
                      <span className="dash-input-icon"><Lock size={18} /></span>
                      <input
                        type={showNewPass ? "text" : "password"}
                        className="dash-input"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="dash-toggle-password"
                        onClick={() => setShowNewPass(!showNewPass)}
                      >
                        {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="dash-form-group">
                    <label className="dash-form-label">Confirmar nueva contraseña</label>
                    <div className="dash-input-wrapper">
                      <span className="dash-input-icon"><Lock size={18} /></span>
                      <input
                        type="password"
                        className="dash-input"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-change-pass"
                    disabled={loading}
                  >
                    {loading ? "Actualizando..." : "Actualizar contraseña"}
                  </button>
                </form>
              </div>
          )}
        </div>
      </main>
    </div>
  );
}
