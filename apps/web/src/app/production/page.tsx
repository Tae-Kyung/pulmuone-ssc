import { Header } from "@/components/layout/header";
import { getProductionOrders } from "./actions";
import { getMaterials } from "../master/materials/actions";
import { ProductionView } from "./production-view";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const [orders, materials] = await Promise.all([getProductionOrders(), getMaterials()]);
  return (
    <div>
      <Header title="생산 관리" description="작업지시 및 원료 투입 관리" />
      <ProductionView orders={orders} materials={materials} />
    </div>
  );
}
