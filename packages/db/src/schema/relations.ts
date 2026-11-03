import { relations } from "drizzle-orm";
import { suppliers } from "./suppliers";
import { materials } from "./materials";
import { materialSpecs } from "./material-specs";
import { locations } from "./locations";
import { inboundReceipts, inboundLots } from "./inbound";
import { coaInspections, coaInspectionItems } from "./coa";
import { inventory, inventoryTransactions } from "./inventory";
import { productionOrders, productionOrderMaterials, productionInputs } from "./production";

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  materials: many(materials),
  receipts: many(inboundReceipts),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [materials.supplierId], references: [suppliers.id] }),
  specs: many(materialSpecs),
  receipts: many(inboundReceipts),
  lots: many(inboundLots),
}));

export const materialSpecsRelations = relations(materialSpecs, ({ one }) => ({
  material: one(materials, { fields: [materialSpecs.materialId], references: [materials.id] }),
}));

export const inboundReceiptsRelations = relations(inboundReceipts, ({ one, many }) => ({
  material: one(materials, { fields: [inboundReceipts.materialId], references: [materials.id] }),
  supplier: one(suppliers, { fields: [inboundReceipts.supplierId], references: [suppliers.id] }),
  lots: many(inboundLots),
}));

export const inboundLotsRelations = relations(inboundLots, ({ one, many }) => ({
  receipt: one(inboundReceipts, { fields: [inboundLots.receiptId], references: [inboundReceipts.id] }),
  material: one(materials, { fields: [inboundLots.materialId], references: [materials.id] }),
  location: one(locations, { fields: [inboundLots.locationId], references: [locations.id] }),
  coaInspection: one(coaInspections, { fields: [inboundLots.coaId], references: [coaInspections.id] }),
  inventoryItems: many(inventory),
  productionInputs: many(productionInputs),
}));

export const coaInspectionsRelations = relations(coaInspections, ({ one, many }) => ({
  lot: one(inboundLots, { fields: [coaInspections.lotId], references: [inboundLots.id] }),
  material: one(materials, { fields: [coaInspections.materialId], references: [materials.id] }),
  items: many(coaInspectionItems),
}));

export const coaInspectionItemsRelations = relations(coaInspectionItems, ({ one }) => ({
  inspection: one(coaInspections, { fields: [coaInspectionItems.inspectionId], references: [coaInspections.id] }),
  spec: one(materialSpecs, { fields: [coaInspectionItems.specId], references: [materialSpecs.id] }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  lot: one(inboundLots, { fields: [inventory.lotId], references: [inboundLots.id] }),
  material: one(materials, { fields: [inventory.materialId], references: [materials.id] }),
  location: one(locations, { fields: [inventory.locationId], references: [locations.id] }),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  lot: one(inboundLots, { fields: [inventoryTransactions.lotId], references: [inboundLots.id] }),
  material: one(materials, { fields: [inventoryTransactions.materialId], references: [materials.id] }),
  fromLocation: one(locations, { fields: [inventoryTransactions.fromLocationId], references: [locations.id] }),
  toLocation: one(locations, { fields: [inventoryTransactions.toLocationId], references: [locations.id] }),
}));

export const productionOrdersRelations = relations(productionOrders, ({ many }) => ({
  requiredMaterials: many(productionOrderMaterials),
  inputs: many(productionInputs),
}));

export const productionOrderMaterialsRelations = relations(productionOrderMaterials, ({ one }) => ({
  order: one(productionOrders, { fields: [productionOrderMaterials.orderId], references: [productionOrders.id] }),
  material: one(materials, { fields: [productionOrderMaterials.materialId], references: [materials.id] }),
}));

export const productionInputsRelations = relations(productionInputs, ({ one }) => ({
  order: one(productionOrders, { fields: [productionInputs.orderId], references: [productionOrders.id] }),
  lot: one(inboundLots, { fields: [productionInputs.lotId], references: [inboundLots.id] }),
  material: one(materials, { fields: [productionInputs.materialId], references: [materials.id] }),
}));
