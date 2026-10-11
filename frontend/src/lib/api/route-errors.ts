import { NextResponse } from "next/server";
import { AuthorizationError } from "@/modules/identity/application/authorization";
import { problem } from "./problem";

export class ApplicationError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
    this.name = "ApplicationError";
  }
}

export function routeError(cause: unknown): NextResponse {
  if (cause instanceof AuthorizationError || cause instanceof ApplicationError) {
    return problem(cause.status, cause.message, cause.code);
  }
  console.error(cause);
  return problem(500, "The request could not be completed.", "INTERNAL_ERROR");
}
