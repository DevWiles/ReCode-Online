import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account } = await searchParams;

  // The login form links here with the account it was trying, when rate limited
  return <ForgotPasswordForm account={account?.slice(0, 254) ?? ""} />;
}
