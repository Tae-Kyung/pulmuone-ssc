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
import { ArrowRightLeft, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { moveInventory, updateInventoryStatus } from "./actions";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type InvRow = {
  id: string;
  quantity: string;
  status: string;
  lastMovedAt: Date | null;
  lot: { lotNumber: string; supplierLot: string | null; expiryDate: string | null };
  material: { name: string; code: string; unit: string };
  location: { code: string; warehouse: string; zone: string | null };
};

type ExpiringLot = {
  id: string;
  lotNumber: string;
  expiryDate: string | null;
  material: { name: string };
  location: { code: string } | null;
};

type Location = { id: string; code: string; warehouse: string };

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  available: { label: "가용", variant: "success" },
  hold: { label: "보류", variant: "warning" },
  expired: { label: "만료", variant: "secondary" },
  rejected: { label: "부적합", variant: "destructive" },
};

function daysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function InventoryView({
  data,
  expiringLots,
  locations,
}: {
  data: InvRow[];
  expiringLots: ExpiringLot[];
  locations: Location[];
}) {
  const [moveOpen, setMoveOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InvRow | null>(null);

  const columns: ColumnDef<InvRow, unknown>[] = [
    {
      id: "material",
      header: "원료",
      cell: ({ row }) => `${row.original.material.name}`,
    },
    {
      id: "lot",
      header: "LOT",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.lot.lotNumber}</span>,
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.location.warehouse} / {row.original.location.code}
        </span>
      ),
    },
    {
      id: "qty",
      header: "수량",
      cell: ({ row }) => `${row.original.quantity} ${row.original.material.unit}`,
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ getValue }) => {
        const s = statusMap[(getValue() as string)];
        return <Badge variant={s?.variant ?? "secondary"}>{s?.label ?? getValue()}</Badge>;
      },
    },
    {
      id: "expiry",
      header: "소비기한",
      cell: ({ row }) => {
        const days = daysUntilExpiry(row.original.lot.expiryDate);
        return (
          <div className="flex items-center gap-1">
            <span>{formatDate(row.original.lot.expiryDate)}</span>
            {days !== null && days <= 7 && (
              <Badge variant="destructive" className="text-[10px]">D-{days}</Badge>
            )}
            {days !== null && days > 7 && days <= 30 && (
              <Badge variant="warning" className="text-[10px]">D-{days}</Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedItem(row.original);
              setMoveOpen(true);
            }}
          >
            <ArrowRightLeft className="h-3 w-3 mr-1" /> 이동
          </Button>
          {row.original.status === "available" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await updateInventoryStatus(row.original.id, "hold", "수동 보류");
                toast.success("Hold 처리되었습니다.");
              }}
            >
              <ShieldAlert className="h-3 w-3" />
            </Button>
          )}
          {row.original.status === "hold" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await updateInventoryStatus(row.original.id, "available", "보류 해제");
                toast.success("가용 전환되었습니다.");
              }}
            >
              <ShieldCheck className="h-3 w-3" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 소비기한 임박 알림 */}
      {expiringLots.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">소비기한 임박 ({expiringLots.length}건)</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {expiringLots.slice(0, 6).map((lot) => {
              const days = daysUntilExpiry(lot.expiryDate);
              return (
                <div key={lot.id} className="flex items-center justify-between bg-white rounded px-2 py-1">
                  <span>{lot.material.name}</span>
                  <Badge variant={days !== null && days <= 7 ? "destructive" : "warning"}>
                    D-{days}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 재고 상태 요약 */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(statusMap).map(([key, { label, variant }]) => {
          const count = data.filter((d) => d.status === key).length;
          return (
            <div key={key} className="rounded-lg border p-3">
              <Badge variant={variant} className="mb-1">{label}</Badge>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">건</p>
            </div>
          );
        })}
      </div>

      <DataTable columns={columns} data={data} />

      {/* 이동 다이얼로그 */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogClose onClose={() => setMoveOpen(false)} />
        <DialogHeader>
          <DialogTitle>재고 이동</DialogTitle>
        </DialogHeader>
        {selectedItem && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              try {
                await moveInventory({
                  lotId: selectedItem.lot.lotNumber ? selectedItem.id.toString() : "",
                  fromLocationId: selectedItem.location.code,
                  toLocationId: fd.get("toLocationId") as string,
                  quantity: fd.get("quantity") as string,
                });
                toast.success("이동 완료");
                setMoveOpen(false);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "이동 실패");
              }
            }}
          >
            <div className="text-sm space-y-1 bg-muted/50 rounded p-3">
              <p><span className="text-muted-foreground">LOT:</span> {selectedItem.lot.lotNumber}</p>
              <p><span className="text-muted-foreground">원료:</span> {selectedItem.material.name}</p>
              <p><span className="text-muted-foreground">현재 위치:</span> {selectedItem.location.code}</p>
              <p><span className="text-muted-foreground">현재 수량:</span> {selectedItem.quantity} {selectedItem.material.unit}</p>
            </div>
            <div>
              <Label>이동 위치 *</Label>
              <Select name="toLocationId" required>
                <option value="">선택</option>
                {locations
                  .filter((l) => l.id !== selectedItem.location.code)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.warehouse} / {l.code}
                    </option>
                  ))}
              </Select>
            </div>
            <div>
              <Label>이동 수량 *</Label>
              <Input
                name="quantity"
                type="number"
                step="0.001"
                required
                max={selectedItem.quantity}
                defaultValue={selectedItem.quantity}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">이동 실행</Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
