import { Header } from "@/components/layout/header";
import { getReceipts, getMaterialsForSelect, getSuppliersForSelect } from "./actions";
import { InboundTable } from "./inbound-table";

export const dynamic = "force-dynamic";

export default async function InboundPage() {
  const [receipts, materials, suppliers] = await Promise.all([
    getReceipts(),
    getMaterialsForSelect(),
    getSuppliersForSelect(),
  ]);
  return (
    <div>
      <Header title="입고 관리" description="원료 입고 등록 및 LOT 관리" />
      <InboundTable data={receipts} materials={materials} suppliers={suppliers} />
    </div>
  );
}
