import { Header } from "@/components/layout/header";
import { getSpecsForMaterial } from "../actions";
import { CoaNewForm } from "./coa-new-form";

export const dynamic = "force-dynamic";

export default async function CoaNewPage({
  searchParams,
}: {
  searchParams: Promise<{ lotId?: string; materialId?: string }>;
}) {
  const { lotId, materialId } = await searchParams;

  if (!lotId || !materialId) {
    return (
      <div>
        <Header title="COA 검수" description="입고 상세에서 LOT를 선택하여 COA 검수를 진행하세요." />
        <p className="text-muted-foreground">lotId 및 materialId 파라미터가 필요합니다.</p>
      </div>
    );
  }

  const specs = await getSpecsForMaterial(materialId);

  return (
    <div>
      <Header title="COA 검수 등록" description="시험성적서 업로드 및 검수 항목 입력" />
      <CoaNewForm lotId={lotId} materialId={materialId} specs={specs} />
    </div>
  );
}
