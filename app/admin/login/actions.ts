"use server";

// Kept for backwards compatibility — login is now handled at /login
// Middleware redirects /admin/login → /login, so these are not called in practice.

export { logoutAction } from "@/app/login/actions";
