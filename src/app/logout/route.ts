import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE } from "@/lib/session";

/**
 * Pages land here when the cookie is valid but its account no longer exists.
 * The middleware cannot see the database, so the stale cookie is dropped here
 * instead of bouncing between /login and /home forever.
 */
export async function GET() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);

  redirect("/login");
}
