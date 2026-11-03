"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, ThumbsUp, ThumbsDown } from "lucide-react";
import { approveCoaInspection } from "../actions";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

type Item = {
  id: string;
  testItem: string;
  specCriteria: string | null;
  coaValue: string | null;
  coaNumeric: string | null;
  status: string;
  ocrConfidence: string | null;
  isAlert: boolean | null;
  spec: { isCritical: boolean | null; unit: string | null };
};

type Inspection = {
  id: string;
  imagePath: string;
  ocrStatus: string | null;
  overallResult: string | null;
  avgConfidence: string | null;
  reviewedAt: Date | null;
  reviewComment: string | null;
  createdAt: Date | null;
  lot: { lotNumber: string; receipt: { supplier: { name: string } } };
  material: { name: string; code: string };
  items: Item[];
};

export function CoaDetailView({ inspection }: { inspection: Inspection }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);

  const passCount = inspection.items.filter((i) => i.status === "pass").length;
  const failCount = inspection.items.filter((i) => i.status === "fail").length;
  const totalCount = inspection.items.length;
  const isReviewed = !!inspection.reviewedAt;

  async function handleApproval(approved: boolean) {
    setProcessing(true);
    try {
      await approveCoaInspection(inspection.id, approved, comment);
      toast.success(approved ? "승인 처리되었습니다." : "반려 처리되었습니다.");
      router.refresh();
    } catch (err) {
      toast.error("처리 실패: " + (err instanceof Error ? err.message : "Unknown"));
    }
    setProcessing(false);
  }

  return (
    <div className="space-y-6">
      <Link href="/coa">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> 목록으로
        </Button>
      </Link>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">LOT 번호</p>
          <p className="font-mono font-bold">{inspection.lot.lotNumber}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">판정 결과</p>
          <div className="mt-1">
            {inspection.overallResult === "pass" ? (
              <Badge variant="success" className="text-base px-3 py-1">적합 (PASS)</Badge>
            ) : inspection.overallResult === "fail" ? (
              <Badge variant="destructive" className="text-base px-3 py-1">부적합 (FAIL)</Badge>
            ) : (
              <Badge variant="secondary" className="text-base px-3 py-1">미판정</Badge>
            )}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">검수 항목</p>
          <p className="text-2xl font-bold">
            <span className="text-green-600">{passCount}</span>
            <span className="text-muted-foreground text-base"> / {totalCount}</span>
            {failCount > 0 && (
              <span className="text-red-600 text-sm ml-2">({failCount} FAIL)</span>
            )}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">평균 OCR 신뢰도</p>
          <p className="text-2xl font-bold">
            {inspection.avgConfidence ? `${Number(inspection.avgConfidence).toFixed(1)}%` : "-"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* COA 이미지 */}
        <div>
          <h3 className="font-semibold mb-2">COA 이미지</h3>
          <div className="border rounded-lg overflow-hidden">
            <img
              src={inspection.imagePath}
              alt="COA"
              className="w-full object-contain max-h-[500px]"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            등록: {formatDateTime(inspection.createdAt)}
          </p>
        </div>

        {/* 검수 항목 결과 테이블 */}
        <div className="col-span-2">
          <h3 className="font-semibold mb-2">COA OCR AI AUTO INSPECTION</h3>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">시험항목</th>
                  <th className="px-3 py-2 text-left font-medium">규격</th>
                  <th className="px-3 py-2 text-left font-medium">COA 값</th>
                  <th className="px-3 py-2 text-center font-medium">판정</th>
                  <th className="px-3 py-2 text-right font-medium">OCR 신뢰도</th>
                </tr>
              </thead>
              <tbody>
                {inspection.items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b ${item.status === "fail" ? "bg-red-50" : ""}`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        {item.testItem}
                        {item.spec.isCritical && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0">필수</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{item.specCriteria}</td>
                    <td className="px-3 py-2.5 font-medium">{item.coaValue}</td>
                    <td className="px-3 py-2.5 text-center">
                      {item.status === "pass" ? (
                        <Badge variant="success">
                          <CheckCircle className="h-3 w-3 mr-1" /> PASS
                        </Badge>
                      ) : item.status === "fail" ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" /> FAIL
                          {item.isAlert && <AlertTriangle className="h-3 w-3 ml-1" />}
                        </Badge>
                      ) : (
                        <Badge variant="warning">검토</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">
                      {item.ocrConfidence ? `${Number(item.ocrConfidence).toFixed(1)}%` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 담당자 승인/반려 */}
          {!isReviewed && inspection.ocrStatus === "completed" ? (
            <div className="mt-4 rounded-lg border p-4 bg-muted/30">
              <h4 className="font-semibold mb-3">담당자 최종 판정</h4>
              <div className="space-y-3">
                <div>
                  <Label>검토 의견</Label>
                  <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="검토 의견을 입력하세요 (선택사항)"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApproval(true)}
                    disabled={processing}
                    className="flex-1"
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" /> 승인 (LOT 가용 전환)
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleApproval(false)}
                    disabled={processing}
                    className="flex-1"
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" /> 반려 (LOT 부적합)
                  </Button>
                </div>
              </div>
            </div>
          ) : isReviewed ? (
            <div className="mt-4 rounded-lg border p-4 bg-green-50">
              <p className="text-sm">
                <span className="font-semibold">최종 판정 완료:</span>{" "}
                {formatDateTime(inspection.reviewedAt)}
              </p>
              {inspection.reviewComment && (
                <p className="text-sm text-muted-foreground mt-1">
                  의견: {inspection.reviewComment}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
