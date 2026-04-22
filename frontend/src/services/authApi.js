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
    const message =
      data?.message ||
      data?.errors?.email?.[0] ||
      data?.errors?.password?.[0] ||
      "Request failed.";
    throw new Error(message);
  }

  return data;
}

export function signUp(payload) {
  return apiRequest("/auth/sign-up", { method: "POST", body: payload });
}

export function signIn(payload) {
  return apiRequest("/auth/sign-in", { method: "POST", body: payload });
}

export function fetchCurrentUser(token) {
  return apiRequest("/auth/me", { token });
}

export function signOut(token) {
  return apiRequest("/auth/sign-out", { method: "POST", token });
}
