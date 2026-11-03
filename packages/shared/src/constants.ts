// LOT 상태
export const LOT_STATUS = {
  INSPECTION: "inspection",
  AVAILABLE: "available",
  HOLD: "hold",
  EXPIRED: "expired",
  REJECTED: "rejected",
  CONSUMED: "consumed",
} as const;

// 재고 상태
export const INVENTORY_STATUS = {
  AVAILABLE: "available",
  HOLD: "hold",
  EXPIRED: "expired",
  REJECTED: "rejected",
} as const;

// 입고 상태
export const RECEIPT_STATUS = {
  PENDING: "pending",
  INSPECTING: "inspecting",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

// COA OCR 상태
export const OCR_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

// COA 판정 결과
export const COA_RESULT = {
  PASS: "pass",
  FAIL: "fail",
  REVIEW: "review",
} as const;

// 규격 유형
export const SPEC_TYPE = {
  MAX: "max",
  MIN: "min",
  RANGE: "range",
  EXACT: "exact",
  NEGATIVE: "negative",
} as const;

// 재고 트랜잭션 유형
export const TX_TYPE = {
  INBOUND: "inbound",
  MOVE: "move",
  CONSUME: "consume",
  ADJUST: "adjust",
  HOLD: "hold",
  RELEASE: "release",
  REJECT: "reject",
  RETURN: "return",
} as const;

// 알림 유형
export const ALERT_TYPE = {
  EXPIRY_D30: "expiry_d30",
  EXPIRY_D7: "expiry_d7",
  LOW_STOCK: "low_stock",
  LONG_IDLE: "long_idle",
  REJECTED: "rejected",
  HOLD: "hold",
  INPUT_BLOCKED: "input_blocked",
} as const;

// 알림 심각도
export const ALERT_SEVERITY = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
} as const;

// 사용자 역할
export const USER_ROLE = {
  ADMIN: "admin",
  QUALITY_MANAGER: "quality_manager",
  WAREHOUSE_MANAGER: "warehouse_manager",
  OPERATOR: "operator",
} as const;

// 보관조건
export const STORAGE_TYPE = {
  AMBIENT: "ambient",
  COLD: "cold",
  FROZEN: "frozen",
} as const;

// 생산 주문 상태
export const PRODUCTION_STATUS = {
  PLANNED: "planned",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;
