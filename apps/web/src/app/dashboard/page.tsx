import { Header } from "@/components/layout/header";
import { getDashboardData } from "./actions";
import { DashboardView } from "./dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return (
    <div>
      <Header title="통합 대시보드" description="AI-OCR 기반 품질 자율관리 플랫폼" />
      <DashboardView data={data} />
    </div>
  );
}
