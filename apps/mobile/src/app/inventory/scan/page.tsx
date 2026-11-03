"use client";

import { useState, useCallback } from "react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { lookupLotInventory } from "./actions";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Package, MapPin, RotateCcw } from "lucide-react";
import Link from "next/link";

type LotInventory = {
  lot: {
    lotNumber: string;
    status: string | null;
    expiryDate: string | null;
    material: { name: string; code: string; unit: string };
  };
  inventory: {
    quantity: string;
    status: string;
    location: { code: string; warehouse: string };
  }[];
  totalQuantity: number;
};

export default function InventoryScanPage() {
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<LotInventory | null>(null);

  const handleScan = useCallback(async (barcode: string) => {
    setScanning(false);
    const res = await lookupLotInventory(barcode);
    if (res.found) {
      setResult(res);
      toast.success(`재고 확인: ${res.lot.lotNumber}`);
    } else {
      toast.error("등록되지 않은 바코드입니다.");
      setScanning(true);
    }
  }, []);

  function daysUntil(date: string | null) {
    if (!date) return null;
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/"><button className="p-2 rounded hover:bg-muted"><ArrowLeft className="h-5 w-5" /></button></Link>
        <h1 className="text-lg font-bold">재고 조회</h1>
      </div>

      {scanning && <BarcodeScanner onScan={handleScan} onError={(e) => toast.error(e)} />}

      {result && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4 bg-green-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-lg">{result.lot.material.name}</p>
                <p className="font-mono text-sm text-muted-foreground">{result.lot.lotNumber}</p>
              </div>
              <div className={`text-right px-3 py-1 rounded-lg text-sm font-bold ${result.lot.status === "available" ? "bg-green-200 text-green-800" : result.lot.status === "hold" ? "bg-red-200 text-red-800" : "bg-gray-200 text-gray-800"}`}>
                {result.lot.status}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">총 재고</span>
                <p className="font-bold text-xl">{result.totalQuantity} {result.lot.material.unit}</p>
              </div>
              <div>
                <span className="text-muted-foreground">소비기한</span>
                <p className="font-medium">
                  {formatDate(result.lot.expiryDate)}
                  {result.lot.expiryDate && (
                    <span className={`ml-1 text-xs ${(daysUntil(result.lot.expiryDate) ?? 999) <= 7 ? "text-red-600 font-bold" : "text-muted-foreground"}`}>
                      (D-{daysUntil(result.lot.expiryDate)})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {result.inventory.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-1">
                <MapPin className="h-4 w-4" /> 보관 위치별 재고
              </h3>
              {result.inventory.map((inv, i) => (
                <div key={i} className="rounded border p-3 mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{inv.location.warehouse}</p>
                    <p className="text-xs text-muted-foreground">{inv.location.code}</p>
                  </div>
                  <p className="font-bold">{inv.quantity} {result.lot.material.unit}</p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => { setResult(null); setScanning(true); }}
            className="w-full border border-border py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" /> 재스캔
          </button>
        </div>
      )}
    </div>
  );
}
