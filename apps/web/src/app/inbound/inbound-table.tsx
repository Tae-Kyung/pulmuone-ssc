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
import { createReceipt } from "./actions";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Receipt = {
  id: string;
  receiptNumber: string;
  materialId: string;
  supplierId: string;
  receivedDate: string;
  totalQuantity: string;
  unit: string;
  status: string | null;
  notes: string | null;
  createdAt: Date | null;
  material: { id: string; code: string; name: string };
  supplier: { id: string; code: string; name: string };
  lots: { id: string; lotNumber: string; status: string | null }[];
};

type Material = { id: string; code: string; name: string; unit: string };
type Supplier = { id: string; code: string; name: string };

const statusMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  pending: { label: "대기", variant: "secondary" },
  inspecting: { label: "검수 중", variant: "warning" },
  approved: { label: "승인", variant: "success" },
  rejected: { label: "반려", variant: "destructive" },
};

const columns: ColumnDef<Receipt, unknown>[] = [
  { accessorKey: "receiptNumber", header: "입고번호" },
  {
    id: "material",
    header: "원료",
    cell: ({ row }) => `${row.original.material.name} (${row.original.material.code})`,
  },
  {
    id: "supplier",
    header: "공급업체",
    cell: ({ row }) => row.original.supplier.name,
  },
  {
    accessorKey: "receivedDate",
    header: "입고일",
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
  {
    id: "qty",
    header: "수량",
    cell: ({ row }) => `${row.original.totalQuantity} ${row.original.unit}`,
  },
  {
    id: "lotCount",
    header: "LOT 수",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.lots.length}건</Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "상태",
    cell: ({ getValue }) => {
      const s = statusMap[(getValue() as string) ?? "pending"];
      return <Badge variant={s?.variant ?? "secondary"}>{s?.label ?? getValue()}</Badge>;
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/inbound/${row.original.id}`}>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-1" /> 상세
        </Button>
      </Link>
    ),
  },
];

export function InboundTable({
  data,
  materials,
  suppliers,
}: {
  data: Receipt[];
  materials: Material[];
  suppliers: Supplier[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> 입고 등록
        </Button>
      </div>
      <DataTable columns={columns} data={data} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogClose onClose={() => setOpen(false)} />
        <DialogHeader>
          <DialogTitle>입고 등록</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const d = Object.fromEntries(fd.entries()) as Record<string, string>;
            try {
              const receipt = await createReceipt({
                materialId: d.materialId,
                supplierId: d.supplierId,
                receivedDate: d.receivedDate,
                totalQuantity: d.totalQuantity,
                unit: d.unit,
                notes: d.notes,
              });
              toast.success(`입고 등록 완료: ${receipt.receiptNumber}`);
              setOpen(false);
            } catch (err) {
              toast.error("오류: " + (err instanceof Error ? err.message : "Unknown"));
            }
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>원료 *</Label>
              <Select
                name="materialId"
                required
                onChange={(e) => {
                  const m = materials.find((x) => x.id === e.target.value);
                  setSelectedMaterial(m ?? null);
                }}
              >
                <option value="">선택</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>공급업체 *</Label>
              <Select name="supplierId" required>
                <option value="">선택</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>입고일 *</Label>
              <Input name="receivedDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div>
              <Label>입고 수량 *</Label>
              <div className="flex gap-2">
                <Input name="totalQuantity" type="number" step="0.001" required className="flex-1" />
                <Input
                  name="unit"
                  required
                  className="w-20"
                  defaultValue={selectedMaterial?.unit ?? ""}
                  value={selectedMaterial?.unit ?? undefined}
                  readOnly={!!selectedMaterial}
                />
              </div>
            </div>
            <div className="col-span-2">
              <Label>비고</Label>
              <Input name="notes" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit">입고 등록</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
