import { Header } from "@/components/layout/header";
import { getAlerts } from "./actions";
import { AlertsView } from "./alerts-view";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const data = await getAlerts();
  return (
    <div>
      <Header title="알림 센터" description="소비기한 임박, 재고부족, 부적합 발생 등 알림 관리" />
      <AlertsView data={data} />
    </div>
  );
}
