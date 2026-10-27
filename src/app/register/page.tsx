import RegisterForm from "@/components/auth/RegisterForm";
import { redirect } from "next/navigation";

import { isDemoMode } from "@/lib/demo";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  // No registration or password recovery on the demo instance
  if (isDemoMode) redirect("/login");

  const { invite } = await searchParams;

  // Invite links arrive as /register?invite=XXXX-XXXX-XXXX
  return <RegisterForm invite={invite?.slice(0, 32) ?? ""} />;
}
