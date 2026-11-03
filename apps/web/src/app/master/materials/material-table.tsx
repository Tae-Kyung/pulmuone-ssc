"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";
import { createMaterial, updateMaterial, deleteMaterial } from "./actions";
import { toast } from "sonner";
import { STORAGE_TYPE } from "@ssc/shared";

type Material = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  unit: string;
  supplierId: string | null;
  storageType: string | null;
  shelfLifeDays: number | null;
  safetyStock: string | null;
  isActive: boolean | null;
  supplier: { id: string; name: string } | null;
};

type Supplier = { id: string; name: string; code: string };

const storageLabels: Record<string, string> = {
  ambient: "상온",
  cold: "냉장",
  frozen: "냉동",
};

const columns: ColumnDef<Material, unknown>[] = [
  { accessorKey: "code", header: "원료코드" },
  { accessorKey: "name", header: "원료명" },
  { accessorKey: "category", header: "분류" },
  { accessorKey: "unit", header: "단위" },
  {
    id: "supplier",
    header: "공급업체",
    cell: ({ row }) => row.original.supplier?.name ?? "-",
  },
  {
    accessorKey: "storageType",
    header: "보관조건",
    cell: ({ getValue }) => storageLabels[(getValue() as string) ?? "ambient"] ?? getValue(),
  },
  { accessorKey: "shelfLifeDays", header: "유통기한(일)" },
  { accessorKey: "safetyStock", header: "안전재고" },
  {
    accessorKey: "isActive",
    header: "상태",
    cell: ({ getValue }) =>
      getValue() ? <Badge variant="success">활성</Badge> : <Badge variant="secondary">비활성</Badge>,
  },
];

export function MaterialTable({ data, suppliers }: { data: Material[]; suppliers: Supplier[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);

  const columnsWithActions: ColumnDef<Material, unknown>[] = [
    ...columns,
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => { setEditing(row.original); setOpen(true); }}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> 원료 등록
        </Button>
      </div>
      <DataTable columns={columnsWithActions} data={data} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogClose onClose={() => setOpen(false)} />
        <DialogHeader>
          <DialogTitle>{editing ? "원료 수정" : "원료 등록"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const d = Object.fromEntries(fd.entries()) as Record<string, string>;
            try {
              if (editing) {
                await updateMaterial(editing.id, d);
                toast.success("수정되었습니다.");
              } else {
                await createMaterial(d as { code: string; name: string; unit: string });
                toast.success("등록되었습니다.");
              }
              setOpen(false);
            } catch (err) {
              toast.error("오류: " + (err instanceof Error ? err.message : "Unknown"));
            }
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>원료코드 *</Label>
              <Input name="code" required defaultValue={editing?.code ?? ""} />
            </div>
            <div>
              <Label>원료명 *</Label>
              <Input name="name" required defaultValue={editing?.name ?? ""} />
            </div>
            <div>
              <Label>분류</Label>
              <Input name="category" defaultValue={editing?.category ?? ""} />
            </div>
            <div>
              <Label>단위 *</Label>
              <Input name="unit" required placeholder="kg, L, EA" defaultValue={editing?.unit ?? ""} />
            </div>
            <div>
              <Label>공급업체</Label>
              <Select name="supplierId" defaultValue={editing?.supplierId ?? ""}>
                <option value="">선택안함</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>보관조건</Label>
              <Select name="storageType" defaultValue={editing?.storageType ?? "ambient"}>
                <option value={STORAGE_TYPE.AMBIENT}>상온</option>
                <option value={STORAGE_TYPE.COLD}>냉장</option>
                <option value={STORAGE_TYPE.FROZEN}>냉동</option>
              </Select>
            </div>
            <div>
              <Label>유통기한 (일)</Label>
              <Input name="shelfLifeDays" type="number" defaultValue={editing?.shelfLifeDays ?? ""} />
            </div>
            <div>
              <Label>안전재고</Label>
              <Input name="safetyStock" type="number" step="0.001" defaultValue={editing?.safetyStock ?? ""} />
            </div>
          </div>
          <div className="flex justify-between pt-4">
            {editing ? (
              <Button type="button" variant="destructive" onClick={async () => {
                await deleteMaterial(editing.id);
                toast.success("비활성화되었습니다.");
                setOpen(false);
              }}>비활성화</Button>
            ) : <div />}
            <Button type="submit">{editing ? "수정" : "등록"}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
