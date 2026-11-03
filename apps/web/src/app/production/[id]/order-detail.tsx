"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { ArrowLeft, Plus, AlertTriangle, XCircle } from "lucide-react";
import { processProductionInput, updateOrderStatus } from "../actions";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  productLot: string | null;
  plannedDate: string;
  status: string | null;
  requiredMaterials: {
    materialId: string;
    requiredQty: string;
    unit: string;
    material: { name: string; code: string };
  }[];
  inputs: {
    id: string;
    inputQuantity: string;
    unit: string;
    scannedBarcode: string | null;
    inputAt: Date | null;
    lot: { lotNumber: string };
    material: { name: string; code: string };
  }[];
};

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  planned: { label: "계획", variant: "secondary" },
  in_progress: { label: "진행 중", variant: "warning" },
  completed: { label: "완료", variant: "success" },
  cancelled: { label: "취소", variant: "destructive" },
};

export function OrderDetail({ order }: { order: Order }) {
  const [inputOpen, setInputOpen] = useState(false);
  const [inputError, setInputError] = useState<{ message: string; code?: string } | null>(null);

  return (
    <div className="space-y-6">
      <Link href="/production">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> 목록으로
        </Button>
      </Link>

      {/* 기본정보 */}
      <div className="rounded-lg border p-4 grid grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">작업지시번호</p>
          <p className="font-medium">{order.orderNumber}</p>
        </div>
        <div>
          <p className="text-muted-foreground">제품명</p>
          <p className="font-medium">{order.productName}</p>
        </div>
        <div>
          <p className="text-muted-foreground">제품 LOT</p>
          <p className="font-medium">{order.productLot || "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">상태</p>
          <Badge variant={statusMap[order.status ?? "planned"]?.variant}>
            {statusMap[order.status ?? "planned"]?.label}
          </Badge>
        </div>
      </div>

      {/* 필요 원료 (BOM) */}
      <div>
        <h3 className="font-semibold mb-3">필요 원료 (BOM)</h3>
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left">원료</th>
                <th className="px-4 py-2 text-left">필요 수량</th>
                <th className="px-4 py-2 text-left">투입 수량</th>
                <th className="px-4 py-2 text-left">진행률</th>
              </tr>
            </thead>
            <tbody>
              {order.requiredMaterials.map((rm) => {
                const inputted = order.inputs
                  .filter((inp) => inp.material.code === rm.material.code)
                  .reduce((sum, inp) => sum + parseFloat(inp.inputQuantity), 0);
                const required = parseFloat(rm.requiredQty);
                const pct = required > 0 ? Math.min((inputted / required) * 100, 100) : 0;

                return (
                  <tr key={rm.materialId} className="border-b">
                    <td className="px-4 py-2">{rm.material.name} ({rm.material.code})</td>
                    <td className="px-4 py-2">{rm.requiredQty} {rm.unit}</td>
                    <td className="px-4 py-2 font-medium">{inputted.toFixed(3)} {rm.unit}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 투입 이력 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">투입 이력 ({order.inputs.length}건)</h3>
          {order.status !== "completed" && order.status !== "cancelled" && (
            <Button onClick={() => { setInputOpen(true); setInputError(null); }}>
              <Plus className="h-4 w-4" /> 원료 투입
            </Button>
          )}
        </div>

        {order.inputs.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            투입 이력이 없습니다.
          </div>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left">원료</th>
                  <th className="px-4 py-2 text-left">LOT</th>
                  <th className="px-4 py-2 text-left">투입량</th>
                  <th className="px-4 py-2 text-left">바코드</th>
                  <th className="px-4 py-2 text-left">투입일시</th>
                </tr>
              </thead>
              <tbody>
                {order.inputs.map((inp) => (
                  <tr key={inp.id} className="border-b">
                    <td className="px-4 py-2">{inp.material.name}</td>
                    <td className="px-4 py-2 font-mono text-xs">{inp.lot.lotNumber}</td>
                    <td className="px-4 py-2">{inp.inputQuantity} {inp.unit}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{inp.scannedBarcode || "-"}</td>
                    <td className="px-4 py-2">{formatDateTime(inp.inputAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 상태 변경 버튼 */}
      {order.status === "in_progress" && (
        <div className="flex gap-3">
          <Button
            onClick={async () => {
              await updateOrderStatus(order.id, "completed");
              toast.success("작업지시 완료 처리되었습니다.");
            }}
          >
            생산 완료
          </Button>
        </div>
      )}

      {/* 투입 다이얼로그 */}
      <Dialog open={inputOpen} onOpenChange={setInputOpen}>
        <DialogClose onClose={() => setInputOpen(false)} />
        <DialogHeader>
          <DialogTitle>원료 투입</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setInputError(null);
            const fd = new FormData(e.currentTarget);
            const result = await processProductionInput({
              orderId: order.id,
              lotId: fd.get("lotId") as string,
              scannedBarcode: fd.get("scannedBarcode") as string,
              inputQuantity: fd.get("inputQuantity") as string,
            });

            if (result.success) {
              toast.success("투입 완료");
              setInputOpen(false);
            } else {
              setInputError({ message: result.error!, code: result.errorCode });
            }
          }}
        >
          <div className="space-y-3">
            <div>
              <Label>LOT ID *</Label>
              <Input name="lotId" required placeholder="LOT UUID 또는 스캔 값" />
            </div>
            <div>
              <Label>스캔 바코드</Label>
              <Input name="scannedBarcode" placeholder="바코드 스캔 값" />
            </div>
            <div>
              <Label>투입 수량 *</Label>
              <Input name="inputQuantity" type="number" step="0.001" required />
            </div>
          </div>

          {inputError && (
            <div className={`rounded-lg p-4 ${inputError.code === "ERR-012" ? "bg-red-50 border-2 border-red-200" : inputError.code === "ERR-045" ? "bg-orange-50 border-2 border-orange-200" : "bg-red-50 border border-red-200"}`}>
              <div className="flex items-start gap-2">
                {inputError.code === "ERR-012" ? (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                )}
                <div>
                  {inputError.code && (
                    <Badge variant="destructive" className="mb-1">{inputError.code}</Badge>
                  )}
                  <p className="text-sm font-medium">
                    {inputError.code === "ERR-012" ? "투입 불가" : inputError.code === "ERR-045" ? "원료 불일치" : "오류"}
                  </p>
                  <p className="text-sm mt-1">{inputError.message}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit">투입 실행</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
