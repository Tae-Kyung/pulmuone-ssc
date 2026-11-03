"use client";

import { useState } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Plus, Eye } from "lucide-react";
import { createProductionOrder } from "./actions";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  productLot: string | null;
  plannedDate: string;
  status: string | null;
  requiredMaterials: { material: { name: string; code: string }; requiredQty: string; unit: string }[];
  inputs: { id: string }[];
};

type Material = { id: string; code: string; name: string; unit: string };

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  planned: { label: "계획", variant: "secondary" },
  in_progress: { label: "진행 중", variant: "warning" },
  completed: { label: "완료", variant: "success" },
  cancelled: { label: "취소", variant: "destructive" },
};

const columns: ColumnDef<Order, unknown>[] = [
  { accessorKey: "orderNumber", header: "작업지시번호" },
  { accessorKey: "productName", header: "제품명" },
  { accessorKey: "productLot", header: "제품 LOT" },
  {
    accessorKey: "plannedDate",
    header: "생산 예정일",
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
  {
    id: "materials",
    header: "필요 원료",
    cell: ({ row }) => (
      <div className="text-xs">
        {row.original.requiredMaterials.map((m, i) => (
          <span key={i}>
            {i > 0 && ", "}
            {m.material.name} ({m.requiredQty}{m.unit})
          </span>
        ))}
      </div>
    ),
  },
  {
    id: "inputCount",
    header: "투입 건",
    cell: ({ row }) => <Badge variant="outline">{row.original.inputs.length}건</Badge>,
  },
  {
    accessorKey: "status",
    header: "상태",
    cell: ({ getValue }) => {
      const s = statusMap[(getValue() as string) ?? "planned"];
      return <Badge variant={s?.variant ?? "secondary"}>{s?.label ?? getValue()}</Badge>;
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/production/${row.original.id}`}>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-1" /> 상세
        </Button>
      </Link>
    ),
  },
];

export function ProductionView({ orders, materials }: { orders: Order[]; materials: Material[] }) {
  const [open, setOpen] = useState(false);
  const [bomItems, setBomItems] = useState<{ materialId: string; requiredQty: string; unit: string }[]>([
    { materialId: "", requiredQty: "", unit: "" },
  ]);

  function addBomItem() {
    setBomItems([...bomItems, { materialId: "", requiredQty: "", unit: "" }]);
  }

  function updateBomItem(index: number, field: string, value: string) {
    setBomItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "materialId") {
          const mat = materials.find((m) => m.id === value);
          if (mat) updated.unit = mat.unit;
        }
        return updated;
      })
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> 작업지시 등록
        </Button>
      </div>
      <DataTable columns={columns} data={orders} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogClose onClose={() => setOpen(false)} />
        <DialogHeader>
          <DialogTitle>작업지시 등록</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            try {
              const order = await createProductionOrder({
                productName: fd.get("productName") as string,
                productLot: fd.get("productLot") as string,
                plannedDate: fd.get("plannedDate") as string,
                materials: bomItems.filter((b) => b.materialId && b.requiredQty),
              });
              toast.success(`작업지시 등록: ${order.orderNumber}`);
              setOpen(false);
              setBomItems([{ materialId: "", requiredQty: "", unit: "" }]);
            } catch (err) {
              toast.error("오류: " + (err instanceof Error ? err.message : "Unknown"));
            }
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>제품명 *</Label>
              <Input name="productName" required />
            </div>
            <div>
              <Label>제품 LOT</Label>
              <Input name="productLot" />
            </div>
            <div>
              <Label>생산 예정일 *</Label>
              <Input name="plannedDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>필요 원료 (BOM)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addBomItem}>
                + 추가
              </Button>
            </div>
            {bomItems.map((item, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <Select
                  value={item.materialId}
                  onChange={(e) => updateBomItem(i, "materialId", e.target.value)}
                >
                  <option value="">원료 선택</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="수량"
                  value={item.requiredQty}
                  onChange={(e) => updateBomItem(i, "requiredQty", e.target.value)}
                />
                <Input value={item.unit} readOnly placeholder="단위" />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit">등록</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
