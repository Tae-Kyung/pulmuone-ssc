import { Header } from "@/components/layout/header";
import { getSpecs } from "./actions";
import { getMaterials } from "../materials/actions";
import { SpecTable } from "./spec-table";

export default async function SpecsPage() {
  const [specs, materials] = await Promise.all([getSpecs(), getMaterials()]);
  return (
    <div>
      <Header title="규격 관리" description="원료별 검수 규격 (COA 자동비교용 Rule)" />
      <SpecTable data={specs} materials={materials} />
    </div>
  );
}
