export class ApiError extends Error {
  constructor(public status: number, message: string, public reference?: string) {
    super(message);
    this.name = "ApiError";
  }
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string; detail?: string; reference?: string; traceId?: string };
    throw new ApiError(response.status, body.detail ?? body.message ?? "Something went wrong", body.traceId ?? body.reference);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// Provisional discovery contract; replace from the backend OpenAPI document when available.
export type Facility = { id: string; name: string; area: string; distance: number; rating: number; courts: number; surface: string; indoor: boolean; price: number; image: string };
