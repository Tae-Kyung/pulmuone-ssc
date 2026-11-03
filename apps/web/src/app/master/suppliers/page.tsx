import { Header } from "@/components/layout/header";
import { getSuppliers } from "./actions";
import { SupplierTable } from "./supplier-table";

export default async function SuppliersPage() {
  const data = await getSuppliers();
  return (
    <div>
      <Header title="공급업체 관리" description="원료 공급업체 마스터 데이터 관리" />
      <SupplierTable data={data} />
    </div>
  );
}
