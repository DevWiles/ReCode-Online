import MainLayout from "@/components/layout/MainLayout";
import DemoBanner from "@/components/demo/DemoBanner";
import { isDemoMode } from "@/lib/demo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MainLayout banner={isDemoMode ? <DemoBanner /> : null}>{children}</MainLayout>
    </>
  );
}
