const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// Auth
export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request("/api/auth/logout", { method: "POST" }),

  getMe: () => request<any>("/api/auth/me"),

  // Hosted Zones
  listZones: (params: { search?: string; page?: number; page_size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.page) q.set("page", String(params.page));
    if (params.page_size) q.set("page_size", String(params.page_size));
    return request<{
      zones: any[];
      total: number;
      page: number;
      page_size: number;
    }>(`/api/hosted-zones?${q}`);
  },

  getZone: (id: string) => request<any>(`/api/hosted-zones/${id}`),

  createZone: (data: { name: string; type?: string; comment?: string }) =>
    request<any>("/api/hosted-zones", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateZone: (id: string, data: { comment?: string }) =>
    request<any>(`/api/hosted-zones/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteZone: (id: string) =>
    request(`/api/hosted-zones/${id}`, { method: "DELETE" }),

  // Records
  listRecords: (
    zoneId: string,
    params: { search?: string; record_type?: string; page?: number; page_size?: number } = {}
  ) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.record_type) q.set("record_type", params.record_type);
    if (params.page) q.set("page", String(params.page));
    if (params.page_size) q.set("page_size", String(params.page_size));
    return request<{
      records: any[];
      total: number;
      page: number;
      page_size: number;
    }>(`/api/hosted-zones/${zoneId}/records?${q}`);
  },

  createRecord: (
    zoneId: string,
    data: { name: string; type: string; value: string; ttl?: number; routing_policy?: string }
  ) =>
    request<any>(`/api/hosted-zones/${zoneId}/records`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateRecord: (
    zoneId: string,
    recordId: string,
    data: { value?: string; ttl?: number; routing_policy?: string }
  ) =>
    request<any>(`/api/hosted-zones/${zoneId}/records/${recordId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteRecord: (zoneId: string, recordId: string) =>
    request(`/api/hosted-zones/${zoneId}/records/${recordId}`, { method: "DELETE" }),
};
