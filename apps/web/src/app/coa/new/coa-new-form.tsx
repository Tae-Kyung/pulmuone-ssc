"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Scan, CheckCircle, XCircle } from "lucide-react";
import { uploadCoaImage, createCoaInspection, saveOcrResults } from "../actions";
import { toast } from "sonner";

type Spec = {
  id: string;
  testItem: string;
  specType: string;
  specMin: string | null;
  specMax: string | null;
  specText: string | null;
  unit: string | null;
  isCritical: boolean | null;
};

type OcrResult = {
  specId: string;
  testItem: string;
  coaValue: string;
  ocrConfidence: number;
};

function formatSpecCriteria(spec: Spec): string {
  switch (spec.specType) {
    case "max": return `≤ ${spec.specMax}${spec.unit ? ` ${spec.unit}` : ""}`;
    case "min": return `≥ ${spec.specMin}${spec.unit ? ` ${spec.unit}` : ""}`;
    case "range": return `${spec.specMin} - ${spec.specMax}${spec.unit ? ` ${spec.unit}` : ""}`;
    case "negative": return spec.specText ?? "Negative";
    case "exact": return `= ${spec.specText ?? spec.specMax}`;
    default: return "-";
  }
}

export function CoaNewForm({
  lotId,
  materialId,
  specs,
}: {
  lotId: string;
  materialId: string;
  specs: Spec[];
}) {
  const router = useRouter();
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<OcrResult[]>(
    specs.map((s) => ({
      specId: s.id,
      testItem: s.testItem,
      coaValue: "",
      ocrConfidence: 95,
    }))
  );
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const path = await uploadCoaImage(fd);
      setImagePath(path);
      toast.success("이미지 업로드 완료");
    } catch (err) {
      toast.error("업로드 실패: " + (err instanceof Error ? err.message : "Unknown"));
    }
    setUploading(false);
  }

  function updateResult(index: number, field: keyof OcrResult, value: string | number) {
    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  async function handleSubmit() {
    if (!imagePath) {
      toast.error("COA 이미지를 먼저 업로드해주세요.");
      return;
    }

    const emptyFields = results.filter((r) => !r.coaValue.trim());
    if (emptyFields.length > 0) {
      toast.error(`${emptyFields.length}개 항목의 COA 값을 입력해주세요.`);
      return;
    }

    setProcessing(true);
    try {
      const inspection = await createCoaInspection({
        lotId,
        materialId,
        imagePath,
      });

      const { overallResult, failCount, avgConfidence } = await saveOcrResults(
        inspection.id,
        materialId,
        results
      );

      if (overallResult === "pass") {
        toast.success(`검수 완료: 전체 적합 (신뢰도 ${avgConfidence.toFixed(1)}%)`);
      } else {
        toast.error(`검수 완료: ${failCount}건 부적합 발견 — LOT가 Hold 처리되었습니다.`);
      }

      router.push(`/coa/${inspection.id}`);
    } catch (err) {
      toast.error("검수 처리 실패: " + (err instanceof Error ? err.message : "Unknown"));
    }
    setProcessing(false);
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* 좌측: COA 이미지 업로드 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">COA 시험성적서 이미지</h2>
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          {previewUrl ? (
            <div>
              <img
                src={previewUrl}
                alt="COA preview"
                className="max-h-96 mx-auto rounded-md mb-3"
              />
              <p className="text-sm text-muted-foreground">
                {imagePath ? "업로드 완료" : "업로드 중..."}
              </p>
            </div>
          ) : (
            <div className="py-8">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-3">COA 이미지를 업로드하세요</p>
            </div>
          )}
          <Input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="max-w-xs mx-auto"
          />
        </div>
      </div>

      {/* 우측: 검수 항목 입력 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">검수 항목 ({specs.length}개)</h2>
          <Badge variant="outline">
            <Scan className="h-3 w-3 mr-1" /> 수동 입력 모드
          </Badge>
        </div>

        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">시험항목</th>
                <th className="px-3 py-2 text-left font-medium">규격</th>
                <th className="px-3 py-2 text-left font-medium">COA 값</th>
                <th className="px-3 py-2 text-left font-medium">신뢰도</th>
                <th className="px-3 py-2 text-left font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {specs.map((spec, i) => {
                const result = results[i];
                const hasValue = result.coaValue.trim().length > 0;
                const quickCheck = hasValue ? quickCheckCompliance(spec, result.coaValue) : null;

                return (
                  <tr key={spec.id} className="border-b">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {spec.testItem}
                        {spec.isCritical && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0">필수</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">
                      {formatSpecCriteria(spec)}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={result.coaValue}
                        onChange={(e) => updateResult(i, "coaValue", e.target.value)}
                        placeholder="측정값 입력"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        value={result.ocrConfidence}
                        onChange={(e) => updateResult(i, "ocrConfidence", parseFloat(e.target.value) || 0)}
                        className="h-8 w-20 text-sm"
                        min={0}
                        max={100}
                        step={0.1}
                      />
                    </td>
                    <td className="px-3 py-2">
                      {quickCheck === "pass" && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {quickCheck === "fail" && <XCircle className="h-5 w-5 text-red-600" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={processing || !imagePath}>
            {processing ? "처리 중..." : "검수 실행"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function quickCheckCompliance(spec: Spec, coaValue: string): "pass" | "fail" | null {
  if (spec.specType === "negative") {
    const lower = coaValue.toLowerCase().trim();
    return ["negative", "not detected", "nd", "음성", "불검출"].includes(lower) ? "pass" : "fail";
  }
  const cleaned = coaValue.replace(/[^0-9.\-]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  switch (spec.specType) {
    case "max": return num <= parseFloat(spec.specMax ?? "0") ? "pass" : "fail";
    case "min": return num >= parseFloat(spec.specMin ?? "0") ? "pass" : "fail";
    case "range":
      return num >= parseFloat(spec.specMin ?? "0") && num <= parseFloat(spec.specMax ?? "0") ? "pass" : "fail";
    default: return null;
  }
}
