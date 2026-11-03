"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Plus, QrCode, FileCheck, ArrowLeft } from "lucide-react";
import { createLot, updateReceiptStatus } from "../actions";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { BarcodeDisplay } from "./barcode-display";

type Lot = {
  id: string;
  lotNumber: string;
  supplierLot: string | null;
  quantity: string;
  unit: string;
  manufactureDate: string | null;
  expiryDate: string | null;
  barcodeValue: string | null;
  barcodeType: string | null;
  status: string | null;
  location: { code: string; warehouse: string } | null;
  coaInspection: {
    id: string;
    ocrStatus: string | null;
    overallResult: string | null;
    avgConfidence: string | null;
    items: { testItem: string; status: string; coaValue: string | null }[];
  } | null;
};

type Receipt = {
  id: string;
  receiptNumber: string;
  receivedDate: string;
  totalQuantity: string;
  unit: string;
  status: string | null;
  notes: string | null;
  material: { id: string; code: string; name: string; unit: string; specs: { id: string; testItem: string }[] };
  supplier: { id: string; name: string; code: string };
  lots: Lot[];
};

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  pending: { label: "대기", variant: "secondary" },
  inspection: { label: "검수 중", variant: "warning" },
  inspecting: { label: "검수 중", variant: "warning" },
  available: { label: "가용", variant: "success" },
  approved: { label: "승인", variant: "success" },
  hold: { label: "보류", variant: "destructive" },
  rejected: { label: "반려", variant: "destructive" },
  expired: { label: "만료", variant: "secondary" },
  consumed: { label: "소진", variant: "secondary" },
};

const coaStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  pass: { label: "PASS", variant: "success" },
  fail: { label: "FAIL", variant: "destructive" },
  review: { label: "검토필요", variant: "warning" },
};

export function ReceiptDetail({ receipt }: { receipt: Receipt }) {
  const [lotDialogOpen, setLotDialogOpen] = useState(false);
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);

  return (
    <div className="space-y-6">
      <Link href="/inbound">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> 목록으로
        </Button>
      </Link>

      {/* 입고 기본정보 */}
      <div className="rounded-lg border p-4">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">입고번호</p>
            <p className="font-medium">{receipt.receiptNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground">원료</p>
            <p className="font-medium">{receipt.material.name} ({receipt.material.code})</p>
          </div>
          <div>
            <p className="text-muted-foreground">공급업체</p>
            <p className="font-medium">{receipt.supplier.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">입고일</p>
            <p className="font-medium">{formatDate(receipt.receivedDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">수량</p>
            <p className="font-medium">{receipt.totalQuantity} {receipt.unit}</p>
          </div>
          <div>
            <p className="text-muted-foreground">상태</p>
            <Badge variant={statusMap[receipt.status ?? "pending"]?.variant ?? "secondary"}>
              {statusMap[receipt.status ?? "pending"]?.label ?? receipt.status}
            </Badge>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">비고</p>
            <p className="font-medium">{receipt.notes || "-"}</p>
          </div>
        </div>
      </div>

      {/* LOT 목록 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">LOT 목록 ({receipt.lots.length}건)</h2>
          <Button onClick={() => setLotDialogOpen(true)}>
            <Plus className="h-4 w-4" /> LOT 등록
          </Button>
        </div>

        {receipt.lots.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            등록된 LOT가 없습니다. LOT를 등록해주세요.
          </div>
        ) : (
          <div className="space-y-3">
            {receipt.lots.map((lot) => (
              <div key={lot.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="grid grid-cols-5 gap-4 text-sm flex-1">
                    <div>
                      <p className="text-muted-foreground">LOT 번호</p>
                      <p className="font-mono font-medium">{lot.lotNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">공급사 LOT</p>
                      <p className="font-medium">{lot.supplierLot || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">수량</p>
                      <p className="font-medium">{lot.quantity} {lot.unit}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">제조일 / 소비기한</p>
                      <p className="font-medium">
                        {formatDate(lot.manufactureDate)} ~ {formatDate(lot.expiryDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">상태</p>
                      <Badge variant={statusMap[lot.status ?? "inspection"]?.variant ?? "secondary"}>
                        {statusMap[lot.status ?? "inspection"]?.label ?? lot.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLot(lot);
                        setBarcodeDialogOpen(true);
                      }}
                    >
                      <QrCode className="h-4 w-4 mr-1" /> 바코드
                    </Button>
                    <Link href={`/coa/new?lotId=${lot.id}&materialId=${receipt.material.id}`}>
                      <Button variant="outline" size="sm">
                        <FileCheck className="h-4 w-4 mr-1" /> COA 검수
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* COA 결과 요약 (있는 경우) */}
                {lot.coaInspection && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">COA 결과:</span>
                      <Badge variant={coaStatusMap[lot.coaInspection.overallResult ?? ""]?.variant ?? "secondary"}>
                        {coaStatusMap[lot.coaInspection.overallResult ?? ""]?.label ?? lot.coaInspection.ocrStatus}
                      </Badge>
                      {lot.coaInspection.avgConfidence && (
                        <span className="text-muted-foreground">
                          OCR 신뢰도: {Number(lot.coaInspection.avgConfidence).toFixed(1)}%
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        ({lot.coaInspection.items.filter((i) => i.status === "pass").length}/
                        {lot.coaInspection.items.length} 항목 적합)
                      </span>
                      <Link href={`/coa/${lot.coaInspection.id}`}>
                        <Button variant="ghost" size="sm">상세보기</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LOT 등록 다이얼로그 */}
      <Dialog open={lotDialogOpen} onOpenChange={setLotDialogOpen}>
        <DialogClose onClose={() => setLotDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>LOT 등록</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const d = Object.fromEntries(fd.entries()) as Record<string, string>;
            try {
              const lot = await createLot({
                receiptId: receipt.id,
                materialId: receipt.material.id,
                supplierLot: d.supplierLot,
                quantity: d.quantity,
                unit: receipt.unit,
                manufactureDate: d.manufactureDate || undefined,
                expiryDate: d.expiryDate || undefined,
              });
              toast.success(`LOT 등록 완료: ${lot.lotNumber}`);
              setLotDialogOpen(false);
            } catch (err) {
              toast.error("오류: " + (err instanceof Error ? err.message : "Unknown"));
            }
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>공급사 LOT 번호</Label>
              <Input name="supplierLot" placeholder="공급업체 LOT" />
            </div>
            <div>
              <Label>수량 *</Label>
              <Input name="quantity" type="number" step="0.001" required />
            </div>
            <div>
              <Label>제조일자</Label>
              <Input name="manufactureDate" type="date" />
            </div>
            <div>
              <Label>소비기한</Label>
              <Input name="expiryDate" type="date" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            LOT 번호와 바코드는 자동 생성됩니다.
          </p>
          <div className="flex justify-end pt-2">
            <Button type="submit">LOT 등록</Button>
          </div>
        </form>
      </Dialog>

      {/* 바코드 표시 다이얼로그 */}
      <Dialog open={barcodeDialogOpen} onOpenChange={setBarcodeDialogOpen}>
        <DialogClose onClose={() => setBarcodeDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>바코드 / QR Code</DialogTitle>
        </DialogHeader>
        {selectedLot && (
          <BarcodeDisplay
            lotNumber={selectedLot.lotNumber}
            barcodeValue={selectedLot.barcodeValue ?? ""}
            materialName={receipt.material.name}
            supplierName={receipt.supplier.name}
            expiryDate={selectedLot.expiryDate}
          />
        )}
      </Dialog>
    </div>
  );
}
