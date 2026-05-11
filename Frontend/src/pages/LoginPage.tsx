import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { authService } from "../services/authService";
import "./LoginPage.css";

interface LoginPageProps {
  onLoginSuccess: () => void | Promise<void>;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await authService.login(loginEmail, loginPassword);
      await onLoginSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (regPassword !== regConfirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (regPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await authService.register(regName, regEmail, regPassword);
      setSuccess("Cuenta creada exitosamente. Ahora puedes iniciar sesión.");
      setActiveTab("login");
      setLoginEmail(regEmail);
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegConfirm("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-login-container">
      {/* Lado Izquierdo: Formulario */}
      <div className="split-left">
        <div className="login-form-wrapper">
          
          <div className="split-brand">
            <img src="/logo.png" alt="NexoCloud Logo" />
            <span>NEXOCLOUD</span>
          </div>

          <div className="login-header">
            <h2>{activeTab === "login" ? "Bienvenido de nuevo" : "Crear cuenta"}</h2>
            <p>
              {activeTab === "login"
                ? "Ingresa tus credenciales para acceder a tu panel."
                : "Únete a la plataforma líder de gestión empresarial."}
            </p>
          </div>

          <div className="split-tabs">
            <button
              className={`split-tab ${activeTab === "login" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("login");
                clearMessages();
              }}
            >
              Iniciar sesión
            </button>
            <button
              className={`split-tab ${activeTab === "register" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("register");
                clearMessages();
              }}
            >
              Registrarse
            </button>
          </div>

          {error && (
            <div className="alert alert-error" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="alert alert-success" style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #86EFAC" }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          {activeTab === "login" ? (
            <form onSubmit={handleLogin}>
              <div className="light-form-group">
                <label className="light-form-label">Correo electrónico</label>
                <div className="light-input-wrapper">
                  <span className="light-input-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    className="light-input"
                    placeholder="tu@empresa.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="light-form-group">
                <label className="light-form-label">Contraseña</label>
                <div className="light-input-wrapper">
                  <span className="light-input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className="light-input"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="light-toggle-password"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                id="btn-login"
                type="submit"
                className="light-btn-submit"
                disabled={loading}
              >
                {loading && <span className="spinner" />}
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="light-form-group">
                <label className="light-form-label">Nombre completo</label>
                <div className="light-input-wrapper">
                  <span className="light-input-icon">
                    <User size={18} />
                  </span>
                  <input
                    id="register-name"
                    type="text"
                    className="light-input"
                    placeholder="Juan Pérez"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="light-form-group">
                <label className="light-form-label">Correo electrónico</label>
                <div className="light-input-wrapper">
                  <span className="light-input-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    id="register-email"
                    type="email"
                    className="light-input"
                    placeholder="tu@empresa.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="light-form-group">
                <label className="light-form-label">Contraseña</label>
                <div className="light-input-wrapper">
                  <span className="light-input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    className="light-input"
                    placeholder="Mínimo 6 caracteres"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="light-toggle-password"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="light-form-group">
                <label className="light-form-label">Confirmar contraseña</label>
                <div className="light-input-wrapper">
                  <span className="light-input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    id="register-confirm"
                    type="password"
                    className="light-input"
                    placeholder="Repite la contraseña"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                id="btn-register"
                type="submit"
                className="light-btn-submit"
                disabled={loading}
              >
                {loading && <span className="spinner" />}
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Lado Derecho: Imagen abstracta de alta resolución */}
      <div className="split-right">
        <div className="split-right-content">
          <div className="split-quote">
            <h3>Gestión en la nube de alto rendimiento.</h3>
            <p>Infraestructura segura, administración de roles y auditoría completa de nivel empresarial.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
