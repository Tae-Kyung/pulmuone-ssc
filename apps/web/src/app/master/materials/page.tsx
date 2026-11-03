import { Header } from "@/components/layout/header";
import { getMaterials } from "./actions";
import { getSuppliers } from "../suppliers/actions";
import { MaterialTable } from "./material-table";

export default async function MaterialsPage() {
  const [data, suppliers] = await Promise.all([getMaterials(), getSuppliers()]);
  return (
    <div>
      <Header title="원료 관리" description="원료 마스터 데이터 관리" />
      <MaterialTable data={data} suppliers={suppliers} />
    </div>
  );
}
