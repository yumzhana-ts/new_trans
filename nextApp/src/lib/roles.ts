export const AVAILABLE_ROLES = ["admin", "user"] as const;

export type AppRole = (typeof AVAILABLE_ROLES)[number];

export function isValidRole(value: unknown): value is AppRole {
  return typeof value === "string" && AVAILABLE_ROLES.includes(value as AppRole);
}
