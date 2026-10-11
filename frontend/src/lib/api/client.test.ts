import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./client";

describe("apiRequest", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("maps a legacy API failure to a typed error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ message: "Court unavailable", reference: "BK-42" }) }));
    await expect(apiRequest("/bookings")).rejects.toEqual(new ApiError(409, "Court unavailable", "BK-42"));
  });

  it("maps the backend problem response detail and trace id", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ detail: "Email or password is incorrect.", traceId: "trace-1" }) }));
    await expect(apiRequest("/auth/login")).rejects.toEqual(new ApiError(401, "Email or password is incorrect.", "trace-1"));
  });

  it("supports successful no-content responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 204 }));
    await expect(apiRequest("/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });
});
