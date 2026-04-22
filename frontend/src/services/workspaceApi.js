import { API_BASE_URL } from "../constants/auth";

async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || "Request failed.";
    throw new Error(message);
  }

  return data;
}

export function fetchDashboards(token) {
  return apiRequest("/dashboards", { token });
}

export function fetchUsers(token) {
  return apiRequest("/users", { token });
}

export function deleteUser(userId, token) {
  return apiRequest(`/users/${userId}`, { method: "DELETE", token });
}

export function fetchDocuments(token) {
  return apiRequest("/documents", { token });
}

export function createDocument(payload, token) {
  return apiRequest("/documents", { method: "POST", body: payload, token });
}

export function deleteDocument(documentId, token) {
  return apiRequest(`/documents/${documentId}`, { method: "DELETE", token });
}

export function fetchControlPoints(token) {
  return apiRequest("/control-points", { token });
}

export function createControlPoint(payload, token) {
  return apiRequest("/control-points", { method: "POST", body: payload, token });
}

export function deleteControlPoint(controlPointId, token) {
  return apiRequest(`/control-points/${controlPointId}`, { method: "DELETE", token });
}
