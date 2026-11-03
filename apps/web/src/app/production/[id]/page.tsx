import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getProductionOrderById } from "../actions";
import { OrderDetail } from "./order-detail";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getProductionOrderById(id);
  if (!order) notFound();
  return (
    <div>
      <Header
        title={`작업지시: ${order.orderNumber}`}
        description={`${order.productName}${order.productLot ? ` — LOT: ${order.productLot}` : ""}`}
      />
      <OrderDetail order={order} />
    </div>
  );
}
