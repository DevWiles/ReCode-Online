import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Only same-origin paths, so ?next= cannot bounce the user off the site
  const target = next?.startsWith("/") && !next.startsWith("//") ? next : "/home";

  return <LoginForm next={target} />;
}
