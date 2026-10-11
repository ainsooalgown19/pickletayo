import { z } from "zod";

export const createOrganizationSchema = z.object({
  type: z.enum(["CLUB", "COURT_OPERATOR", "PLATFORM"]),
  legalName: z.string().trim().min(2).max(200),
  displayName: z.string().trim().min(2).max(160),
});
