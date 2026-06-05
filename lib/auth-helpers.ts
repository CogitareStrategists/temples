import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

// Capability helpers (Super Admin inherits everything).
export const can = {
  manageUsers: (r: UserRole) => r === "super_admin",
  approveTemples: (r: UserRole) => r === "super_admin",
  addTemple: (r: UserRole) => r === "super_admin" || r === "temple_manager",
  suggestFields: (r: UserRole) => r === "super_admin" || r === "temple_manager",
  reviewSuggestions: (r: UserRole) => r === "super_admin",
  editAnyTemple: (r: UserRole) => r === "super_admin" || r === "temple_manager",
};
