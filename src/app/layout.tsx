import type { Metadata } from "next";
import { headers } from "next/headers";
import "@/styles/globals.css";

import { prisma } from "@/lib/db";
import OnboardingPage from "@/app/onboarding/page";
import DashboardStateInitializer from "@/components/layout/DashboardStateInitializer";

export const metadata: Metadata = {
  title: "ReCode",
  description:
    "A problem-solving progress management tool based on the Ebbinghaus Forgetting Curve",
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The middleware forwards the path so the login screen is never replaced by
  // onboarding while nobody is signed in
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAuthRoute = pathname.startsWith("/login");

  const user = isAuthRoute ? null : await prisma.user.findFirst();

  return (
    <html lang="zh-CN">
      <body className="antialiased bg-gray-50 text-gray-900 selection:bg-[#ffa116] selection:text-white">
        {isAuthRoute ? (
          children
        ) : user ? (
          <>
            <DashboardStateInitializer user={user} />
            {children}
          </>
        ) : (
          <OnboardingPage />
        )}
      </body>
    </html>
  );
}
