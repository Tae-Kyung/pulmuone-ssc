"use server";

import { db } from "@/lib/db";
import { coaInspections, coaInspectionItems, inboundLots, materialSpecs, alerts } from "@ssc/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function getCoaInspections() {
  return db.query.coaInspections.findMany({
    with: {
      lot: { with: { receipt: { with: { supplier: true } } } },
      material: true,
      items: true,
    },
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });
}

export async function getCoaById(id: string) {
  return db.query.coaInspections.findFirst({
    where: eq(coaInspections.id, id),
    with: {
      lot: { with: { receipt: { with: { supplier: true } } } },
      material: { with: { specs: { orderBy: (s, { asc }) => [asc(s.sortOrder)] } } },
      items: { with: { spec: true } },
    },
  });
}

export async function getSpecsForMaterial(materialId: string) {
  return db.query.materialSpecs.findMany({
    where: and(eq(materialSpecs.materialId, materialId), eq(materialSpecs.isActive, true)),
    orderBy: (s, { asc }) => [asc(s.sortOrder)],
  });
}

export async function uploadCoaImage(formData: FormData): Promise<string> {
  const file = formData.get("file") as File;
  if (!file) throw new Error("파일이 없습니다.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "coa");

  await mkdir(uploadDir, { recursive: true });
  const filePath = join(uploadDir, filename);
  await writeFile(filePath, buffer);

  return `/uploads/coa/${filename}`;
}

export async function createCoaInspection(data: {
  lotId: string;
  materialId: string;
  imagePath: string;
}) {
  const [inspection] = await db
    .insert(coaInspections)
    .values({
      lotId: data.lotId,
      materialId: data.materialId,
      imagePath: data.imagePath,
      ocrStatus: "pending",
    })
    .returning();

  // LOT에 COA 연결
  await db
    .update(inboundLots)
    .set({ coaId: inspection.id, updatedAt: new Date() })
    .where(eq(inboundLots.id, data.lotId));

  revalidatePath("/coa");
  revalidatePath("/inbound");
  return inspection;
}

// OCR 결과를 수동 입력하거나 AI로 추출한 결과를 저장하는 함수
export async function saveOcrResults(
  inspectionId: string,
  materialId: string,
  results: { specId: string; testItem: string; coaValue: string; ocrConfidence: number }[]
) {
  const specs = await db.query.materialSpecs.findMany({
    where: eq(materialSpecs.materialId, materialId),
  });

  const items: {
    inspectionId: string;
    specId: string;
    testItem: string;
    specCriteria: string;
    coaValue: string;
    coaNumeric: string | null;
    status: string;
    ocrConfidence: string;
    isAlert: boolean;
  }[] = [];

  let failCount = 0;
  let totalConfidence = 0;

  for (const r of results) {
    const spec = specs.find((s) => s.id === r.specId);
    if (!spec) continue;

    // 규격 자동비교
    const { status, isAlert } = checkCompliance(spec, r.coaValue);
    if (status === "fail") failCount++;
    totalConfidence += r.ocrConfidence;

    // 규격 기준 텍스트 생성
    let specCriteria = "";
    switch (spec.specType) {
      case "max": specCriteria = `≤ ${spec.specMax} ${spec.unit ?? ""}`; break;
      case "min": specCriteria = `≥ ${spec.specMin} ${spec.unit ?? ""}`; break;
      case "range": specCriteria = `${spec.specMin} - ${spec.specMax} ${spec.unit ?? ""}`; break;
      case "negative": specCriteria = spec.specText ?? "Negative"; break;
      case "exact": specCriteria = `= ${spec.specText ?? spec.specMax}`; break;
    }

    const numericVal = extractNumeric(r.coaValue);

    items.push({
      inspectionId,
      specId: r.specId,
      testItem: r.testItem,
      specCriteria: specCriteria.trim(),
      coaValue: r.coaValue,
      coaNumeric: numericVal !== null ? String(numericVal) : null,
      status,
      ocrConfidence: String(r.ocrConfidence),
      isAlert,
    });
  }

  // 기존 항목 삭제 후 새로 삽입
  await db.delete(coaInspectionItems).where(eq(coaInspectionItems.inspectionId, inspectionId));
  if (items.length > 0) {
    await db.insert(coaInspectionItems).values(items);
  }

  const avgConfidence = results.length > 0 ? totalConfidence / results.length : 0;
  const overallResult = failCount > 0 ? "fail" : "pass";

  await db
    .update(coaInspections)
    .set({
      ocrStatus: "completed",
      overallResult,
      avgConfidence: String(avgConfidence.toFixed(2)),
      updatedAt: new Date(),
    })
    .where(eq(coaInspections.id, inspectionId));

  // fail 시 LOT hold + 알림 생성
  if (overallResult === "fail") {
    const inspection = await db.query.coaInspections.findFirst({
      where: eq(coaInspections.id, inspectionId),
    });
    if (inspection) {
      await db
        .update(inboundLots)
        .set({ status: "hold", updatedAt: new Date() })
        .where(eq(inboundLots.id, inspection.lotId));

      await db.insert(alerts).values({
        alertType: "rejected",
        severity: "critical",
        title: "COA 검수 부적합 발생",
        message: `검수 ID ${inspectionId}에서 ${failCount}건의 부적합 항목이 발견되었습니다. 해당 LOT가 Hold 처리되었습니다.`,
        referenceType: "coa",
        referenceId: inspectionId,
      });
    }
  }

  revalidatePath("/coa");
  revalidatePath("/inbound");
  return { overallResult, failCount, avgConfidence };
}

// 담당자 최종 승인/반려
export async function approveCoaInspection(
  inspectionId: string,
  approved: boolean,
  reviewComment?: string
) {
  const inspection = await db.query.coaInspections.findFirst({
    where: eq(coaInspections.id, inspectionId),
  });
  if (!inspection) throw new Error("검수 건을 찾을 수 없습니다.");

  await db
    .update(coaInspections)
    .set({
      overallResult: approved ? "pass" : "fail",
      reviewedAt: new Date(),
      reviewComment: reviewComment || null,
      updatedAt: new Date(),
    })
    .where(eq(coaInspections.id, inspectionId));

  // LOT 상태 업데이트
  const newLotStatus = approved ? "available" : "rejected";
  await db
    .update(inboundLots)
    .set({ status: newLotStatus, updatedAt: new Date() })
    .where(eq(inboundLots.id, inspection.lotId));

  revalidatePath("/coa");
  revalidatePath("/inbound");
}

// --- 유틸 함수 ---

function extractNumeric(value: string): number | null {
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function checkCompliance(
  spec: { specType: string; specMin: string | null; specMax: string | null; specText: string | null },
  coaValue: string
): { status: string; isAlert: boolean } {
  // 텍스트 비교 (Negative 등)
  if (spec.specType === "negative") {
    const lower = coaValue.toLowerCase().trim();
    if (["negative", "not detected", "nd", "음성", "불검출"].includes(lower)) {
      return { status: "pass", isAlert: false };
    }
    return { status: "fail", isAlert: true };
  }

  const numeric = extractNumeric(coaValue);
  if (numeric === null) {
    return { status: "review", isAlert: false };
  }

  switch (spec.specType) {
    case "max": {
      const max = parseFloat(spec.specMax ?? "0");
      return numeric <= max
        ? { status: "pass", isAlert: false }
        : { status: "fail", isAlert: true };
    }
    case "min": {
      const min = parseFloat(spec.specMin ?? "0");
      return numeric >= min
        ? { status: "pass", isAlert: false }
        : { status: "fail", isAlert: true };
    }
    case "range": {
      const min = parseFloat(spec.specMin ?? "0");
      const max = parseFloat(spec.specMax ?? "0");
      return numeric >= min && numeric <= max
        ? { status: "pass", isAlert: false }
        : { status: "fail", isAlert: true };
    }
    default:
      return { status: "review", isAlert: false };
  }
}
