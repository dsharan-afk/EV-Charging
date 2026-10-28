import type { ChargingStation, ConnectorType, Vehicle } from "../types";

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
  } catch (error) {
    if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
      throw new ApiError(0, "REQUEST_ABORTED", "The request was cancelled or timed out.");
    }
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "The browser could not access the backend. Check the API URL, backend connection, and whether CORS allows this frontend origin.",
    );
  }

  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => ({})) as ApiErrorBody & T;
  if (!response.ok) {
    const detail = (payload as ApiErrorBody).error;
    const statusMessage = response.status === 401
      ? "Sign in to continue."
      : response.status === 403
        ? "You are not allowed to perform this action."
        : response.status === 422
          ? "Check the submitted fields."
          : response.status >= 500
            ? "The backend encountered an error. Please try again later."
            : `The request failed with status ${response.status}.`;
    throw new ApiError(
      response.status,
      detail?.code ?? "REQUEST_FAILED",
      detail?.message ?? statusMessage,
    );
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

export type ApiPaymentMethod = {
  id: string;
  type: "CARD" | "UPI";
  brand?: "Visa" | "Mastercard" | "Amex" | "RuPay";
  last4?: string;
  expMonth?: number;
  expYear?: number;
  upiId?: string;
  status: "DEMO_ONLY" | "UNVERIFIED";
  createdAt: string;
};

export type NewPaymentMethod =
  | {
      type: "CARD";
      brand: "Visa" | "Mastercard" | "Amex" | "RuPay";
      last4: string;
      expMonth: number;
      expYear: number;
    }
  | { type: "UPI"; upiId: string };

export type ApiVehicle = Omit<Vehicle, "vin"> & { vin?: string };
export type NewVehicle = Omit<Vehicle, "id" | "userId" | "isPrimary" | "photoUrl">;

export type ApiStationPort = {
  id: string;
  stationId: string;
  portNumber: number;
  connectorType: ConnectorType;
  maxPowerKw: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";
};

export type ApiStation = {
  id: string;
  name: string;
  operator: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  pricingPerKwh: number;
  parkingFeePerHour: number;
  amenities: string[];
  status: "OPERATIONAL" | "BUSY" | "MAINTENANCE";
  ports: ApiStationPort[];
};

export type ApiBooking = {
  id: string;
  bookingReference: string;
  vehicleId: string;
  stationId: string;
  portId: string;
  startsAt: string;
  endsAt: string;
  estimatedEnergyKwh: number;
  estimatedCost: number;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
};

export type CreateBookingInput = {
  vehicleId: string;
  stationId: string;
  portId: string;
  startsAt: string;
  durationMinutes: number;
  targetSocPercent: number;
};

export type CreatedBooking = ApiBooking;

export function toChargingStation(station: ApiStation): ChargingStation {
  const availablePorts = station.ports.filter((port) => port.status === "AVAILABLE").length;
  return {
    ...station,
    distanceKm: 0,
    totalPorts: station.ports.length,
    availablePorts,
    powerKw: Math.max(0, ...station.ports.map((port) => port.maxPowerKw)),
    rating: 0,
    reviewCount: 0,
  };
}

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

export function getWallet() {
  return apiRequest<{ balance: number; currency: "INR" }>("/wallet");
}

export function listPaymentMethods() {
  return apiRequest<{ items: ApiPaymentMethod[] }>("/payment-methods");
}

export function addPaymentMethod(input: NewPaymentMethod) {
  return apiRequest<ApiPaymentMethod>("/payment-methods", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function removePaymentMethod(id: string) {
  return apiRequest<void>(`/payment-methods/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function listStations(params: URLSearchParams = new URLSearchParams()) {
  const query = params.toString();
  return apiRequest<{ items: ApiStation[]; page: number; limit: number; total: number }>(
    `/stations${query ? `?${query}` : ""}`,
  );
}

export function listVehicles() {
  return apiRequest<{ items: ApiVehicle[] }>("/vehicles");
}

export function createVehicle(input: NewVehicle) {
  return apiRequest<Vehicle>("/vehicles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateVehicle(id: string, input: Partial<NewVehicle>) {
  return apiRequest<Vehicle>(`/vehicles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function setPrimaryVehicle(id: string) {
  return apiRequest<{ id: string; isPrimary: true }>(`/vehicles/${encodeURIComponent(id)}/primary`, {
    method: "POST",
  });
}

export function deleteVehicle(id: string) {
  return apiRequest<void>(`/vehicles/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function createBooking(input: CreateBookingInput) {
  return apiRequest<CreatedBooking>("/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listBookings() {
  return apiRequest<{ items: ApiBooking[] }>("/bookings");
}

export function cancelBooking(id: string) {
  return apiRequest<{ id: string; status: "CANCELLED" }>(`/bookings/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
  });
}
