const API_URL = import.meta.env.DEV ? "http://localhost:8000/api" : "/api";

export interface UserResponse {
  id_usuario: number;
  id_rol: number;
  nombre: string;
  correo: string;
  estado: string;
  fecha_registro: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const authService = {
  async login(correo: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append("username", correo);
    formData.append("password", password);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Error al iniciar sesión");
    }

    const data: LoginResponse = await res.json();
    localStorage.setItem("token", data.access_token);
    return data;
  },

  async register(nombre: string, correo: string, password: string): Promise<UserResponse> {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, correo, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Error al registrar usuario");
    }

    return res.json();
  },

  async getMe(): Promise<UserResponse> {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error("No autenticado");
    }

    return res.json();
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Error al cambiar contraseña");
    }
  },

  logout() {
    localStorage.removeItem("token");
  },

  getToken(): string | null {
    return localStorage.getItem("token");
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  },

  getRoleNameById(id: number): string {
    const roles: Record<number, string> = {
      1: "Administrador",
      2: "Usuario empresarial",
      3: "Supervisor/Auditor",
    };
    return roles[id] || "Sin rol";
  },
};
