import { cookies } from "next/headers";

export type Theme = "dark" | "light";

/** Dark is the brand default; light is opt-in from the header toggle. */
export async function getTheme(): Promise<Theme> {
  return (await cookies()).get("theme")?.value === "light" ? "light" : "dark";
}
