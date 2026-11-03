import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getReceiptById } from "../actions";
import { ReceiptDetail } from "./receipt-detail";

export const dynamic = "force-dynamic";

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const receipt = await getReceiptById(id);
  if (!receipt) notFound();
  return (
    <div>
      <Header
        title={`입고 상세: ${receipt.receiptNumber}`}
        description={`${receipt.material.name} — ${receipt.supplier.name}`}
      />
      <ReceiptDetail receipt={receipt} />
    </div>
  );
}
