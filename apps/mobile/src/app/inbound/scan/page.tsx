"use client";

import { useState, useCallback } from "react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { lookupBarcode, confirmInbound } from "./actions";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import Link from "next/link";

type LotInfo = {
  id: string;
  lotNumber: string;
  supplierLot: string | null;
  quantity: string;
  unit: string;
  manufactureDate: string | null;
  expiryDate: string | null;
  status: string | null;
  material: { name: string; code: string };
  supplier: { name: string };
  location: { code: string; warehouse: string } | null;
};

export default function ScanInboundPage() {
  const [scanning, setScanning] = useState(true);
  const [lot, setLot] = useState<LotInfo | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleScan = useCallback(async (barcode: string) => {
    setScanning(false);
    setNotFound(false);
    try {
      const result = await lookupBarcode(barcode);
      if (result.found) {
        setLot(result.lot);
        toast.success(`LOT 확인: ${result.lot.lotNumber}`);
      } else {
        setNotFound(true);
        toast.error(`등록되지 않은 바코드: ${barcode}`);
      }
    } catch {
      toast.error("조회 실패");
    }
  }, []);

  function resetScan() {
    setLot(null);
    setNotFound(false);
    setScanning(true);
  }

  async function handleConfirm() {
    if (!lot) return;
    try {
      await confirmInbound(lot.id);
      toast.success("입고 확인 완료");
      setLot({ ...lot, status: "inspection" });
    } catch {
      toast.error("처리 실패");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/">
          <button className="p-2 rounded hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-lg font-bold">스캔 입고</h1>
      </div>

      {scanning && (
        <BarcodeScanner
          onScan={handleScan}
          onError={(err) => toast.error(err)}
        />
      )}

      {notFound && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <p className="font-semibold text-red-700">등록되지 않은 바코드</p>
          <p className="text-sm text-red-600 mt-1">해당 바코드가 시스템에 등록되어 있지 않습니다.</p>
          <button
            onClick={resetScan}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4 inline mr-1" /> 재스캔
          </button>
        </div>
      )}

      {lot && (
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span className="font-bold text-green-800">원료 확인됨</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">LOT 번호</span>
                <span className="font-mono font-bold">{lot.lotNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">원료</span>
                <span className="font-medium">{lot.material.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">공급업체</span>
                <span>{lot.supplier.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">수량</span>
                <span>{lot.quantity} {lot.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">공급사 LOT</span>
                <span>{lot.supplierLot || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">제조일</span>
                <span>{formatDate(lot.manufactureDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">소비기한</span>
                <span>{formatDate(lot.expiryDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">상태</span>
                <span className={`font-medium ${lot.status === "available" ? "text-green-600" : lot.status === "hold" ? "text-red-600" : "text-yellow-600"}`}>
                  {lot.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold"
            >
              입고 확인
            </button>
            <button
              onClick={resetScan}
              className="flex-1 border border-border py-3 rounded-lg font-semibold"
            >
              재스캔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
