import LoginForm from "@/components/auth/LoginForm";
import DemoLogin from "@/components/auth/DemoLogin";
import { DEMO_UPSTREAM_URL, isDemoMode } from "@/lib/demo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Only same-origin paths, so ?next= cannot bounce the user off the site
  const target = next?.startsWith("/") && !next.startsWith("//") ? next : "/home";

  // The demo instance has no accounts to sign into, only fresh sandboxes
  if (isDemoMode) return <DemoLogin next={target} upstreamUrl={DEMO_UPSTREAM_URL} />;

  return <LoginForm next={target} />;
}
