// --- USER — TYPES ---

export type UserRole = "user" | "admin" | "superadmin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
