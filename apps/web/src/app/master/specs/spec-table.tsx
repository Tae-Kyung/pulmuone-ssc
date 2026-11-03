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
import { createSpec, updateSpec, deleteSpec } from "./actions";
import { toast } from "sonner";
import { SPEC_TYPE } from "@ssc/shared";

type Spec = {
  id: string;
  materialId: string;
  testItem: string;
  specType: string;
  specMin: string | null;
  specMax: string | null;
  specText: string | null;
  unit: string | null;
  isCritical: boolean | null;
  sortOrder: number | null;
  isActive: boolean | null;
  material: { id: string; code: string; name: string };
};

type Material = { id: string; code: string; name: string };

function formatSpec(row: Spec): string {
  switch (row.specType) {
    case "max": return `≤ ${row.specMax}${row.unit ? ` ${row.unit}` : ""}`;
    case "min": return `≥ ${row.specMin}${row.unit ? ` ${row.unit}` : ""}`;
    case "range": return `${row.specMin} - ${row.specMax}${row.unit ? ` ${row.unit}` : ""}`;
    case "negative": return row.specText ?? "Negative";
    case "exact": return `= ${row.specText ?? row.specMax}`;
    default: return "-";
  }
}

const specTypeLabels: Record<string, string> = {
  max: "이하 (≤)",
  min: "이상 (≥)",
  range: "범위",
  exact: "일치",
  negative: "음성",
};

const columns: ColumnDef<Spec, unknown>[] = [
  { id: "material", header: "원료", cell: ({ row }) => `${row.original.material.name} (${row.original.material.code})` },
  { accessorKey: "testItem", header: "시험항목" },
  { accessorKey: "specType", header: "규격유형", cell: ({ getValue }) => specTypeLabels[(getValue() as string)] ?? getValue() },
  { id: "spec", header: "규격", cell: ({ row }) => formatSpec(row.original) },
  { accessorKey: "isCritical", header: "필수", cell: ({ getValue }) => getValue() ? <Badge variant="destructive">필수</Badge> : "-" },
  { accessorKey: "sortOrder", header: "순서" },
  { accessorKey: "isActive", header: "상태", cell: ({ getValue }) => getValue() ? <Badge variant="success">활성</Badge> : <Badge variant="secondary">비활성</Badge> },
];

export function SpecTable({ data, materials }: { data: Spec[]; materials: Material[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Spec | null>(null);

  const columnsWithActions: ColumnDef<Spec, unknown>[] = [
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
          <Plus className="h-4 w-4" /> 규격 등록
        </Button>
      </div>
      <DataTable columns={columnsWithActions} data={data} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogClose onClose={() => setOpen(false)} />
        <DialogHeader>
          <DialogTitle>{editing ? "규격 수정" : "규격 등록"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const d = Object.fromEntries(fd.entries()) as Record<string, string>;
          try {
            if (editing) {
              await updateSpec(editing.id, d);
              toast.success("수정되었습니다.");
            } else {
              await createSpec(d as Parameters<typeof createSpec>[0]);
              toast.success("등록되었습니다.");
            }
            setOpen(false);
          } catch (err) {
            toast.error("오류: " + (err instanceof Error ? err.message : "Unknown"));
          }
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>원료 *</Label>
              <Select name="materialId" required defaultValue={editing?.materialId ?? ""} disabled={!!editing}>
                <option value="">선택</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>시험항목 *</Label>
              <Input name="testItem" required defaultValue={editing?.testItem ?? ""} placeholder="Moisture, pH 등" />
            </div>
            <div>
              <Label>규격유형 *</Label>
              <Select name="specType" required defaultValue={editing?.specType ?? ""}>
                <option value="">선택</option>
                {Object.entries(SPEC_TYPE).map(([k, v]) => (
                  <option key={v} value={v}>{specTypeLabels[v] ?? k}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>하한값</Label>
              <Input name="specMin" type="number" step="any" defaultValue={editing?.specMin ?? ""} />
            </div>
            <div>
              <Label>상한값</Label>
              <Input name="specMax" type="number" step="any" defaultValue={editing?.specMax ?? ""} />
            </div>
            <div>
              <Label>텍스트 규격</Label>
              <Input name="specText" defaultValue={editing?.specText ?? ""} placeholder="Negative 등" />
            </div>
            <div>
              <Label>단위</Label>
              <Input name="unit" defaultValue={editing?.unit ?? ""} placeholder="%, CFU/g, ppm" />
            </div>
            <div>
              <Label>표시순서</Label>
              <Input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? 0} />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" name="isCritical" id="isCritical" defaultChecked={editing?.isCritical ?? false} />
              <Label htmlFor="isCritical">필수 검사항목</Label>
            </div>
          </div>
          <div className="flex justify-between pt-4">
            {editing ? (
              <Button type="button" variant="destructive" onClick={async () => {
                await deleteSpec(editing.id);
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
