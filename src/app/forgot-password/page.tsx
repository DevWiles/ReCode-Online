import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { redirect } from "next/navigation";

import { isDemoMode } from "@/lib/demo";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  // No registration or password recovery on the demo instance
  if (isDemoMode) redirect("/login");

  const { account } = await searchParams;

  // The login form links here with the account it was trying, when rate limited
  return <ForgotPasswordForm account={account?.slice(0, 254) ?? ""} />;
}
