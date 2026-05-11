import { useState, useEffect, useCallback } from "react";
import {
  LogOut, Menu, X, LayoutDashboard, Users, FolderOpen, Activity,
  Settings, UploadCloud, User as UserIcon, Shield, Eye, EyeOff,
  AlertCircle, CheckCircle2, Lock, Trash2, UserCheck, UserX, RefreshCw
} from "lucide-react";
import { authService, type UserResponse } from "../services/authService";
import { apiService, type FileItem, type EventItem, type UserItem } from "../services/apiService";
import "./DashboardPage.css";

interface DashboardPageProps {
  user: UserResponse;
  onLogout: () => void;
}

export default function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");

  const roleName = authService.getRoleNameById(user.id_rol);

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  const getNavItems = () => {
    const base = [
      { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    ];

    if (user.id_rol === 2) {
      base.push(
        { id: "my-files", icon: <FolderOpen size={20} />, label: "Mis Archivos" },
        { id: "upload", icon: <UploadCloud size={20} />, label: "Subir Archivo" },
      );
    }

    if (user.id_rol === 1) {
      base.push(
        { id: "admin-users", icon: <Users size={20} />, label: "Usuarios" },
        { id: "admin-files", icon: <FolderOpen size={20} />, label: "Archivos" },
        { id: "admin-events", icon: <Activity size={20} />, label: "Auditoria" },
      );
    }

    if (user.id_rol === 3) {
      base.push(
        { id: "audit-events", icon: <Activity size={20} />, label: "Eventos" },
      );
    }

    base.push(
      { id: "settings", icon: <Settings size={20} />, label: "Configuracion" },
    );

    return base;
  };

  const getTopbarTitle = () => {
    const titles: Record<string, string> = {
      dashboard: "Panel de Control",
      "my-files": "Mis Archivos",
      upload: "Subir Archivo",
      "admin-users": "Gestion de Usuarios",
      "admin-files": "Todos los Archivos",
      "admin-events": "Registro de Auditoria",
      "audit-events": "Registro de Eventos",
      settings: "Configuracion de Cuenta",
    };
    return titles[activeView] || "Panel de Control";
  };

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="NexoCloud Logo" />
            <span>NEXOCLOUD</span>
          </div>
          <button className="toggle-sidebar-btn" onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}>
            {isSidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <div className="sidebar-content">
          {getNavItems().map((item) => (
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
            <span>Cerrar sesion</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          {isSidebarCollapsed && (
            <button className="toggle-sidebar-btn-light" onClick={() => setSidebarCollapsed(false)}>
              <Menu size={20} />
            </button>
          )}
          <div className="topbar-title">{getTopbarTitle()}</div>
        </header>

        <div className="dashboard-content">
          {activeView === "dashboard" && <DashboardHome user={user} roleName={roleName} />}
          {activeView === "my-files" && <MyFilesView />}
          {activeView === "upload" && <UploadView />}
          {activeView === "admin-users" && <AdminUsersView />}
          {activeView === "admin-files" && <AdminFilesView />}
          {activeView === "admin-events" && <AuditView isAdmin />}
          {activeView === "audit-events" && <AuditView isAdmin={false} />}
          {activeView === "settings" && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

function DashboardHome({ user, roleName }: { user: UserResponse; roleName: string }) {
  const adminCards = [
    { icon: <Users size={24} />, title: "Gestion de Usuarios", desc: "Administra cuentas, roles y permisos de todos los usuarios.", badge: "Admin", iconClass: "icon-purple" },
    { icon: <FolderOpen size={24} />, title: "Gestion de Archivos", desc: "Supervisa todos los archivos subidos al sistema.", badge: "Admin", iconClass: "icon-cyan" },
    { icon: <Activity size={24} />, title: "Panel de Auditoria", desc: "Visualiza logs, eventos y trazabilidad del sistema.", badge: "Admin", iconClass: "icon-orange" },
  ];
  const userCards = [
    { icon: <FolderOpen size={24} />, title: "Mis Archivos", desc: "Sube, descarga y organiza tus archivos en la nube.", badge: "Archivos", iconClass: "icon-cyan" },
    { icon: <UploadCloud size={24} />, title: "Subir Archivo", desc: "Carga nuevos archivos de forma segura.", badge: "Accion", iconClass: "icon-green" },
  ];
  const auditorCards = [
    { icon: <Activity size={24} />, title: "Registro de Eventos", desc: "Consulta el historial de acciones realizadas.", badge: "Auditoria", iconClass: "icon-orange" },
  ];

  const cards = user.id_rol === 1 ? adminCards : user.id_rol === 3 ? auditorCards : userCards;

  return (
    <>
      <div className="dashboard-welcome">
        <h1>Hola, {user.nombre.split(" ")[0]}</h1>
        <p>Bienvenido al panel de {roleName}. Aqui tienes acceso a tus herramientas.</p>
      </div>
      <div className="dashboard-grid">
        {cards.map((card, i) => (
          <div className="dashboard-card" key={i}>
            <div className="dashboard-card-header">
              <div className={`dashboard-card-icon ${card.iconClass}`}>{card.icon}</div>
              <span className="dashboard-card-badge">{card.badge}</span>
            </div>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function MyFilesView() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getMyFiles();
      setFiles(data);
    } catch { setMsg("Error al cargar archivos"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Eliminar "${name}"?`)) return;
    try {
      await apiService.deleteMyFile(id);
      setMsg(`Archivo "${name}" eliminado`);
      loadFiles();
    } catch { setMsg("Error al eliminar"); }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div>
      <div className="section-header">
        <h2>Mis Archivos</h2>
        <button className="btn-refresh" onClick={loadFiles}><RefreshCw size={16} /> Actualizar</button>
      </div>
      {msg && <div className="alert alert-info"><CheckCircle2 size={16} /><span>{msg}</span></div>}
      {loading ? <p className="text-muted">Cargando...</p> : files.length === 0 ? <p className="text-muted">No tienes archivos subidos.</p> : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Nombre</th><th>Tipo</th><th>Tamano</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id_archivo}>
                  <td className="td-name">{f.nombre_archivo}</td>
                  <td>{f.tipo_archivo || "-"}</td>
                  <td>{formatSize(f.tamano)}</td>
                  <td>{new Date(f.fecha_subida).toLocaleDateString()}</td>
                  <td><button className="btn-icon-danger" onClick={() => handleDelete(f.id_archivo, f.nombre_archivo)}><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UploadView() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true); setMsg(""); setError("");
    try {
      const res = await apiService.uploadFile(file);
      setMsg(`Archivo "${res.nombre_archivo}" subido exitosamente`);
      setFile(null);
      const input = document.getElementById("file-input") as HTMLInputElement;
      if (input) input.value = "";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al subir archivo");
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h2>Subir Archivo</h2>
      {error && <div className="alert alert-error"><AlertCircle size={16} /><span>{error}</span></div>}
      {msg && <div className="alert alert-success"><CheckCircle2 size={16} /><span>{msg}</span></div>}
      <div className="upload-card">
        <form onSubmit={handleUpload}>
          <div className="upload-zone">
            <UploadCloud size={48} strokeWidth={1.5} />
            <p>Selecciona un archivo para subir</p>
            <input id="file-input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          {file && <p className="upload-filename">Archivo seleccionado: <strong>{file.name}</strong></p>}
          <button type="submit" className="btn-change-pass" disabled={loading || !file} style={{ marginTop: 16 }}>
            {loading ? "Subiendo..." : "Subir Archivo"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminUsersView() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try { setUsers(await apiService.getAllUsers()); } catch { setMsg("Error al cargar usuarios"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const toggleStatus = async (u: UserItem) => {
    try {
      if (u.estado === "activo") await apiService.deactivateUser(u.id_usuario);
      else await apiService.activateUser(u.id_usuario);
      setMsg(`Usuario "${u.nombre}" ${u.estado === "activo" ? "desactivado" : "activado"}`);
      loadUsers();
    } catch (err: unknown) { setMsg(err instanceof Error ? err.message : "Error"); }
  };

  const changeRole = async (userId: number, roleId: number) => {
    try {
      await apiService.changeUserRole(userId, roleId);
      setMsg("Rol actualizado");
      loadUsers();
    } catch (err: unknown) { setMsg(err instanceof Error ? err.message : "Error"); }
  };

  return (
    <div>
      <div className="section-header">
        <h2>Gestion de Usuarios</h2>
        <button className="btn-refresh" onClick={loadUsers}><RefreshCw size={16} /> Actualizar</button>
      </div>
      {msg && <div className="alert alert-info"><CheckCircle2 size={16} /><span>{msg}</span></div>}
      {loading ? <p className="text-muted">Cargando...</p> : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id_usuario}>
                  <td className="td-name">{u.nombre}</td>
                  <td>{u.correo}</td>
                  <td>
                    <select className="role-select" value={u.id_rol} onChange={(e) => changeRole(u.id_usuario, Number(e.target.value))}>
                      <option value={1}>Administrador</option>
                      <option value={2}>Usuario empresarial</option>
                      <option value={3}>Auditor</option>
                    </select>
                  </td>
                  <td><span className={`status-badge ${u.estado === "activo" ? "status-active" : "status-inactive"}`}>{u.estado}</span></td>
                  <td>
                    <button className={u.estado === "activo" ? "btn-icon-danger" : "btn-icon-success"} onClick={() => toggleStatus(u)} title={u.estado === "activo" ? "Desactivar" : "Activar"}>
                      {u.estado === "activo" ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminFilesView() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try { setFiles(await apiService.getAllFiles()); } catch { setMsg("Error al cargar archivos"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Eliminar "${name}"?`)) return;
    try {
      await apiService.adminDeleteFile(id);
      setMsg(`Archivo "${name}" eliminado`);
      loadFiles();
    } catch { setMsg("Error al eliminar"); }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div>
      <div className="section-header">
        <h2>Todos los Archivos</h2>
        <button className="btn-refresh" onClick={loadFiles}><RefreshCw size={16} /> Actualizar</button>
      </div>
      {msg && <div className="alert alert-info"><CheckCircle2 size={16} /><span>{msg}</span></div>}
      {loading ? <p className="text-muted">Cargando...</p> : files.length === 0 ? <p className="text-muted">No hay archivos en el sistema.</p> : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Nombre</th><th>Usuario</th><th>Tipo</th><th>Tamano</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id_archivo}>
                  <td className="td-name">{f.nombre_archivo}</td>
                  <td>{f.nombre_usuario || `ID: ${f.id_usuario}`}</td>
                  <td>{f.tipo_archivo || "-"}</td>
                  <td>{formatSize(f.tamano)}</td>
                  <td>{new Date(f.fecha_subida).toLocaleDateString()}</td>
                  <td><button className="btn-icon-danger" onClick={() => handleDelete(f.id_archivo, f.nombre_archivo)}><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AuditView({ isAdmin }: { isAdmin: boolean }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = isAdmin ? await apiService.getAuditEvents() : await apiService.getAuditEventsForAuditor();
      setEvents(data);
    } catch { /* skip */ }
    finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  return (
    <div>
      <div className="section-header">
        <h2>Registro de Auditoria</h2>
        <button className="btn-refresh" onClick={loadEvents}><RefreshCw size={16} /> Actualizar</button>
      </div>
      {loading ? <p className="text-muted">Cargando...</p> : events.length === 0 ? <p className="text-muted">No hay eventos registrados.</p> : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Evento</th><th>Descripcion</th><th>Usuario</th><th>Fecha</th></tr></thead>
            <tbody>
              {events.map(e => (
                <tr key={e.id_evento}>
                  <td><span className="event-badge">{e.tipo_evento}</span></td>
                  <td>{e.descripcion}</td>
                  <td>{e.nombre_usuario || `ID: ${e.id_usuario}`}</td>
                  <td>{new Date(e.fecha_evento).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SettingsView() {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (newPass !== confirmPass) { setError("Las contrasenas no coinciden"); return; }
    if (newPass.length < 6) { setError("La nueva contrasena debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    try {
      await authService.changePassword(currentPass, newPass);
      setSuccess("Contrasena actualizada exitosamente");
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cambiar contrasena");
    } finally { setLoading(false); }
  };

  return (
    <div className="change-password-section">
      <h2>Cambiar contrasena</h2>
      {error && <div className="alert alert-error"><AlertCircle size={18} /><span>{error}</span></div>}
      {success && <div className="alert alert-success"><CheckCircle2 size={18} /><span>{success}</span></div>}
      <form onSubmit={handleChangePassword}>
        <div className="dash-form-group">
          <label className="dash-form-label">Contrasena actual</label>
          <div className="dash-input-wrapper">
            <span className="dash-input-icon"><Lock size={18} /></span>
            <input type={showCurrentPass ? "text" : "password"} className="dash-input" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} required />
            <button type="button" className="dash-toggle-password" onClick={() => setShowCurrentPass(!showCurrentPass)}>
              {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="dash-form-group">
          <label className="dash-form-label">Nueva contrasena</label>
          <div className="dash-input-wrapper">
            <span className="dash-input-icon"><Lock size={18} /></span>
            <input type={showNewPass ? "text" : "password"} className="dash-input" value={newPass} onChange={(e) => setNewPass(e.target.value)} required minLength={6} />
            <button type="button" className="dash-toggle-password" onClick={() => setShowNewPass(!showNewPass)}>
              {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="dash-form-group">
          <label className="dash-form-label">Confirmar nueva contrasena</label>
          <div className="dash-input-wrapper">
            <span className="dash-input-icon"><Lock size={18} /></span>
            <input type="password" className="dash-input" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required />
          </div>
        </div>
        <button type="submit" className="btn-change-pass" disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar contrasena"}
        </button>
      </form>
    </div>
  );
}
