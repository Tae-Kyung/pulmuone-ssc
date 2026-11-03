"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil } from "lucide-react";
import { createSupplier, updateSupplier, deleteSupplier } from "./actions";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

type Supplier = {
  id: string;
  code: string;
  name: string;
  businessNumber: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
};

const columns: ColumnDef<Supplier, unknown>[] = [
  { accessorKey: "code", header: "업체코드" },
  { accessorKey: "name", header: "업체명" },
  { accessorKey: "businessNumber", header: "사업자번호" },
  { accessorKey: "contactName", header: "담당자" },
  { accessorKey: "contactPhone", header: "연락처" },
  {
    accessorKey: "isActive",
    header: "상태",
    cell: ({ getValue }) =>
      getValue() ? <Badge variant="success">활성</Badge> : <Badge variant="secondary">비활성</Badge>,
  },
  {
    accessorKey: "createdAt",
    header: "등록일",
    cell: ({ getValue }) => formatDateTime(getValue() as Date),
  },
];

export function SupplierTable({ data }: { data: Supplier[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const columnsWithActions: ColumnDef<Supplier, unknown>[] = [
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
          <Plus className="h-4 w-4" /> 공급업체 등록
        </Button>
      </div>
      <DataTable columns={columnsWithActions} data={data} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogClose onClose={() => setOpen(false)} />
        <DialogHeader>
          <DialogTitle>{editing ? "공급업체 수정" : "공급업체 등록"}</DialogTitle>
        </DialogHeader>
        <SupplierForm
          supplier={editing}
          onSubmit={async (formData) => {
            try {
              if (editing) {
                await updateSupplier(editing.id, formData);
                toast.success("수정되었습니다.");
              } else {
                await createSupplier(formData as { code: string; name: string });
                toast.success("등록되었습니다.");
              }
              setOpen(false);
            } catch (e) {
              toast.error("오류가 발생했습니다: " + (e instanceof Error ? e.message : "Unknown"));
            }
          }}
          onDelete={editing ? async () => {
            await deleteSupplier(editing.id);
            toast.success("비활성화되었습니다.");
            setOpen(false);
          } : undefined}
        />
      </Dialog>
    </div>
  );
}

function SupplierForm({
  supplier,
  onSubmit,
  onDelete,
}: {
  supplier: Supplier | null;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as Record<string, string>;
    await onSubmit(data);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">업체코드 *</Label>
          <Input id="code" name="code" required defaultValue={supplier?.code ?? ""} />
        </div>
        <div>
          <Label htmlFor="name">업체명 *</Label>
          <Input id="name" name="name" required defaultValue={supplier?.name ?? ""} />
        </div>
        <div>
          <Label htmlFor="businessNumber">사업자번호</Label>
          <Input id="businessNumber" name="businessNumber" defaultValue={supplier?.businessNumber ?? ""} />
        </div>
        <div>
          <Label htmlFor="contactName">담당자명</Label>
          <Input id="contactName" name="contactName" defaultValue={supplier?.contactName ?? ""} />
        </div>
        <div>
          <Label htmlFor="contactPhone">연락처</Label>
          <Input id="contactPhone" name="contactPhone" defaultValue={supplier?.contactPhone ?? ""} />
        </div>
        <div>
          <Label htmlFor="contactEmail">이메일</Label>
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={supplier?.contactEmail ?? ""} />
        </div>
      </div>
      <div>
        <Label htmlFor="address">주소</Label>
        <Input id="address" name="address" defaultValue={supplier?.address ?? ""} />
      </div>
      <div className="flex justify-between pt-4">
        {onDelete ? (
          <Button type="button" variant="destructive" onClick={onDelete}>비활성화</Button>
        ) : <div />}
        <Button type="submit" disabled={loading}>{loading ? "처리 중..." : supplier ? "수정" : "등록"}</Button>
      </div>
    </form>
  );
}
