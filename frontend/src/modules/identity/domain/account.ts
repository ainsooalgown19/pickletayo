import type { User } from "@supabase/supabase-js";

export type Account = {
  userId: string;
  email: string;
  emailVerified: boolean;
  givenName: string;
  familyName: string;
  status: "ACTIVE" | "PENDING_VERIFICATION";
  roles: string[];
  createdAt: string;
};

function stringMetadata(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function accountFromUser(user: User): Account {
  const rawRoles = user.app_metadata.roles;
  const roles = Array.isArray(rawRoles)
    ? rawRoles.filter((role): role is string => typeof role === "string")
    : typeof user.app_metadata.role === "string"
      ? [user.app_metadata.role]
      : ["PLAYER"];

  return {
    userId: user.id,
    email: user.email ?? "",
    emailVerified: Boolean(user.email_confirmed_at),
    givenName: stringMetadata(user.user_metadata.given_name ?? user.user_metadata.givenName),
    familyName: stringMetadata(user.user_metadata.family_name ?? user.user_metadata.familyName),
    status: user.email_confirmed_at ? "ACTIVE" : "PENDING_VERIFICATION",
    roles,
    createdAt: user.created_at,
  };
}
