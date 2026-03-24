import { redirect } from "next/navigation";

// The meetings list is on the main dashboard with search
// Redirect to /dashboard which shows the full list
export default function MeetingsPage() {
  redirect("/dashboard");
}
