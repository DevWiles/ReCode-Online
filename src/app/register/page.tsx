import RegisterForm from "@/components/auth/RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;

  // Invite links arrive as /register?invite=XXXX-XXXX-XXXX
  return <RegisterForm invite={invite?.slice(0, 32) ?? ""} />;
}
