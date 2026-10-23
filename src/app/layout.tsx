import type { Metadata } from "next";
import { headers } from "next/headers";
import "@/styles/globals.css";

import { requireUser } from "@/lib/auth";
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
  // The middleware forwards the path so the login screen, which has no
  // signed-in user to load, can skip the lookup
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAuthRoute = pathname.startsWith("/login");

  const user = isAuthRoute ? null : await requireUser();

  return (
    <html lang="zh-CN">
      <body className="antialiased bg-gray-50 text-gray-900 selection:bg-[#ffa116] selection:text-white">
        {user && <DashboardStateInitializer user={user} />}
        {children}
      </body>
    </html>
  );
}
