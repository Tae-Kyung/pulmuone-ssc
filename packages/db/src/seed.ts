import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema/index";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL, { schema });

// ── Helper: 오늘 기준 상대 날짜 (YYYY-MM-DD) ──
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function tsAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ── Fixed UUIDs ──
const ID = {
  // Suppliers
  SUP1: "10000000-0000-0000-0000-000000000001", // 대한제분
  SUP2: "10000000-0000-0000-0000-000000000002", // 삼양유지
  SUP3: "10000000-0000-0000-0000-000000000003", // 청미농산
  // Materials
  MAT1: "20000000-0000-0000-0000-000000000001", // 밀가루(강력분)
  MAT2: "20000000-0000-0000-0000-000000000002", // 대두유
  MAT3: "20000000-0000-0000-0000-000000000003", // 신선 대파
  MAT4: "20000000-0000-0000-0000-000000000004", // 양배추 슬라이스
  // Specs
  SP01: "30000000-0000-0000-0000-000000000001",
  SP02: "30000000-0000-0000-0000-000000000002",
  SP03: "30000000-0000-0000-0000-000000000003",
  SP04: "30000000-0000-0000-0000-000000000004",
  SP05: "30000000-0000-0000-0000-000000000005",
  SP06: "30000000-0000-0000-0000-000000000006",
  SP07: "30000000-0000-0000-0000-000000000007",
  SP08: "30000000-0000-0000-0000-000000000008",
  SP09: "30000000-0000-0000-0000-000000000009",
  SP10: "30000000-0000-0000-0000-000000000010",
  SP11: "30000000-0000-0000-0000-000000000011",
  SP12: "30000000-0000-0000-0000-000000000012",
  SP13: "30000000-0000-0000-0000-000000000013",
  SP14: "30000000-0000-0000-0000-000000000014",
  // Locations
  LOC1: "40000000-0000-0000-0000-000000000001", // 상온 창고A-1-1
  LOC2: "40000000-0000-0000-0000-000000000002", // 상온 창고A-1-2
  LOC3: "40000000-0000-0000-0000-000000000003", // 상온 창고A-2-1
  LOC4: "40000000-0000-0000-0000-000000000004", // 냉장 창고B-1-1
  LOC5: "40000000-0000-0000-0000-000000000005", // 냉장 창고B-1-2
  LOC6: "40000000-0000-0000-0000-000000000006", // 냉동 창고C-1-1
  LOC7: "40000000-0000-0000-0000-000000000007", // 검수대기 구역
  // Users
  USR1: "00000000-0000-0000-0000-000000000001", // 관리자
  USR2: "00000000-0000-0000-0000-000000000002", // 품질담당
  USR3: "00000000-0000-0000-0000-000000000003", // 창고담당
  USR4: "00000000-0000-0000-0000-000000000004", // 생산담당
  // Receipts
  RCV1: "50000000-0000-0000-0000-000000000001",
  RCV2: "50000000-0000-0000-0000-000000000002",
  RCV3: "50000000-0000-0000-0000-000000000003",
  RCV4: "50000000-0000-0000-0000-000000000004",
  RCV5: "50000000-0000-0000-0000-000000000005",
  RCV6: "50000000-0000-0000-0000-000000000006",
  // Lots
  LOT1: "60000000-0000-0000-0000-000000000001",
  LOT2: "60000000-0000-0000-0000-000000000002",
  LOT3: "60000000-0000-0000-0000-000000000003",
  LOT4: "60000000-0000-0000-0000-000000000004",
  LOT5: "60000000-0000-0000-0000-000000000005",
  LOT6: "60000000-0000-0000-0000-000000000006",
  // COA Inspections
  COA1: "70000000-0000-0000-0000-000000000001",
  COA2: "70000000-0000-0000-0000-000000000002",
  COA3: "70000000-0000-0000-0000-000000000003",
  COA4: "70000000-0000-0000-0000-000000000004",
  COA5: "70000000-0000-0000-0000-000000000005",
  // Inventory
  INV1: "80000000-0000-0000-0000-000000000001",
  INV2: "80000000-0000-0000-0000-000000000002",
  INV3: "80000000-0000-0000-0000-000000000003",
  INV4: "80000000-0000-0000-0000-000000000004",
  // Inventory Transactions
  TXN01: "81000000-0000-0000-0000-000000000001",
  TXN02: "81000000-0000-0000-0000-000000000002",
  TXN03: "81000000-0000-0000-0000-000000000003",
  TXN04: "81000000-0000-0000-0000-000000000004",
  TXN05: "81000000-0000-0000-0000-000000000005",
  TXN06: "81000000-0000-0000-0000-000000000006",
  TXN07: "81000000-0000-0000-0000-000000000007",
  TXN08: "81000000-0000-0000-0000-000000000008",
  TXN09: "81000000-0000-0000-0000-000000000009",
  TXN10: "81000000-0000-0000-0000-000000000010",
  // Production Orders
  PRD1: "90000000-0000-0000-0000-000000000001",
  PRD2: "90000000-0000-0000-0000-000000000002",
  PRD3: "90000000-0000-0000-0000-000000000003",
  // Production Order Materials
  POM1: "91000000-0000-0000-0000-000000000001",
  POM2: "91000000-0000-0000-0000-000000000002",
  POM3: "91000000-0000-0000-0000-000000000003",
  POM4: "91000000-0000-0000-0000-000000000004",
  POM5: "91000000-0000-0000-0000-000000000005",
  // Production Inputs
  PIN1: "92000000-0000-0000-0000-000000000001",
  PIN2: "92000000-0000-0000-0000-000000000002",
  PIN3: "92000000-0000-0000-0000-000000000003",
  PIN4: "92000000-0000-0000-0000-000000000004",
  // Alerts
  ALT1: "a0000000-0000-0000-0000-000000000001",
  ALT2: "a0000000-0000-0000-0000-000000000002",
  ALT3: "a0000000-0000-0000-0000-000000000003",
  ALT4: "a0000000-0000-0000-0000-000000000004",
  ALT5: "a0000000-0000-0000-0000-000000000005",
  ALT6: "a0000000-0000-0000-0000-000000000006",
};

async function seed() {
  console.log("=== Pulmuone SSC 2.0 Sample Data Seeding ===\n");

  // ── 기존 데이터 전체 삭제 (CASCADE) ──
  console.log("[1/12] Clearing existing data...");
  await db.execute(sql`TRUNCATE TABLE
    alerts,
    production_inputs, production_order_materials, production_orders,
    inventory_transactions, inventory,
    coa_inspection_items, coa_inspections,
    inbound_lots, inbound_receipts,
    material_specs, materials, suppliers, locations, user_profiles
    CASCADE`);

  // ══════════════════════════════════════════════
  // MASTER DATA
  // ══════════════════════════════════════════════

  // ── 공급업체 (3개) ──
  console.log("[2/12] Inserting suppliers...");
  await db.insert(schema.suppliers).values([
    {
      id: ID.SUP1, code: "SUP-001", name: "대한제분",
      businessNumber: "101-81-12345", contactName: "김영수",
      contactPhone: "02-1234-5678", contactEmail: "kim@daehanflour.co.kr",
      address: "경기도 안성시 공도읍 산업단지로 123",
    },
    {
      id: ID.SUP2, code: "SUP-002", name: "삼양유지공업",
      businessNumber: "202-82-23456", contactName: "이미선",
      contactPhone: "02-2345-6789", contactEmail: "lee@samyangoil.co.kr",
      address: "충남 아산시 배방읍 식품로 456",
    },
    {
      id: ID.SUP3, code: "SUP-003", name: "청미농산",
      businessNumber: "303-83-34567", contactName: "박진호",
      contactPhone: "031-3456-7890", contactEmail: "park@chungmi.co.kr",
      address: "강원도 원주시 호저면 농산로 789",
    },
  ]);

  // ── 원료 (4개) ──
  console.log("[3/12] Inserting materials...");
  await db.insert(schema.materials).values([
    {
      id: ID.MAT1, code: "RM-FL-001", name: "밀가루 (강력분 1등급)",
      category: "곡물류", unit: "kg", supplierId: ID.SUP1,
      storageType: "ambient", shelfLifeDays: 365, safetyStock: "500",
    },
    {
      id: ID.MAT2, code: "RM-OL-001", name: "정제 대두유",
      category: "유지류", unit: "L", supplierId: ID.SUP2,
      storageType: "cold", shelfLifeDays: 180, safetyStock: "200",
    },
    {
      id: ID.MAT3, code: "RM-VG-001", name: "신선 대파",
      category: "채소류", unit: "kg", supplierId: ID.SUP3,
      storageType: "cold", shelfLifeDays: 7, safetyStock: "100",
    },
    {
      id: ID.MAT4, code: "RM-VG-002", name: "양배추 슬라이스",
      category: "채소류", unit: "kg", supplierId: ID.SUP3,
      storageType: "cold", shelfLifeDays: 5, safetyStock: "150",
    },
  ]);

  // ── 검사 규격 ──
  console.log("[4/12] Inserting material specs...");
  await db.insert(schema.materialSpecs).values([
    // 밀가루 규격 (6항목)
    { id: ID.SP01, materialId: ID.MAT1, testItem: "수분", specType: "max", specMax: "14.0", unit: "%", isCritical: true, sortOrder: 1 },
    { id: ID.SP02, materialId: ID.MAT1, testItem: "pH", specType: "range", specMin: "5.5", specMax: "7.0", unit: "", isCritical: true, sortOrder: 2 },
    { id: ID.SP03, materialId: ID.MAT1, testItem: "일반세균", specType: "max", specMax: "10000", unit: "CFU/g", isCritical: true, sortOrder: 3 },
    { id: ID.SP04, materialId: ID.MAT1, testItem: "대장균", specType: "negative", specText: "음성", unit: "", isCritical: true, sortOrder: 4 },
    { id: ID.SP05, materialId: ID.MAT1, testItem: "회분", specType: "max", specMax: "0.6", unit: "%", isCritical: false, sortOrder: 5 },
    { id: ID.SP06, materialId: ID.MAT1, testItem: "중금속(납)", specType: "max", specMax: "0.3", unit: "mg/kg", isCritical: false, sortOrder: 6 },
    // 대두유 규격 (3항목)
    { id: ID.SP07, materialId: ID.MAT2, testItem: "산가", specType: "max", specMax: "0.6", unit: "mg KOH/g", isCritical: true, sortOrder: 1 },
    { id: ID.SP08, materialId: ID.MAT2, testItem: "과산화물가", specType: "max", specMax: "5.0", unit: "meq/kg", isCritical: true, sortOrder: 2 },
    { id: ID.SP09, materialId: ID.MAT2, testItem: "색도", specType: "max", specMax: "2.5", unit: "Y+5R", isCritical: false, sortOrder: 3 },
    // 대파 규격 (3항목)
    { id: ID.SP10, materialId: ID.MAT3, testItem: "잔류농약", specType: "negative", specText: "불검출", unit: "", isCritical: true, sortOrder: 1 },
    { id: ID.SP11, materialId: ID.MAT3, testItem: "대장균", specType: "negative", specText: "음성", unit: "", isCritical: true, sortOrder: 2 },
    { id: ID.SP12, materialId: ID.MAT3, testItem: "신선도(외관)", specType: "exact", specText: "양호", unit: "", isCritical: false, sortOrder: 3 },
    // 양배추 규격 (2항목)
    { id: ID.SP13, materialId: ID.MAT4, testItem: "대장균", specType: "negative", specText: "음성", unit: "", isCritical: true, sortOrder: 1 },
    { id: ID.SP14, materialId: ID.MAT4, testItem: "신선도(외관)", specType: "exact", specText: "양호", unit: "", isCritical: false, sortOrder: 2 },
  ]);

  // ── 보관 위치 (7개) ──
  console.log("[5/12] Inserting locations...");
  await db.insert(schema.locations).values([
    { id: ID.LOC1, code: "A-Z1-R1-L1", warehouse: "상온창고 A", zone: "1구역", rack: "선반 1", level: "1단", storageType: "ambient" },
    { id: ID.LOC2, code: "A-Z1-R1-L2", warehouse: "상온창고 A", zone: "1구역", rack: "선반 1", level: "2단", storageType: "ambient" },
    { id: ID.LOC3, code: "A-Z2-R1-L1", warehouse: "상온창고 A", zone: "2구역", rack: "선반 1", level: "1단", storageType: "ambient" },
    { id: ID.LOC4, code: "B-Z1-R1-L1", warehouse: "냉장창고 B", zone: "1구역", rack: "선반 1", level: "1단", storageType: "cold" },
    { id: ID.LOC5, code: "B-Z1-R2-L1", warehouse: "냉장창고 B", zone: "1구역", rack: "선반 2", level: "1단", storageType: "cold" },
    { id: ID.LOC6, code: "C-Z1-R1-L1", warehouse: "냉동창고 C", zone: "1구역", rack: "선반 1", level: "1단", storageType: "frozen" },
    { id: ID.LOC7, code: "Q-AREA-01", warehouse: "검수대기장", zone: "입고구역", rack: "-", level: "-", storageType: "ambient" },
  ]);

  // ── 사용자 (4명) ──
  console.log("[6/12] Inserting user profiles...");
  await db.insert(schema.userProfiles).values([
    { id: ID.USR1, employeeId: "EMP-001", name: "김동수", department: "품질기술센터", role: "admin", phone: "010-1111-0001" },
    { id: ID.USR2, employeeId: "EMP-002", name: "이품질", department: "품질기술센터 S&A팀", role: "quality_manager", phone: "010-1111-0002" },
    { id: ID.USR3, employeeId: "EMP-003", name: "박창고", department: "물류팀", role: "warehouse_manager", phone: "010-1111-0003" },
    { id: ID.USR4, employeeId: "EMP-004", name: "최현장", department: "생산팀", role: "operator", phone: "010-1111-0004" },
  ]);

  // ══════════════════════════════════════════════
  // SCENARIO A: 밀가루 500kg 정상 입고 (10일 전)
  //   → COA 적합 → 재고입고 → 생산에 200kg 투입 → 잔량 300kg
  // ══════════════════════════════════════════════

  console.log("[7/12] Inserting inbound receipts & lots...");
  await db.insert(schema.inboundReceipts).values([
    {
      id: ID.RCV1, receiptNumber: "RCV-2026-001",
      materialId: ID.MAT1, supplierId: ID.SUP1,
      receivedDate: daysAgo(10), totalQuantity: "500", unit: "kg",
      status: "approved", receivedBy: ID.USR3,
      notes: "정기 발주분 입고",
      createdAt: tsAgo(10), updatedAt: tsAgo(10),
    },
    // SCENARIO B: 대두유 100L (16일 전, 제조일 6개월전 → 소비기한 D-15)
    {
      id: ID.RCV2, receiptNumber: "RCV-2026-002",
      materialId: ID.MAT2, supplierId: ID.SUP2,
      receivedDate: daysAgo(16), totalQuantity: "100", unit: "L",
      status: "approved", receivedBy: ID.USR3,
      notes: "월간 정기 발주",
      createdAt: tsAgo(16), updatedAt: tsAgo(16),
    },
    // SCENARIO C: 대파 50kg (3일 전)
    {
      id: ID.RCV3, receiptNumber: "RCV-2026-003",
      materialId: ID.MAT3, supplierId: ID.SUP3,
      receivedDate: daysAgo(3), totalQuantity: "50", unit: "kg",
      status: "approved", receivedBy: ID.USR3,
      notes: "긴급 추가 발주",
      createdAt: tsAgo(3), updatedAt: tsAgo(3),
    },
    // SCENARIO D: 양배추 80kg (2일 전) → COA 부적합
    {
      id: ID.RCV4, receiptNumber: "RCV-2026-004",
      materialId: ID.MAT4, supplierId: ID.SUP3,
      receivedDate: daysAgo(2), totalQuantity: "80", unit: "kg",
      status: "rejected", receivedBy: ID.USR3,
      notes: "COA 검사 부적합 - 대장균 검출",
      createdAt: tsAgo(2), updatedAt: tsAgo(2),
    },
    // SCENARIO E: 밀가루 500kg (오늘) → 검사 대기
    {
      id: ID.RCV5, receiptNumber: "RCV-2026-005",
      materialId: ID.MAT1, supplierId: ID.SUP1,
      receivedDate: daysAgo(0), totalQuantity: "500", unit: "kg",
      status: "pending", receivedBy: ID.USR3,
      notes: "추가 발주분 입고, 검사 대기",
      createdAt: tsAgo(0), updatedAt: tsAgo(0),
    },
    // SCENARIO F: 양배추 재입고 80kg (1일 전) → COA 적합
    {
      id: ID.RCV6, receiptNumber: "RCV-2026-006",
      materialId: ID.MAT4, supplierId: ID.SUP3,
      receivedDate: daysAgo(1), totalQuantity: "80", unit: "kg",
      status: "approved", receivedBy: ID.USR3,
      notes: "재발주분 (기존 부적합 대체)",
      createdAt: tsAgo(1), updatedAt: tsAgo(1),
    },
  ]);

  // ── LOT ──
  await db.insert(schema.inboundLots).values([
    // A: 밀가루 500kg → 적합, 재고에 입고됨
    {
      id: ID.LOT1, receiptId: ID.RCV1, lotNumber: "LOT-20261021-001",
      supplierLot: "DH-2026-F1021", materialId: ID.MAT1,
      quantity: "500", unit: "kg",
      manufactureDate: daysAgo(15), expiryDate: daysFromNow(350),
      barcodeValue: "SSC-RMFL001-20261021001", barcodeType: "QR",
      status: "available", locationId: ID.LOC1, coaId: ID.COA1,
      createdAt: tsAgo(10), updatedAt: tsAgo(6),
    },
    // B: 대두유 100L → 적합, 소비기한 임박
    {
      id: ID.LOT2, receiptId: ID.RCV2, lotNumber: "LOT-20261015-001",
      supplierLot: "SY-2026-O0501", materialId: ID.MAT2,
      quantity: "100", unit: "L",
      manufactureDate: daysAgo(180), expiryDate: daysFromNow(15),
      barcodeValue: "SSC-RMOL001-20261015001", barcodeType: "QR",
      status: "available", locationId: ID.LOC4, coaId: ID.COA2,
      createdAt: tsAgo(16), updatedAt: tsAgo(15),
    },
    // C: 대파 50kg → 적합, 소비기한 D-4
    {
      id: ID.LOT3, receiptId: ID.RCV3, lotNumber: "LOT-20261028-001",
      supplierLot: "CM-2026-V1028", materialId: ID.MAT3,
      quantity: "50", unit: "kg",
      manufactureDate: daysAgo(3), expiryDate: daysFromNow(4),
      barcodeValue: "SSC-RMVG001-20261028001", barcodeType: "QR",
      status: "available", locationId: ID.LOC5, coaId: ID.COA3,
      createdAt: tsAgo(3), updatedAt: tsAgo(2),
    },
    // D: 양배추 80kg → 부적합(대장균) → rejected
    {
      id: ID.LOT4, receiptId: ID.RCV4, lotNumber: "LOT-20261029-001",
      supplierLot: "CM-2026-C1029", materialId: ID.MAT4,
      quantity: "80", unit: "kg",
      manufactureDate: daysAgo(2), expiryDate: daysFromNow(3),
      barcodeValue: "SSC-RMVG002-20261029001", barcodeType: "QR",
      status: "rejected", locationId: ID.LOC7, coaId: ID.COA4,
      createdAt: tsAgo(2), updatedAt: tsAgo(2),
    },
    // E: 밀가루 500kg → 검사 대기중 (오늘)
    {
      id: ID.LOT5, receiptId: ID.RCV5, lotNumber: "LOT-20261031-001",
      supplierLot: "DH-2026-F1031", materialId: ID.MAT1,
      quantity: "500", unit: "kg",
      manufactureDate: daysAgo(5), expiryDate: daysFromNow(360),
      barcodeValue: "SSC-RMFL001-20261031001", barcodeType: "QR",
      status: "inspection", locationId: ID.LOC7, coaId: null,
      createdAt: tsAgo(0), updatedAt: tsAgo(0),
    },
    // F: 양배추 재입고 80kg → 적합
    {
      id: ID.LOT6, receiptId: ID.RCV6, lotNumber: "LOT-20261030-001",
      supplierLot: "CM-2026-C1030", materialId: ID.MAT4,
      quantity: "80", unit: "kg",
      manufactureDate: daysAgo(1), expiryDate: daysFromNow(4),
      barcodeValue: "SSC-RMVG002-20261030001", barcodeType: "QR",
      status: "available", locationId: ID.LOC5, coaId: ID.COA5,
      createdAt: tsAgo(1), updatedAt: tsAgo(1),
    },
  ]);

  // ══════════════════════════════════════════════
  // COA INSPECTIONS
  // ══════════════════════════════════════════════

  console.log("[8/12] Inserting COA inspections...");

  // COA1: 밀가루 적합
  await db.insert(schema.coaInspections).values([
    {
      id: ID.COA1, lotId: ID.LOT1, materialId: ID.MAT1,
      imagePath: "/coa/2026/10/coa-lot1-flour.jpg",
      ocrStatus: "completed", overallResult: "pass", avgConfidence: "94.5",
      reviewedBy: ID.USR2, reviewedAt: tsAgo(9),
      reviewComment: "전 항목 적합. 입고 승인.",
      createdAt: tsAgo(10), updatedAt: tsAgo(9),
    },
    // COA2: 대두유 적합
    {
      id: ID.COA2, lotId: ID.LOT2, materialId: ID.MAT2,
      imagePath: "/coa/2026/10/coa-lot2-oil.jpg",
      ocrStatus: "completed", overallResult: "pass", avgConfidence: "91.2",
      reviewedBy: ID.USR2, reviewedAt: tsAgo(15),
      reviewComment: "산가/과산화물가 적합. 입고 승인.",
      createdAt: tsAgo(16), updatedAt: tsAgo(15),
    },
    // COA3: 대파 적합
    {
      id: ID.COA3, lotId: ID.LOT3, materialId: ID.MAT3,
      imagePath: "/coa/2026/10/coa-lot3-greenonion.jpg",
      ocrStatus: "completed", overallResult: "pass", avgConfidence: "88.0",
      reviewedBy: ID.USR2, reviewedAt: tsAgo(2),
      reviewComment: "잔류농약 불검출, 외관 양호. 입고 승인.",
      createdAt: tsAgo(3), updatedAt: tsAgo(2),
    },
    // COA4: 양배추 부적합 (대장균 양성)
    {
      id: ID.COA4, lotId: ID.LOT4, materialId: ID.MAT4,
      imagePath: "/coa/2026/10/coa-lot4-cabbage.jpg",
      ocrStatus: "completed", overallResult: "fail", avgConfidence: "92.8",
      reviewedBy: ID.USR2, reviewedAt: tsAgo(2),
      reviewComment: "대장균 양성 검출. 반려 처리. 공급업체 통보 필요.",
      createdAt: tsAgo(2), updatedAt: tsAgo(2),
    },
    // COA5: 양배추 재입고분 적합
    {
      id: ID.COA5, lotId: ID.LOT6, materialId: ID.MAT4,
      imagePath: "/coa/2026/10/coa-lot6-cabbage-re.jpg",
      ocrStatus: "completed", overallResult: "pass", avgConfidence: "90.5",
      reviewedBy: ID.USR2, reviewedAt: tsAgo(1),
      reviewComment: "재입고분 전 항목 적합. 입고 승인.",
      createdAt: tsAgo(1), updatedAt: tsAgo(1),
    },
  ]);

  // ── COA 검사 항목 (세부 결과) ──
  await db.insert(schema.coaInspectionItems).values([
    // COA1: 밀가루 6항목 전부 적합
    { inspectionId: ID.COA1, specId: ID.SP01, testItem: "수분", specCriteria: "14.0% 이하", coaValue: "12.3", coaNumeric: "12.3", status: "pass", ocrConfidence: "96.0" },
    { inspectionId: ID.COA1, specId: ID.SP02, testItem: "pH", specCriteria: "5.5 ~ 7.0", coaValue: "6.2", coaNumeric: "6.2", status: "pass", ocrConfidence: "94.0" },
    { inspectionId: ID.COA1, specId: ID.SP03, testItem: "일반세균", specCriteria: "10,000 CFU/g 이하", coaValue: "3,200", coaNumeric: "3200", status: "pass", ocrConfidence: "93.0" },
    { inspectionId: ID.COA1, specId: ID.SP04, testItem: "대장균", specCriteria: "음성", coaValue: "음성", coaNumeric: null, status: "pass", ocrConfidence: "97.0" },
    { inspectionId: ID.COA1, specId: ID.SP05, testItem: "회분", specCriteria: "0.6% 이하", coaValue: "0.42", coaNumeric: "0.42", status: "pass", ocrConfidence: "91.0" },
    { inspectionId: ID.COA1, specId: ID.SP06, testItem: "중금속(납)", specCriteria: "0.3 mg/kg 이하", coaValue: "0.05", coaNumeric: "0.05", status: "pass", ocrConfidence: "96.0" },
    // COA2: 대두유 3항목 적합
    { inspectionId: ID.COA2, specId: ID.SP07, testItem: "산가", specCriteria: "0.6 mg KOH/g 이하", coaValue: "0.32", coaNumeric: "0.32", status: "pass", ocrConfidence: "92.0" },
    { inspectionId: ID.COA2, specId: ID.SP08, testItem: "과산화물가", specCriteria: "5.0 meq/kg 이하", coaValue: "2.1", coaNumeric: "2.1", status: "pass", ocrConfidence: "90.0" },
    { inspectionId: ID.COA2, specId: ID.SP09, testItem: "색도", specCriteria: "2.5 Y+5R 이하", coaValue: "1.8", coaNumeric: "1.8", status: "pass", ocrConfidence: "91.5" },
    // COA3: 대파 3항목 적합
    { inspectionId: ID.COA3, specId: ID.SP10, testItem: "잔류농약", specCriteria: "불검출", coaValue: "불검출", coaNumeric: null, status: "pass", ocrConfidence: "89.0" },
    { inspectionId: ID.COA3, specId: ID.SP11, testItem: "대장균", specCriteria: "음성", coaValue: "음성", coaNumeric: null, status: "pass", ocrConfidence: "88.0" },
    { inspectionId: ID.COA3, specId: ID.SP12, testItem: "신선도(외관)", specCriteria: "양호", coaValue: "양호", coaNumeric: null, status: "pass", ocrConfidence: "87.0" },
    // COA4: 양배추 부적합 - 대장균 양성!
    { inspectionId: ID.COA4, specId: ID.SP13, testItem: "대장균", specCriteria: "음성", coaValue: "양성", coaNumeric: null, status: "fail", ocrConfidence: "95.0", isAlert: true },
    { inspectionId: ID.COA4, specId: ID.SP14, testItem: "신선도(외관)", specCriteria: "양호", coaValue: "양호", coaNumeric: null, status: "pass", ocrConfidence: "90.5" },
    // COA5: 양배추 재입고 적합
    { inspectionId: ID.COA5, specId: ID.SP13, testItem: "대장균", specCriteria: "음성", coaValue: "음성", coaNumeric: null, status: "pass", ocrConfidence: "91.0" },
    { inspectionId: ID.COA5, specId: ID.SP14, testItem: "신선도(외관)", specCriteria: "양호", coaValue: "양호", coaNumeric: null, status: "pass", ocrConfidence: "90.0" },
  ]);

  // ══════════════════════════════════════════════
  // INVENTORY (적합 LOT만 재고에 존재)
  // ══════════════════════════════════════════════

  console.log("[9/12] Inserting inventory...");
  await db.insert(schema.inventory).values([
    // LOT1: 밀가루 500kg 입고 → 200kg 생산투입 → 잔량 300kg
    {
      id: ID.INV1, lotId: ID.LOT1, materialId: ID.MAT1, locationId: ID.LOC1,
      quantity: "300", status: "available",
      lastMovedAt: tsAgo(6), createdAt: tsAgo(9), updatedAt: tsAgo(6),
    },
    // LOT2: 대두유 100L → 20L 생산투입 → 잔량 80L
    {
      id: ID.INV2, lotId: ID.LOT2, materialId: ID.MAT2, locationId: ID.LOC4,
      quantity: "80", status: "available",
      lastMovedAt: tsAgo(6), createdAt: tsAgo(15), updatedAt: tsAgo(6),
    },
    // LOT3: 대파 50kg → 30kg 투입 → 잔량 20kg
    {
      id: ID.INV3, lotId: ID.LOT3, materialId: ID.MAT3, locationId: ID.LOC5,
      quantity: "20", status: "available",
      lastMovedAt: tsAgo(2), createdAt: tsAgo(2), updatedAt: tsAgo(2),
    },
    // LOT6: 양배추(재입고) 80kg → 60kg 투입 → 잔량 20kg
    {
      id: ID.INV4, lotId: ID.LOT6, materialId: ID.MAT4, locationId: ID.LOC5,
      quantity: "20", status: "available",
      lastMovedAt: tsAgo(1), createdAt: tsAgo(1), updatedAt: tsAgo(1),
    },
  ]);

  // ── 재고 트랜잭션 (이력) ──
  console.log("[10/12] Inserting inventory transactions...");
  await db.insert(schema.inventoryTransactions).values([
    // A: 밀가루 입고
    { id: ID.TXN01, lotId: ID.LOT1, materialId: ID.MAT1, txType: "inbound", quantity: "500", toLocationId: ID.LOC1, performedBy: ID.USR3, notes: "입고검사 적합 후 입고", createdAt: tsAgo(9) },
    // A: 밀가루 200kg 생산투입
    { id: ID.TXN02, lotId: ID.LOT1, materialId: ID.MAT1, txType: "consume", quantity: "200", fromLocationId: ID.LOC1, referenceType: "production_order", referenceId: ID.PRD1, performedBy: ID.USR4, notes: "PRD-2026-001 생면 생산투입", createdAt: tsAgo(6) },
    // B: 대두유 입고
    { id: ID.TXN03, lotId: ID.LOT2, materialId: ID.MAT2, txType: "inbound", quantity: "100", toLocationId: ID.LOC4, performedBy: ID.USR3, notes: "입고검사 적합 후 입고", createdAt: tsAgo(15) },
    // B: 대두유 20L 생산투입
    { id: ID.TXN04, lotId: ID.LOT2, materialId: ID.MAT2, txType: "consume", quantity: "20", fromLocationId: ID.LOC4, referenceType: "production_order", referenceId: ID.PRD1, performedBy: ID.USR4, notes: "PRD-2026-001 생면 생산투입", createdAt: tsAgo(6) },
    // C: 대파 입고
    { id: ID.TXN05, lotId: ID.LOT3, materialId: ID.MAT3, txType: "inbound", quantity: "50", toLocationId: ID.LOC5, performedBy: ID.USR3, notes: "입고검사 적합 후 입고", createdAt: tsAgo(2) },
    // C: 대파 30kg 생산투입
    { id: ID.TXN06, lotId: ID.LOT3, materialId: ID.MAT3, txType: "consume", quantity: "30", fromLocationId: ID.LOC5, referenceType: "production_order", referenceId: ID.PRD2, performedBy: ID.USR4, notes: "PRD-2026-002 겉절이 생산투입", createdAt: tsAgo(2) },
    // D: 양배추 검수대기장 입고 후 부적합 → 반려
    { id: ID.TXN07, lotId: ID.LOT4, materialId: ID.MAT4, txType: "inbound", quantity: "80", toLocationId: ID.LOC7, performedBy: ID.USR3, notes: "검수대기장 입고 (COA 검사 대기)", createdAt: tsAgo(2) },
    { id: ID.TXN10, lotId: ID.LOT4, materialId: ID.MAT4, txType: "reject", quantity: "80", fromLocationId: ID.LOC7, performedBy: ID.USR2, notes: "COA 부적합(대장균 양성). 검수대기장에서 반려 처리.", createdAt: tsAgo(2) },
    // F: 양배추 재입고
    { id: ID.TXN08, lotId: ID.LOT6, materialId: ID.MAT4, txType: "inbound", quantity: "80", toLocationId: ID.LOC5, performedBy: ID.USR3, notes: "재발주분 입고검사 적합 후 입고", createdAt: tsAgo(1) },
    // F: 양배추 60kg 생산투입
    { id: ID.TXN09, lotId: ID.LOT6, materialId: ID.MAT4, txType: "consume", quantity: "60", fromLocationId: ID.LOC5, referenceType: "production_order", referenceId: ID.PRD2, performedBy: ID.USR4, notes: "PRD-2026-002 겉절이 생산투입", createdAt: tsAgo(1) },
  ]);

  // ══════════════════════════════════════════════
  // PRODUCTION ORDERS
  // ══════════════════════════════════════════════

  console.log("[11/12] Inserting production orders...");

  // PRD1: 풀무원 생면 (완료) - 밀가루200kg + 대두유20L
  await db.insert(schema.productionOrders).values([
    {
      id: ID.PRD1, orderNumber: "PRD-2026-001", productName: "풀무원 생면",
      productLot: "PL-20261025-001", plannedDate: daysAgo(6),
      status: "completed", createdBy: ID.USR4,
      createdAt: tsAgo(7), updatedAt: tsAgo(6),
    },
    // PRD2: 풀무원 겉절이 (완료) - 대파30kg + 양배추60kg
    {
      id: ID.PRD2, orderNumber: "PRD-2026-002", productName: "풀무원 겉절이",
      productLot: "PL-20261029-001", plannedDate: daysAgo(2),
      status: "completed", createdBy: ID.USR4,
      createdAt: tsAgo(3), updatedAt: tsAgo(1),
    },
    // PRD3: 풀무원 칼국수 (계획 - 내일) - 밀가루 300kg 필요 → 현 재고 300kg (빠듯)
    {
      id: ID.PRD3, orderNumber: "PRD-2026-003", productName: "풀무원 칼국수",
      productLot: "PL-20261101-001", plannedDate: daysFromNow(1),
      status: "planned", createdBy: ID.USR4,
      createdAt: tsAgo(1), updatedAt: tsAgo(1),
    },
  ]);

  // ── 생산 소요 원료 ──
  await db.insert(schema.productionOrderMaterials).values([
    { id: ID.POM1, orderId: ID.PRD1, materialId: ID.MAT1, requiredQty: "200", unit: "kg" },
    { id: ID.POM2, orderId: ID.PRD1, materialId: ID.MAT2, requiredQty: "20", unit: "L" },
    { id: ID.POM3, orderId: ID.PRD2, materialId: ID.MAT3, requiredQty: "30", unit: "kg" },
    { id: ID.POM4, orderId: ID.PRD2, materialId: ID.MAT4, requiredQty: "60", unit: "kg" },
    { id: ID.POM5, orderId: ID.PRD3, materialId: ID.MAT1, requiredQty: "300", unit: "kg" },
  ]);

  // ── 실제 생산 투입 (바코드 스캔 기록) ──
  await db.insert(schema.productionInputs).values([
    {
      id: ID.PIN1, orderId: ID.PRD1, lotId: ID.LOT1, materialId: ID.MAT1,
      inputQuantity: "200", unit: "kg", productLot: "PL-20261025-001",
      scannedBarcode: "SSC-RMFL001-20261021001", inputBy: ID.USR4, inputAt: tsAgo(6),
    },
    {
      id: ID.PIN2, orderId: ID.PRD1, lotId: ID.LOT2, materialId: ID.MAT2,
      inputQuantity: "20", unit: "L", productLot: "PL-20261025-001",
      scannedBarcode: "SSC-RMOL001-20261015001", inputBy: ID.USR4, inputAt: tsAgo(6),
    },
    {
      id: ID.PIN3, orderId: ID.PRD2, lotId: ID.LOT3, materialId: ID.MAT3,
      inputQuantity: "30", unit: "kg", productLot: "PL-20261029-001",
      scannedBarcode: "SSC-RMVG001-20261028001", inputBy: ID.USR4, inputAt: tsAgo(2),
    },
    {
      id: ID.PIN4, orderId: ID.PRD2, lotId: ID.LOT6, materialId: ID.MAT4,
      inputQuantity: "60", unit: "kg", productLot: "PL-20261029-001",
      scannedBarcode: "SSC-RMVG002-20261030001", inputBy: ID.USR4, inputAt: tsAgo(1),
    },
  ]);

  // ══════════════════════════════════════════════
  // ALERTS (업무 알림)
  // ══════════════════════════════════════════════

  console.log("[12/12] Inserting alerts...");
  await db.insert(schema.alerts).values([
    // 소비기한 D-15: 대두유
    {
      id: ID.ALT1, alertType: "expiry_d30", severity: "warning",
      title: "[소비기한 임박] 정제 대두유 LOT-20261015-001",
      message: "LOT-20261015-001 (정제 대두유 80L)의 소비기한이 15일 남았습니다. (만료: " + daysFromNow(15) + ")",
      referenceType: "inbound_lot", referenceId: ID.LOT2,
      targetUserId: ID.USR3, createdAt: tsAgo(0),
    },
    // 소비기한 D-4: 대파
    {
      id: ID.ALT2, alertType: "expiry_d7", severity: "critical",
      title: "[소비기한 긴급] 신선 대파 LOT-20261028-001",
      message: "LOT-20261028-001 (신선 대파 20kg)의 소비기한이 4일 남았습니다. 즉시 사용하거나 폐기 검토가 필요합니다.",
      referenceType: "inbound_lot", referenceId: ID.LOT3,
      targetUserId: ID.USR3, createdAt: tsAgo(0),
    },
    // 소비기한 D-4: 양배추
    {
      id: ID.ALT3, alertType: "expiry_d7", severity: "critical",
      title: "[소비기한 긴급] 양배추 슬라이스 LOT-20261030-001",
      message: "LOT-20261030-001 (양배추 슬라이스 20kg)의 소비기한이 4일 남았습니다. 즉시 사용하거나 폐기 검토가 필요합니다.",
      referenceType: "inbound_lot", referenceId: ID.LOT6,
      targetUserId: ID.USR3, createdAt: tsAgo(0),
    },
    // 부적합 원료 알림
    {
      id: ID.ALT4, alertType: "rejected", severity: "critical",
      title: "[부적합] 양배추 슬라이스 LOT-20261029-001 - 대장균 양성",
      message: "LOT-20261029-001 (양배추 슬라이스 80kg)에서 대장균이 검출되었습니다. 해당 LOT는 반려 처리되었으며, 공급업체(청미농산) 통보가 필요합니다.",
      referenceType: "inbound_lot", referenceId: ID.LOT4,
      targetUserId: ID.USR2, isRead: true, createdAt: tsAgo(2),
    },
    // 안전재고 부족: 양배추 (안전재고 150kg, 현재 20kg)
    {
      id: ID.ALT5, alertType: "low_stock", severity: "warning",
      title: "[재고부족] 양배추 슬라이스 - 안전재고 미달",
      message: "양배추 슬라이스의 현재 재고(20kg)가 안전재고(150kg) 이하입니다. 추가 발주를 검토해 주세요.",
      referenceType: "material", referenceId: ID.MAT4,
      targetUserId: ID.USR3, createdAt: tsAgo(1),
    },
    // 안전재고 부족: 대파 (안전재고 100kg, 현재 20kg)
    {
      id: ID.ALT6, alertType: "low_stock", severity: "warning",
      title: "[재고부족] 신선 대파 - 안전재고 미달",
      message: "신선 대파의 현재 재고(20kg)가 안전재고(100kg) 이하입니다. 추가 발주를 검토해 주세요.",
      referenceType: "material", referenceId: ID.MAT3,
      targetUserId: ID.USR3, createdAt: tsAgo(1),
    },
  ]);

  console.log("\n=== Seeding Complete ===");
  console.log(`
  Summary:
  ├── Suppliers:    3 (대한제분, 삼양유지공업, 청미농산)
  ├── Materials:    4 (밀가루, 대두유, 대파, 양배추)
  ├── Specs:       14 (밀가루6, 대두유3, 대파3, 양배추2)
  ├── Locations:    7 (상온3, 냉장2, 냉동1, 검수대기1)
  ├── Users:        4 (관리자, 품질, 창고, 생산)
  ├── Receipts:     6 (적합4, 부적합1, 검사대기1)
  ├── LOTs:         6 (가용3, 부적합1, 검사중1, 가용1)
  ├── COA:          5 (적합4, 부적합1)
  ├── Inventory:    4 LOTs in stock
  ├── Transactions: 9 (입고4, 출고4, 반려1)
  ├── Production:   3 orders (완료2, 계획1)
  └── Alerts:       6 (기한임박3, 부적합1, 재고부족2)

  Business Scenarios:
  A) 밀가루 500kg 입고 → COA적합 → 재고 → 200kg 생산투입 → 잔량300kg
  B) 대두유 100L 입고  → COA적합 → 재고 → 20L 생산투입 → 잔량80L (기한D-15)
  C) 대파 50kg 입고    → COA적합 → 재고 → 30kg 생산투입 → 잔량20kg (기한D-4)
  D) 양배추 80kg 입고  → COA부적합(대장균) → 반려/Hold
  E) 밀가루 500kg 입고 → 검사 대기 중 (오늘)
  F) 양배추 80kg 재입고 → COA적합 → 60kg 생산투입 → 잔량20kg (기한D-4)
  `);

  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
