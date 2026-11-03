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
import { createLocation, updateLocation, deleteLocation } from "./actions";
import { toast } from "sonner";
import { STORAGE_TYPE } from "@ssc/shared";

type Location = {
  id: string;
  code: string;
  warehouse: string;
  zone: string | null;
  rack: string | null;
  level: string | null;
  storageType: string | null;
  qrCode: string | null;
  isActive: boolean | null;
};

const storageLabels: Record<string, string> = { ambient: "상온", cold: "냉장", frozen: "냉동" };

const columns: ColumnDef<Location, unknown>[] = [
  { accessorKey: "code", header: "Location 코드" },
  { accessorKey: "warehouse", header: "창고" },
  { accessorKey: "zone", header: "Zone" },
  { accessorKey: "rack", header: "Rack" },
  { accessorKey: "level", header: "단" },
  { accessorKey: "storageType", header: "보관조건", cell: ({ getValue }) => storageLabels[(getValue() as string) ?? "ambient"] ?? getValue() },
  { accessorKey: "qrCode", header: "QR Code" },
  { accessorKey: "isActive", header: "상태", cell: ({ getValue }) => getValue() ? <Badge variant="success">활성</Badge> : <Badge variant="secondary">비활성</Badge> },
];

export function LocationTable({ data }: { data: Location[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);

  const columnsWithActions: ColumnDef<Location, unknown>[] = [
    ...columns,
    {
      id: "actions", header: "",
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
          <Plus className="h-4 w-4" /> Location 등록
        </Button>
      </div>
      <DataTable columns={columnsWithActions} data={data} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogClose onClose={() => setOpen(false)} />
        <DialogHeader>
          <DialogTitle>{editing ? "Location 수정" : "Location 등록"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const d = Object.fromEntries(fd.entries()) as Record<string, string>;
          try {
            if (editing) {
              await updateLocation(editing.id, d);
              toast.success("수정되었습니다.");
            } else {
              await createLocation(d as Parameters<typeof createLocation>[0]);
              toast.success("등록되었습니다.");
            }
            setOpen(false);
          } catch (err) {
            toast.error("오류: " + (err instanceof Error ? err.message : "Unknown"));
          }
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location 코드 *</Label>
              <Input name="code" required defaultValue={editing?.code ?? ""} placeholder="WH-A-Z2-R3-L2" />
            </div>
            <div>
              <Label>창고 *</Label>
              <Input name="warehouse" required defaultValue={editing?.warehouse ?? ""} placeholder="창고 A" />
            </div>
            <div>
              <Label>Zone</Label>
              <Input name="zone" defaultValue={editing?.zone ?? ""} placeholder="Zone 2" />
            </div>
            <div>
              <Label>Rack</Label>
              <Input name="rack" defaultValue={editing?.rack ?? ""} placeholder="Rack 3" />
            </div>
            <div>
              <Label>단</Label>
              <Input name="level" defaultValue={editing?.level ?? ""} placeholder="2단" />
            </div>
            <div>
              <Label>보관조건</Label>
              <Select name="storageType" defaultValue={editing?.storageType ?? "ambient"}>
                <option value={STORAGE_TYPE.AMBIENT}>상온</option>
                <option value={STORAGE_TYPE.COLD}>냉장</option>
                <option value={STORAGE_TYPE.FROZEN}>냉동</option>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>QR Code 값</Label>
              <Input name="qrCode" defaultValue={editing?.qrCode ?? ""} />
            </div>
          </div>
          <div className="flex justify-between pt-4">
            {editing ? (
              <Button type="button" variant="destructive" onClick={async () => {
                await deleteLocation(editing.id); toast.success("비활성화되었습니다."); setOpen(false);
              }}>비활성화</Button>
            ) : <div />}
            <Button type="submit">{editing ? "수정" : "등록"}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
