export type UserRole = "visitor" | "director" | "moderator";

export function parseUserRole(value: string | null | undefined): UserRole | null {
  if (value === "visitor" || value === "director" || value === "moderator") {
    return value;
  }
  if (value === "author") return "director";
  if (value === "viewer") return "visitor";
  return null;
}

export function roleFromUserMetadata(metadata: unknown): UserRole | null {
  if (!metadata || typeof metadata !== "object") return null;
  const role = (metadata as { role?: unknown }).role;
  return typeof role === "string" ? parseUserRole(role) : null;
}

export function isPathAllowed(role: UserRole | null, path: string) {
  if (path.startsWith("/moderator")) return role === "moderator";
  if (path === "/director" || path === "/director/") return true;
  if (path.startsWith("/director")) {
    return role === "director" || role === "moderator";
  }
  return true;
}

export function postLoginPath(role: UserRole | null, next?: string | null) {
  if (next && next.startsWith("/") && !next.startsWith("//") && isPathAllowed(role, next)) {
    return next;
  }
  if (role === "moderator") return "/moderator";
  if (role === "director") return "/director/my";
  return "/";
}
