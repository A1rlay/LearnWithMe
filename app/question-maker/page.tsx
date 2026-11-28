import { redirect } from "next/navigation";

// Activities are now browsed per subject, starting from the catalog.
export default function Page() {
  redirect("/#subjects");
}
