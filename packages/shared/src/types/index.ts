import type {
  LOT_STATUS,
  INVENTORY_STATUS,
  RECEIPT_STATUS,
  OCR_STATUS,
  COA_RESULT,
  SPEC_TYPE,
  TX_TYPE,
  ALERT_TYPE,
  ALERT_SEVERITY,
  USER_ROLE,
  STORAGE_TYPE,
  PRODUCTION_STATUS,
} from "../constants";

export type LotStatus = (typeof LOT_STATUS)[keyof typeof LOT_STATUS];
export type InventoryStatus = (typeof INVENTORY_STATUS)[keyof typeof INVENTORY_STATUS];
export type ReceiptStatus = (typeof RECEIPT_STATUS)[keyof typeof RECEIPT_STATUS];
export type OcrStatus = (typeof OCR_STATUS)[keyof typeof OCR_STATUS];
export type CoaResult = (typeof COA_RESULT)[keyof typeof COA_RESULT];
export type SpecType = (typeof SPEC_TYPE)[keyof typeof SPEC_TYPE];
export type TxType = (typeof TX_TYPE)[keyof typeof TX_TYPE];
export type AlertType = (typeof ALERT_TYPE)[keyof typeof ALERT_TYPE];
export type AlertSeverity = (typeof ALERT_SEVERITY)[keyof typeof ALERT_SEVERITY];
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
export type StorageType = (typeof STORAGE_TYPE)[keyof typeof STORAGE_TYPE];
export type ProductionStatus = (typeof PRODUCTION_STATUS)[keyof typeof PRODUCTION_STATUS];
