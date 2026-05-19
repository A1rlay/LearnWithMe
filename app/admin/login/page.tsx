import { redirect } from "next/navigation";

// Middleware redirects /admin/login → /login before this page renders.
// This component is unreachable in practice.
export default function AdminLoginPage() {
  redirect("/login");
}
