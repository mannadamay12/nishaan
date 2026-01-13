import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to login for now - will add proper landing page later if needed
  redirect("/login");
}
