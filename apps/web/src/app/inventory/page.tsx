import { Header } from "@/components/layout/header";
import { getInventory, getExpiringLots } from "./actions";
import { getLocations } from "../master/locations/actions";
import { InventoryView } from "./inventory-view";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [inventoryData, expiringLots, locations] = await Promise.all([
    getInventory(),
    getExpiringLots(30),
    getLocations(),
  ]);
  return (
    <div>
      <Header title="재고 관리" description="원료별/LOT별/Location별 실시간 재고 현황" />
      <InventoryView data={inventoryData} expiringLots={expiringLots} locations={locations} />
    </div>
  );
}
