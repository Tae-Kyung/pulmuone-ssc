import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getCoaById } from "../actions";
import { CoaDetailView } from "./coa-detail-view";

export const dynamic = "force-dynamic";

export default async function CoaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inspection = await getCoaById(id);
  if (!inspection) notFound();
  return (
    <div>
      <Header
        title="COA 검수 상세"
        description={`${inspection.material.name} — LOT: ${inspection.lot.lotNumber}`}
      />
      <CoaDetailView inspection={inspection} />
    </div>
  );
}
