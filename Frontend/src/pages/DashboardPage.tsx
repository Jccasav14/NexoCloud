import { useState, useEffect, useCallback } from "react";
import {
  LogOut, Menu, X, LayoutDashboard, Users, FolderOpen, Activity,
  Settings, UploadCloud, User as UserIcon, Shield, Eye, EyeOff,
  AlertCircle, CheckCircle2, Lock, Trash2, UserCheck, UserX, RefreshCw,
  HardDrive, FileText, ChevronRight, Download
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
          {activeView === "dashboard" && <DashboardHome user={user} roleName={roleName} setActiveView={setActiveView} />}
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

interface DashboardHomeProps {
  user: UserResponse;
  roleName: string;
  setActiveView: (view: string) => void;
}

function DashboardHome({ user, roleName, setActiveView }: DashboardHomeProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar las estadísticas del dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = 1;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "SUBIDA_ARCHIVO": return "status-active";
      case "ELIMINACION_ARCHIVO":
      case "ADMIN_ELIMINACION_ARCHIVO":
      case "DESACTIVACION_USUARIO":
        return "status-inactive";
      case "ACTIVACION_USUARIO":
      case "CAMBIO_ROL":
        return "status-warning";
      case "LOGIN": return "status-info";
      default: return "status-default";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "SUBIDA_ARCHIVO": return <UploadCloud size={16} />;
      case "ELIMINACION_ARCHIVO":
      case "ADMIN_ELIMINACION_ARCHIVO":
        return <Trash2 size={16} />;
      case "DESACTIVACION_USUARIO": return <UserX size={16} />;
      case "ACTIVACION_USUARIO": return <UserCheck size={16} />;
      case "CAMBIO_ROL": return <RefreshCw size={16} />;
      case "LOGIN": return <UserIcon size={16} />;
      default: return <Activity size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-loader"></div>
        <p>Generando vista consolidada del panel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error-card">
        <AlertCircle size={40} className="icon-error-anim" />
        <h3>Error al Cargar Dashboard</h3>
        <p>{error}</p>
        <button className="btn-refresh" onClick={fetchStats} style={{ marginTop: 12 }}>
          <RefreshCw size={16} /> Reintentar
        </button>
      </div>
    );
  }

  // Helper chart component (SVG Donut)
  const DonutChart = ({ data, totalLabel }: { data: { label: string; value: number; color: string }[]; totalLabel: string }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    let accumulatedPercent = 0;
    
    return (
      <div className="donut-chart-container">
        <div className="donut-svg-wrapper">
          <svg viewBox="0 0 100 100" className="donut-svg">
            {total === 0 ? (
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#E5E7EB" strokeWidth="10" />
            ) : (
              data.map((item, index) => {
                const percent = (item.value / total) * 100;
                const strokeDash = `${percent} ${100 - percent}`;
                const strokeOffset = 100 - accumulatedPercent + 25; // 25 to start at 12 o'clock
                accumulatedPercent += percent;
                
                return (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="10"
                    strokeDasharray={strokeDash}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    className="donut-segment"
                  />
                );
              })
            )}
            <circle cx="50" cy="50" r="28" fill="#FFFFFF" />
            <text x="50" y="48" textAnchor="middle" className="donut-center-val">
              {total}
            </text>
            <text x="50" y="60" textAnchor="middle" className="donut-center-lbl">
              {totalLabel}
            </text>
          </svg>
        </div>
        <div className="donut-legend">
          {data.map((item, idx) => (
            <div key={idx} className="donut-legend-item">
              <span className="legend-color-dot" style={{ backgroundColor: item.color }} />
              <span className="legend-text">
                <span className="legend-label">{item.label}</span>
                <span className="legend-val">{item.value} ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getEventChartData = (breakdown: Record<string, number>) => {
    const colors = ["#8B5CF6", "#EC4899", "#10B981", "#3B82F6", "#F59E0B", "#EF4444"];
    return Object.entries(breakdown).map(([label, value], idx) => ({
      label: label.replace("_", " "),
      value,
      color: colors[idx % colors.length]
    }));
  };

  const renderAdminDashboard = () => {
    const s = stats.stats;
    const recentEvents = stats.recent_events || [];
    const recentFiles = stats.recent_files || [];
    const breakdown = stats.events_breakdown || {};
    const chartData = getEventChartData(breakdown);

    return (
      <div className="dashboard-view-wrapper animate-fade-in">
        {/* Banner de Bienvenida */}
        <div className="dashboard-welcome-banner">
          <div className="banner-details">
            <h1>Bienvenido de nuevo, {user.nombre.split(" ")[0]} 🚀</h1>
            <p>Monitoreo global en tiempo real de NexoCloud. Tienes permisos del rol: <strong>{roleName}</strong>.</p>
          </div>
          <button className="btn-refresh-dashboard" onClick={fetchStats} title="Actualizar datos">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="metrics-row">
          <div className="metric-card shadow-premium">
            <div className="metric-card-header">
              <span className="metric-title">Usuarios Registrados</span>
              <div className="metric-icon bg-purple-soft"><Users size={20} /></div>
            </div>
            <div className="metric-value">{s.total_users}</div>
            <div className="metric-footer text-success">
              <UserCheck size={14} style={{ marginRight: 4 }} />
              <span>{s.active_users} cuentas activas</span>
            </div>
          </div>

          <div className="metric-card shadow-premium">
            <div className="metric-card-header">
              <span className="metric-title">Archivos en Plataforma</span>
              <div className="metric-icon bg-pink-soft"><FolderOpen size={20} /></div>
            </div>
            <div className="metric-value">{s.total_files}</div>
            <div className="metric-footer text-muted">
              <span>Almacenamiento total de NexoCloud</span>
            </div>
          </div>

          <div className="metric-card shadow-premium">
            <div className="metric-card-header">
              <span className="metric-title">Almacenamiento Usado</span>
              <div className="metric-icon bg-cyan-soft"><HardDrive size={20} /></div>
            </div>
            <div className="metric-value">{formatSize(s.total_storage)}</div>
            <div className="metric-footer text-primary">
              <span>Almacenado local / S3 integrado</span>
            </div>
          </div>
        </div>

        {/* Cuerpo del Dashboard: Dos Columnas */}
        <div className="dashboard-layout-grid">
          {/* Gráfico y Acciones */}
          <div className="dashboard-column flex-col-gap">
            <div className="panel-card shadow-premium">
              <h3>Actividades por Tipo</h3>
              <p className="panel-subtitle">Distribución porcentual de los eventos registrados</p>
              {chartData.length === 0 ? (
                <div className="empty-panel-state">
                  <Activity size={32} />
                  <p>No hay eventos registrados para graficar.</p>
                </div>
              ) : (
                <DonutChart data={chartData} totalLabel="Eventos" />
              )}
            </div>

            <div className="panel-card shadow-premium">
              <h3>Accesos Directos</h3>
              <div className="quick-actions-grid">
                <button className="quick-action-btn" onClick={() => setActiveView("admin-users")}>
                  <Users size={18} />
                  <span>Gestionar Usuarios</span>
                </button>
                <button className="quick-action-btn" onClick={() => setActiveView("admin-files")}>
                  <FolderOpen size={18} />
                  <span>Ver Archivos</span>
                </button>
                <button className="quick-action-btn" onClick={() => setActiveView("admin-events")}>
                  <Activity size={18} />
                  <span>Auditoría Global</span>
                </button>
              </div>
            </div>
          </div>

          {/* Listados Recientes */}
          <div className="dashboard-column flex-col-gap">
            <div className="panel-card shadow-premium">
              <h3>Actividades Recientes</h3>
              <div className="activity-timeline">
                {recentEvents.length === 0 ? (
                  <p className="text-muted text-center py-4">Sin actividades recientes.</p>
                ) : (
                  recentEvents.map((e: any) => (
                    <div key={e.id_evento} className="timeline-item">
                      <div className={`timeline-icon ${getEventBadgeColor(e.tipo_evento)}`}>
                        {getEventIcon(e.tipo_evento)}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-user">{e.nombre_usuario}</span>
                          <span className="timeline-time">{new Date(e.fecha_evento).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="timeline-desc">{e.descripcion}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel-card shadow-premium">
              <h3>Últimos Archivos Subidos</h3>
              <div className="recent-files-list">
                {recentFiles.length === 0 ? (
                  <p className="text-muted text-center py-4">No se han subido archivos aún.</p>
                ) : (
                  recentFiles.map((f: any) => (
                    <div key={f.id_archivo} className="recent-file-item">
                      <div className="file-avatar">
                        <FileText size={20} />
                      </div>
                      <div className="file-details">
                        <span className="file-name">{f.nombre_archivo}</span>
                        <span className="file-meta">
                          Subido por {f.nombre_usuario} • {formatSize(f.tamano)}
                        </span>
                      </div>
                      <span className="file-date">{new Date(f.fecha_subida).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUserDashboard = () => {
    const s = stats.stats;
    const recentFiles = stats.recent_files || [];
    const recentEvents = stats.recent_events || [];
    const breakdown = stats.types_breakdown || {};
    const hasFiles = s.total_files > 0;
    
    // Storage calculations
    const percentUsed = Math.min(100, (s.total_storage / s.storage_limit) * 100);
    const storageLeft = Math.max(0, s.storage_limit - s.total_storage);

    return (
      <div className="dashboard-view-wrapper animate-fade-in">
        {/* Banner de Bienvenida */}
        <div className="dashboard-welcome-banner">
          <div className="banner-details">
            <h1>Hola, {user.nombre.split(" ")[0]} 👋</h1>
            <p>Este es tu panel corporativo en NexoCloud. Administra, almacena y visualiza tus archivos de forma segura.</p>
          </div>
          <button className="btn-refresh-dashboard" onClick={fetchStats} title="Actualizar datos">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Fila de Métricas del Usuario */}
        <div className="metrics-row">
          <div className="metric-card shadow-premium">
            <div className="metric-card-header">
              <span className="metric-title">Mis Archivos</span>
              <div className="metric-icon bg-cyan-soft"><FolderOpen size={20} /></div>
            </div>
            <div className="metric-value">{s.total_files}</div>
            <div className="metric-footer text-muted">
              <span>Archivos subidos a tu cuenta</span>
            </div>
          </div>

          <div className="metric-card shadow-premium">
            <div className="metric-card-header">
              <span className="metric-title">Espacio Utilizado</span>
              <div className="metric-icon bg-purple-soft"><HardDrive size={20} /></div>
            </div>
            <div className="metric-value">{formatSize(s.total_storage)}</div>
            <div className="metric-footer text-muted">
              <span>De un límite total de {formatSize(s.storage_limit)}</span>
            </div>
          </div>

          <div className="metric-card shadow-premium">
            <div className="metric-card-header">
              <span className="metric-title">Espacio Disponible</span>
              <div className="metric-icon bg-green-soft"><CheckCircle2 size={20} /></div>
            </div>
            <div className="metric-value">{formatSize(storageLeft)}</div>
            <div className="metric-footer text-success">
              <span>{percentUsed.toFixed(1)}% de la cuota utilizada</span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Almacenamiento Premium */}
        <div className="panel-card shadow-premium storage-widget-card">
          <div className="storage-widget-header">
            <div>
              <h3>Uso de tu Cuota de Almacenamiento</h3>
              <p className="panel-subtitle">Consumo de espacio en la nube</p>
            </div>
            <span className="storage-percent-pill">{percentUsed.toFixed(1)}% usado</span>
          </div>
          <div className="storage-progress-container">
            <div className="storage-progress-bar" style={{ width: `${percentUsed}%` }}>
              <div className="storage-progress-glow" />
            </div>
          </div>
          <div className="storage-progress-footer">
            <span>{formatSize(s.total_storage)} ocupados</span>
            <span>Límite corporativo: {formatSize(s.storage_limit)}</span>
          </div>
        </div>

        {/* Dos columnas del dashboard */}
        <div className="dashboard-layout-grid">
          {/* Formatos e Historial */}
          <div className="dashboard-column flex-col-gap">
            <div className="panel-card shadow-premium">
              <h3>Formatos de tus Archivos</h3>
              <p className="panel-subtitle">Distribución por extensión de archivo</p>
              {!hasFiles ? (
                <div className="empty-panel-state">
                  <FileText size={32} />
                  <p>Sube archivos para ver la distribución de formatos.</p>
                </div>
              ) : (
                <div className="file-formats-breakdown" style={{ marginTop: 12 }}>
                  {Object.entries(breakdown).map(([ext, count]: [string, any], idx) => {
                    const pct = ((count / s.total_files) * 100).toFixed(0);
                    return (
                      <div key={idx} className="format-item">
                        <div className="format-info">
                          <span className="format-badge">{ext}</span>
                          <span className="format-count">{count} archivo(s) ({pct}%)</span>
                        </div>
                        <div className="format-bar-container">
                          <div className="format-bar" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="panel-card shadow-premium">
              <h3>Enlaces Rápidos</h3>
              <div className="quick-actions-grid">
                <button className="quick-action-btn" onClick={() => setActiveView("upload")}>
                  <UploadCloud size={18} />
                  <span>Subir un Archivo</span>
                </button>
                <button className="quick-action-btn" onClick={() => setActiveView("my-files")}>
                  <FolderOpen size={18} />
                  <span>Gestionar Mis Archivos</span>
                </button>
                <button className="quick-action-btn" onClick={() => setActiveView("settings")}>
                  <Settings size={18} />
                  <span>Seguridad de Cuenta</span>
                </button>
              </div>
            </div>
          </div>

          {/* Archivos Recientes y Eventos */}
          <div className="dashboard-column flex-col-gap">
            <div className="panel-card shadow-premium">
              <h3>Mis Archivos Recientes</h3>
              <div className="recent-files-list">
                {recentFiles.length === 0 ? (
                  <div className="empty-panel-state">
                    <FolderOpen size={32} />
                    <p>No has subido ningún archivo aún.</p>
                  </div>
                ) : (
                  recentFiles.map((f: any) => (
                    <div key={f.id_archivo} className="recent-file-item">
                      <div className="file-avatar">
                        <FileText size={20} />
                      </div>
                      <div className="file-details">
                        <span className="file-name">{f.nombre_archivo}</span>
                        <span className="file-meta">
                          {formatSize(f.tamano)} • {new Date(f.fecha_subida).toLocaleDateString()}
                        </span>
                      </div>
                      <ChevronRight size={18} className="icon-chevron-right" />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel-card shadow-premium">
              <h3>Mi Historial de Acciones</h3>
              <div className="activity-timeline">
                {recentEvents.length === 0 ? (
                  <p className="text-muted text-center py-4">No hay historial reciente.</p>
                ) : (
                  recentEvents.map((e: any) => (
                    <div key={e.id_evento} className="timeline-item">
                      <div className={`timeline-icon ${getEventBadgeColor(e.tipo_evento)}`}>
                        {getEventIcon(e.tipo_evento)}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-user">{e.tipo_evento.replace("_", " ")}</span>
                          <span className="timeline-time">{new Date(e.fecha_evento).toLocaleDateString()}</span>
                        </div>
                        <p className="timeline-desc">{e.descripcion}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAuditorDashboard = () => {
    const s = stats.stats;
    const recentEvents = stats.recent_events || [];
    const breakdown = stats.events_breakdown || {};
    const chartData = getEventChartData(breakdown);

    return (
      <div className="dashboard-view-wrapper animate-fade-in">
        {/* Banner de Bienvenida */}
        <div className="dashboard-welcome-banner">
          <div className="banner-details">
            <h1>Consola de Auditoría de NexoCloud 🛡️</h1>
            <p>Registro y análisis del cumplimiento normativo del sistema. Sesión activa: <strong>{user.nombre}</strong>.</p>
          </div>
          <button className="btn-refresh-dashboard" onClick={fetchStats} title="Actualizar datos">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Tarjetas de Métricas de Auditoría */}
        <div className="metrics-row">
          <div className="metric-card shadow-premium">
            <div className="metric-card-header">
              <span className="metric-title">Eventos Registrados</span>
              <div className="metric-icon bg-orange-soft"><Activity size={20} /></div>
            </div>
            <div className="metric-value">{s.total_events}</div>
            <div className="metric-footer text-muted">
              <span>Logs totales capturados por el sistema</span>
            </div>
          </div>

          <div className="metric-card shadow-premium">
            <div className="metric-card-header">
              <span className="metric-title">Usuarios Activos en Logs</span>
              <div className="metric-icon bg-purple-soft"><Users size={20} /></div>
            </div>
            <div className="metric-value">{s.unique_users}</div>
            <div className="metric-footer text-muted">
              <span>Usuarios únicos que han realizado acciones</span>
            </div>
          </div>
        </div>

        {/* Dos columnas del dashboard */}
        <div className="dashboard-layout-grid">
          {/* Gráfico de Auditoría */}
          <div className="dashboard-column flex-col-gap">
            <div className="panel-card shadow-premium">
              <h3>Frecuencia de Actividades por Tipo</h3>
              <p className="panel-subtitle">Auditoría del tipo de eventos del sistema</p>
              {chartData.length === 0 ? (
                <div className="empty-panel-state">
                  <Activity size={32} />
                  <p>Sin logs de auditoría disponibles en este momento.</p>
                </div>
              ) : (
                <DonutChart data={chartData} totalLabel="Logs" />
              )}
            </div>

            <div className="panel-card shadow-premium">
              <h3>Accesos Directos</h3>
              <div className="quick-actions-grid">
                <button className="quick-action-btn" onClick={() => setActiveView("audit-events")}>
                  <Activity size={18} />
                  <span>Bitácora de Logs</span>
                </button>
                <button className="quick-action-btn" onClick={() => setActiveView("settings")}>
                  <Settings size={18} />
                  <span>Ajustes de Auditor</span>
                </button>
              </div>
            </div>
          </div>

          {/* Historial de Auditoría */}
          <div className="dashboard-column">
            <div className="panel-card shadow-premium">
              <h3>Historial Crítico de Auditoría</h3>
              <p className="panel-subtitle">Logs recientes del sistema en orden cronológico</p>
              <div className="activity-timeline" style={{ marginTop: 16 }}>
                {recentEvents.length === 0 ? (
                  <p className="text-muted text-center py-4">No se han registrado logs.</p>
                ) : (
                  recentEvents.map((e: any) => (
                    <div key={e.id_evento} className="timeline-item">
                      <div className={`timeline-icon ${getEventBadgeColor(e.tipo_evento)}`}>
                        {getEventIcon(e.tipo_evento)}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-user">{e.nombre_usuario}</span>
                          <span className="timeline-time">
                            {new Date(e.fecha_evento).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="timeline-desc">
                          <strong>[{e.tipo_evento}]</strong> {e.descripcion}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (stats.role === "admin") {
    return renderAdminDashboard();
  } else if (stats.role === "user") {
    return renderUserDashboard();
  } else if (stats.role === "auditor") {
    return renderAuditorDashboard();
  } else {
    return (
      <div className="alert alert-error">
        <AlertCircle size={20} />
        <span>Rol de usuario no soportado para el panel de estadísticas.</span>
      </div>
    );
  }
}

function MyFilesView() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Preview state
  const [previewFile, setPreviewFile] = useState<{ id: number; name: string; type: string | null } | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);

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

  const handleDownload = async (id: number, name: string) => {
    setDownloadingId(id);
    setMsg("");
    try {
      await apiService.downloadFile(id, name);
      setMsg(`Archivo "${name}" descargado exitosamente`);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Error al descargar el archivo");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (id: number, name: string, type: string | null) => {
    setPreviewLoading(true);
    setPreviewFile({ id, name, type });
    setPreviewBlobUrl(null);
    setPreviewTextContent(null);
    try {
      const blob = await apiService.getFileBlob(id, true);
      const url = window.URL.createObjectURL(blob);
      setPreviewBlobUrl(url);

      const cleanType = type ? type.toLowerCase() : "";
      if (cleanType.startsWith("text/") || cleanType === "application/json" || cleanType === "application/javascript") {
        const text = await blob.text();
        setPreviewTextContent(text);
      }
    } catch (err) {
      console.error("Error loading preview:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewBlobUrl) {
      window.URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewFile(null);
    setPreviewBlobUrl(null);
    setPreviewTextContent(null);
  };

  const renderPreviewContent = () => {
    if (!previewFile) return null;
    const cleanType = previewFile.type ? previewFile.type.toLowerCase() : "";
    if (cleanType.startsWith("image/")) {
      return <img src={previewBlobUrl || ""} alt="Previsualización" style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: 4 }} />;
    } else if (cleanType === "application/pdf") {
      return <embed src={previewBlobUrl || ""} type="application/pdf" width="100%" height="550px" style={{ borderRadius: 4 }} />;
    } else if (cleanType.startsWith("video/")) {
      return <video src={previewBlobUrl || ""} controls style={{ maxWidth: "100%", maxHeight: "65vh", borderRadius: 4 }} />;
    } else if (cleanType.startsWith("audio/")) {
      return <audio src={previewBlobUrl || ""} controls style={{ width: "100%", marginTop: 20 }} />;
    } else if (previewTextContent !== null) {
      return <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", background: "#0F172A", color: "#F8FAFC", padding: 16, borderRadius: 8, maxHeight: "500px", width: "100%", overflow: "auto", fontFamily: "monospace", fontSize: 13, textAlign: "left" }}>{previewTextContent}</pre>;
    } else {
      return (
        <div style={{ textAlign: "center", padding: "30px 20px" }}>
          <p className="text-muted">Este tipo de archivo ({previewFile.type || "desconocido"}) no soporta previsualización directa en el navegador.</p>
          <a href={previewBlobUrl || ""} download={previewFile.name} className="btn-change-pass" style={{ display: "inline-block", textDecoration: "none", marginTop: 16 }}>Descargar para ver</a>
        </div>
      );
    }
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
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn-icon-secondary"
                        onClick={() => handlePreview(f.id_archivo, f.nombre_archivo, f.tipo_archivo)}
                        title="Previsualizar"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-icon-primary"
                        onClick={() => handleDownload(f.id_archivo, f.nombre_archivo)}
                        disabled={downloadingId === f.id_archivo}
                        title="Descargar"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        className="btn-icon-danger"
                        onClick={() => handleDelete(f.id_archivo, f.nombre_archivo)}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewFile && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content preview-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Previsualización: {previewFile.name}</h3>
              <button className="btn-close" onClick={closePreview}><X size={20} /></button>
            </div>
            <div className="modal-body preview-body">
              {previewLoading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <RefreshCw size={24} className="spin" />
                  <p className="text-muted">Cargando archivo...</p>
                </div>
              ) : previewBlobUrl ? (
                renderPreviewContent()
              ) : (
                <p className="text-muted">No se pudo cargar la previsualización del archivo.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadView() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    setLoading(true); setMsg(""); setError("");
    let successCount = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        setCurrentUploadIndex(i + 1);
        await apiService.uploadFile(files[i]);
        successCount++;
      }
      setMsg(`Se subieron exitosamente ${successCount} de ${files.length} archivos.`);
      setFiles([]);
      const input = document.getElementById("file-input") as HTMLInputElement;
      if (input) input.value = "";
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error al subir archivo";
      setError(`Se subieron ${successCount} archivos. Error en el siguiente: ${errMsg}`);
    } finally {
      setLoading(false);
      setCurrentUploadIndex(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    } else {
      setFiles([]);
    }
  };

  return (
    <div>
      <h2>Subir Archivos</h2>
      {error && <div className="alert alert-error"><AlertCircle size={16} /><span>{error}</span></div>}
      {msg && <div className="alert alert-success"><CheckCircle2 size={16} /><span>{msg}</span></div>}
      <div className="upload-card">
        <form onSubmit={handleUpload}>
          <div className="upload-zone">
            <UploadCloud size={48} strokeWidth={1.5} />
            <p>Selecciona uno o más archivos para subir</p>
            <input id="file-input" type="file" multiple onChange={handleFileChange} />
          </div>
          {files.length > 0 && (
            <div className="upload-files-list">
              <p style={{ margin: "0 0 8px 0", fontSize: 13, fontWeight: 600 }}>Archivos seleccionados ({files.length}):</p>
              {files.map((f, idx) => (
                <div key={idx} className="upload-file-item">
                  <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "70%" }}>{f.name}</span>
                  <span className="text-muted">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              ))}
            </div>
          )}
          <button type="submit" className="btn-change-pass" disabled={loading || files.length === 0} style={{ marginTop: 16 }}>
            {loading ? (
              <span>Subiendo... ({currentUploadIndex} de {files.length})</span>
            ) : (
              "Subir Archivos"
            )}
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
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Preview state
  const [previewFile, setPreviewFile] = useState<{ id: number; name: string; type: string | null } | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);

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

  const handleDownload = async (id: number, name: string) => {
    setDownloadingId(id);
    setMsg("");
    try {
      await apiService.downloadFile(id, name);
      setMsg(`Archivo "${name}" descargado exitosamente`);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Error al descargar el archivo");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (id: number, name: string, type: string | null) => {
    setPreviewLoading(true);
    setPreviewFile({ id, name, type });
    setPreviewBlobUrl(null);
    setPreviewTextContent(null);
    try {
      const blob = await apiService.getFileBlob(id, true);
      const url = window.URL.createObjectURL(blob);
      setPreviewBlobUrl(url);

      const cleanType = type ? type.toLowerCase() : "";
      if (cleanType.startsWith("text/") || cleanType === "application/json" || cleanType === "application/javascript") {
        const text = await blob.text();
        setPreviewTextContent(text);
      }
    } catch (err) {
      console.error("Error loading preview:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewBlobUrl) {
      window.URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewFile(null);
    setPreviewBlobUrl(null);
    setPreviewTextContent(null);
  };

  const renderPreviewContent = () => {
    if (!previewFile) return null;
    const cleanType = previewFile.type ? previewFile.type.toLowerCase() : "";
    if (cleanType.startsWith("image/")) {
      return <img src={previewBlobUrl || ""} alt="Previsualización" style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: 4 }} />;
    } else if (cleanType === "application/pdf") {
      return <embed src={previewBlobUrl || ""} type="application/pdf" width="100%" height="550px" style={{ borderRadius: 4 }} />;
    } else if (cleanType.startsWith("video/")) {
      return <video src={previewBlobUrl || ""} controls style={{ maxWidth: "100%", maxHeight: "65vh", borderRadius: 4 }} />;
    } else if (cleanType.startsWith("audio/")) {
      return <audio src={previewBlobUrl || ""} controls style={{ width: "100%", marginTop: 20 }} />;
    } else if (previewTextContent !== null) {
      return <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", background: "#0F172A", color: "#F8FAFC", padding: 16, borderRadius: 8, maxHeight: "500px", width: "100%", overflow: "auto", fontFamily: "monospace", fontSize: 13, textAlign: "left" }}>{previewTextContent}</pre>;
    } else {
      return (
        <div style={{ textAlign: "center", padding: "30px 20px" }}>
          <p className="text-muted">Este tipo de archivo ({previewFile.type || "desconocido"}) no soporta previsualización directa en el navegador.</p>
          <a href={previewBlobUrl || ""} download={previewFile.name} className="btn-change-pass" style={{ display: "inline-block", textDecoration: "none", marginTop: 16 }}>Descargar para ver</a>
        </div>
      );
    }
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
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn-icon-secondary"
                        onClick={() => handlePreview(f.id_archivo, f.nombre_archivo, f.tipo_archivo)}
                        title="Previsualizar"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-icon-primary"
                        onClick={() => handleDownload(f.id_archivo, f.nombre_archivo)}
                        disabled={downloadingId === f.id_archivo}
                        title="Descargar"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        className="btn-icon-danger"
                        onClick={() => handleDelete(f.id_archivo, f.nombre_archivo)}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewFile && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content preview-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Previsualización: {previewFile.name}</h3>
              <button className="btn-close" onClick={closePreview}><X size={20} /></button>
            </div>
            <div className="modal-body preview-body">
              {previewLoading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <RefreshCw size={24} className="spin" />
                  <p className="text-muted">Cargando archivo...</p>
                </div>
              ) : previewBlobUrl ? (
                renderPreviewContent()
              ) : (
                <p className="text-muted">No se pudo cargar la previsualización del archivo.</p>
              )}
            </div>
          </div>
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
