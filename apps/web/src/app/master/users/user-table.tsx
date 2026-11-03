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
import { createUser, updateUser, deleteUser } from "./actions";
import { toast } from "sonner";
import { USER_ROLE } from "@ssc/shared";

type User = {
  id: string;
  employeeId: string | null;
  name: string;
  department: string | null;
  role: string;
  phone: string | null;
  isActive: boolean | null;
};

const roleLabels: Record<string, string> = {
  admin: "관리자",
  quality_manager: "품질 담당자",
  warehouse_manager: "창고 담당자",
  operator: "현장 작업자",
};

const columns: ColumnDef<User, unknown>[] = [
  { accessorKey: "employeeId", header: "사번" },
  { accessorKey: "name", header: "이름" },
  { accessorKey: "department", header: "부서" },
  { accessorKey: "role", header: "역할", cell: ({ getValue }) => <Badge variant="outline">{roleLabels[(getValue() as string)] ?? getValue()}</Badge> },
  { accessorKey: "phone", header: "연락처" },
  { accessorKey: "isActive", header: "상태", cell: ({ getValue }) => getValue() ? <Badge variant="success">활성</Badge> : <Badge variant="secondary">비활성</Badge> },
];

export function UserTable({ data }: { data: User[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const columnsWithActions: ColumnDef<User, unknown>[] = [
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
          <Plus className="h-4 w-4" /> 사용자 등록
        </Button>
      </div>
      <DataTable columns={columnsWithActions} data={data} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogClose onClose={() => setOpen(false)} />
        <DialogHeader>
          <DialogTitle>{editing ? "사용자 수정" : "사용자 등록"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const d = Object.fromEntries(fd.entries()) as Record<string, string>;
          try {
            if (editing) {
              await updateUser(editing.id, d);
              toast.success("수정되었습니다.");
            } else {
              await createUser(d as { name: string; role: string });
              toast.success("등록되었습니다.");
            }
            setOpen(false);
          } catch (err) {
            toast.error("오류: " + (err instanceof Error ? err.message : "Unknown"));
          }
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>사번</Label>
              <Input name="employeeId" defaultValue={editing?.employeeId ?? ""} />
            </div>
            <div>
              <Label>이름 *</Label>
              <Input name="name" required defaultValue={editing?.name ?? ""} />
            </div>
            <div>
              <Label>부서</Label>
              <Input name="department" defaultValue={editing?.department ?? ""} />
            </div>
            <div>
              <Label>역할 *</Label>
              <Select name="role" required defaultValue={editing?.role ?? "operator"}>
                {Object.entries(USER_ROLE).map(([, v]) => (
                  <option key={v} value={v}>{roleLabels[v]}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>연락처</Label>
              <Input name="phone" defaultValue={editing?.phone ?? ""} />
            </div>
          </div>
          <div className="flex justify-between pt-4">
            {editing ? (
              <Button type="button" variant="destructive" onClick={async () => {
                await deleteUser(editing.id); toast.success("비활성화되었습니다."); setOpen(false);
              }}>비활성화</Button>
            ) : <div />}
            <Button type="submit">{editing ? "수정" : "등록"}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
