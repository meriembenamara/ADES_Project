import { API_BASE_URL } from "../constants/auth";

export async function apiRequest(path, { method = "GET", body, token } = {}) {
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

  const contentType = response.headers.get("content-type") || "";
  let data = {};
  let textBody = "";

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => ({}));
  } else {
    textBody = await response.text().catch(() => "");
    try {
      data = JSON.parse(textBody);
    } catch (e) {
      // leave data as {}
    }
  }

  if (!response.ok) {
    const message = data?.message || textBody || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export async function formDataRequest(path, { method = "POST", formData, token } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: formData,
  });

  const contentType = response.headers.get("content-type") || "";
  let data = {};
  let textBody = "";

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => ({}));
  } else {
    textBody = await response.text().catch(() => "");
    try {
      data = JSON.parse(textBody);
    } catch (e) {
      // ignore
    }
  }

  if (!response.ok) {
    const message = data?.message || textBody || `Request failed (${response.status})`;
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

export function uploadDocumentForLabeling(payload, token) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description ?? "");
  formData.append("status", payload.status ?? "draft");

  if (payload.class_key) {
    formData.append("class_key", payload.class_key);
  }

  if (payload.category_key) {
    formData.append("category_key", payload.category_key);
  }

  if (payload.created_by) {
    formData.append("created_by", String(payload.created_by));
  }

  if (payload.file) {
    formData.append("file", payload.file);
  }

  return formDataRequest("/documents", { method: "POST", formData, token });
}

export function deleteDocument(documentId, token) {
  return apiRequest(`/documents/${documentId}`, { method: "DELETE", token });
}

export function createLabeling(payload, token) {
  return apiRequest("/labelings", { method: "POST", body: payload, token });
}

export function createTrainingSample(payload, token) {
  return apiRequest("/training-samples", { method: "POST", body: payload, token });
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
