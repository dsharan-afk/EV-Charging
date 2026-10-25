const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");

type ApiErrorBody = { error?: { code?: string; message?: string } };

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(0, "API_NOT_CONFIGURED", "Backend URL is not configured. Set VITE_API_BASE_URL and rebuild the frontend.");
  }

  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
      ...options,
      headers,
      credentials: "omit",
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the backend. Check your connection and try again.");
  }

  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => ({})) as ApiErrorBody & T;
  if (!response.ok) {
    const detail = (payload as ApiErrorBody).error;
    throw new ApiError(response.status, detail?.code ?? "REQUEST_FAILED", detail?.message ?? "The request failed.");
  }
  return payload as T;
}

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "CUSTOMER" | "ADMIN";
  walletBalance: number;
};

export async function register(input: { name: string; email: string; password: string; phone?: string }) {
  const result = await apiRequest<{ token: string; user: ApiUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setAccessToken(result.token);
  return result.user;
}

export async function login(input: { email: string; password: string }) {
  const result = await apiRequest<{ token: string; user: ApiUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setAccessToken(result.token);
  return result.user;
}

export function logout() {
  // Access token deliberately stays in memory only; page reload requires sign-in again.
  setAccessToken(null);
}

export function getCurrentUser() {
  return apiRequest<ApiUser>("/me");
}

export function listStations(params: URLSearchParams = new URLSearchParams()) {
  const query = params.toString();
  return apiRequest<{ items: unknown[]; page: number; limit: number; total: number }>(
    `/stations${query ? `?${query}` : ""}`,
  );
}

export function listVehicles() {
  return apiRequest<{ items: unknown[] }>("/vehicles");
}

export function listBookings() {
  return apiRequest<{ items: unknown[] }>("/bookings");
}
