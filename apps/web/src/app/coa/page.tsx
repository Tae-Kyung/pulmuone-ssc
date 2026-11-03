import { Header } from "@/components/layout/header";
import { getCoaInspections } from "./actions";
import { CoaTable } from "./coa-table";

export const dynamic = "force-dynamic";

export default async function CoaPage() {
  const inspections = await getCoaInspections();
  return (
    <div>
      <Header title="COA 검수 현황" description="AI-OCR 기반 원료 성적서 자동 검수" />
      <CoaTable data={inspections} />
    </div>
  );
}
