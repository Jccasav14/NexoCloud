const API_URL = "http://localhost:8000/api";

function getHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
}

function getJsonHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface FileItem {
  id_archivo: number;
  id_usuario: number;
  nombre_archivo: string;
  tipo_archivo: string | null;
  tamano: number;
  ruta_s3: string;
  fecha_subida: string;
  nombre_usuario?: string | null;
}

export interface EventItem {
  id_evento: number;
  id_usuario: number;
  tipo_evento: string;
  descripcion: string;
  fecha_evento: string;
  nombre_usuario?: string | null;
}

export interface UserItem {
  id_usuario: number;
  id_rol: number;
  nombre: string;
  correo: string;
  estado: string;
  fecha_registro: string;
}

export const apiService = {
  async uploadFile(file: File): Promise<FileItem> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/files/upload`, {
      method: "POST",
      headers: getHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error al subir archivo");
    }
    return res.json();
  },

  async getMyFiles(): Promise<FileItem[]> {
    const res = await fetch(`${API_URL}/files/my-files`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Error al obtener archivos");
    return res.json();
  },

  async deleteMyFile(fileId: number): Promise<void> {
    const res = await fetch(`${API_URL}/files/${fileId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error al eliminar archivo");
    }
  },

  async getAllUsers(): Promise<UserItem[]> {
    const res = await fetch(`${API_URL}/admin/users`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Error al obtener usuarios");
    return res.json();
  },

  async deactivateUser(userId: number): Promise<void> {
    const res = await fetch(`${API_URL}/admin/users/${userId}/deactivate`, {
      method: "PUT",
      headers: getJsonHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error al desactivar usuario");
    }
  },

  async activateUser(userId: number): Promise<void> {
    const res = await fetch(`${API_URL}/admin/users/${userId}/activate`, {
      method: "PUT",
      headers: getJsonHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error al activar usuario");
    }
  },

  async changeUserRole(userId: number, roleId: number): Promise<void> {
    const res = await fetch(`${API_URL}/admin/users/${userId}/role/${roleId}`, {
      method: "PUT",
      headers: getJsonHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error al cambiar rol");
    }
  },

  async getAllFiles(): Promise<FileItem[]> {
    const res = await fetch(`${API_URL}/admin/files`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Error al obtener archivos");
    return res.json();
  },

  async adminDeleteFile(fileId: number): Promise<void> {
    const res = await fetch(`${API_URL}/admin/files/${fileId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error al eliminar archivo");
    }
  },

  async getAuditEvents(): Promise<EventItem[]> {
    const res = await fetch(`${API_URL}/admin/events`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Error al obtener eventos");
    return res.json();
  },

  async getAuditEventsForAuditor(): Promise<EventItem[]> {
    const res = await fetch(`${API_URL}/audit/events`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Error al obtener eventos");
    return res.json();
  },
};
