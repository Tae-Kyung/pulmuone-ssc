import pg from "pg";

const client = new pg.Client(
  "postgresql://kbsi_app:SMmQhkEIeXivl5P0yrHWW1JhpwCcmWQg@203.255.78.89:15432/pulmuone?sslmode=no-verify"
);
await client.connect();

async function q(query: string) {
  return (await client.query(query)).rows;
}

let totalChecks = 0;
let passChecks = 0;
let failChecks = 0;

function log(ok: boolean, msg: string) {
  totalChecks++;
  if (ok) passChecks++;
  else failChecks++;
  console.log(`  ${ok ? "OK" : "FAIL"} ${msg}`);
}

// ═══════════════════════════════════════════
console.log("=".repeat(50));
console.log("  [1] 테이블별 레코드 수");
console.log("=".repeat(50));
const expected: Record<string, number> = {
  suppliers: 3, materials: 4, material_specs: 14, locations: 7,
  user_profiles: 4, inbound_receipts: 6, inbound_lots: 6,
  coa_inspections: 5, coa_inspection_items: 16, inventory: 4,
  inventory_transactions: 10, production_orders: 3,
  production_order_materials: 5, production_inputs: 4, alerts: 6,
};
for (const [t, exp] of Object.entries(expected)) {
  const r = await q(`SELECT count(*)::int as c FROM ${t}`);
  log(r[0].c === exp, `${t.padEnd(28)} ${r[0].c} (기대: ${exp})`);
}

// ═══════════════════════════════════════════
console.log("\n" + "=".repeat(50));
console.log("  [2] FK 무결성 - 고아 레코드 검사");
console.log("=".repeat(50));
const fkChecks: [string, string][] = [
  ["materials → suppliers", "SELECT count(*)::int as c FROM materials m LEFT JOIN suppliers s ON m.supplier_id=s.id WHERE m.supplier_id IS NOT NULL AND s.id IS NULL"],
  ["receipts → materials", "SELECT count(*)::int as c FROM inbound_receipts r LEFT JOIN materials m ON r.material_id=m.id WHERE m.id IS NULL"],
  ["receipts → suppliers", "SELECT count(*)::int as c FROM inbound_receipts r LEFT JOIN suppliers s ON r.supplier_id=s.id WHERE s.id IS NULL"],
  ["lots → receipts", "SELECT count(*)::int as c FROM inbound_lots l LEFT JOIN inbound_receipts r ON l.receipt_id=r.id WHERE r.id IS NULL"],
  ["lots → materials", "SELECT count(*)::int as c FROM inbound_lots l LEFT JOIN materials m ON l.material_id=m.id WHERE m.id IS NULL"],
  ["lots → locations", "SELECT count(*)::int as c FROM inbound_lots l LEFT JOIN locations loc ON l.location_id=loc.id WHERE l.location_id IS NOT NULL AND loc.id IS NULL"],
  ["lots → coa_inspections", "SELECT count(*)::int as c FROM inbound_lots l LEFT JOIN coa_inspections c ON l.coa_id=c.id WHERE l.coa_id IS NOT NULL AND c.id IS NULL"],
  ["coa → lots", "SELECT count(*)::int as c FROM coa_inspections c LEFT JOIN inbound_lots l ON c.lot_id=l.id WHERE l.id IS NULL"],
  ["coa_items → inspections", "SELECT count(*)::int as c FROM coa_inspection_items ci LEFT JOIN coa_inspections c ON ci.inspection_id=c.id WHERE c.id IS NULL"],
  ["coa_items → specs", "SELECT count(*)::int as c FROM coa_inspection_items ci LEFT JOIN material_specs ms ON ci.spec_id=ms.id WHERE ms.id IS NULL"],
  ["inventory → lots", "SELECT count(*)::int as c FROM inventory i LEFT JOIN inbound_lots l ON i.lot_id=l.id WHERE l.id IS NULL"],
  ["inventory → locations", "SELECT count(*)::int as c FROM inventory i LEFT JOIN locations loc ON i.location_id=loc.id WHERE loc.id IS NULL"],
  ["inv_tx → lots", "SELECT count(*)::int as c FROM inventory_transactions t LEFT JOIN inbound_lots l ON t.lot_id=l.id WHERE l.id IS NULL"],
  ["prod_inputs → lots", "SELECT count(*)::int as c FROM production_inputs p LEFT JOIN inbound_lots l ON p.lot_id=l.id WHERE l.id IS NULL"],
  ["prod_inputs → orders", "SELECT count(*)::int as c FROM production_inputs p LEFT JOIN production_orders o ON p.order_id=o.id WHERE o.id IS NULL"],
  ["prod_materials → orders", "SELECT count(*)::int as c FROM production_order_materials pm LEFT JOIN production_orders o ON pm.order_id=o.id WHERE o.id IS NULL"],
  ["alerts → users", "SELECT count(*)::int as c FROM alerts a LEFT JOIN user_profiles u ON a.target_user_id=u.id WHERE a.target_user_id IS NOT NULL AND u.id IS NULL"],
];
for (const [desc, query] of fkChecks) {
  const r = await q(query);
  log(r[0].c === 0, `${desc} ${r[0].c === 0 ? "" : `(고아 ${r[0].c}건)`}`);
}

// ═══════════════════════════════════════════
console.log("\n" + "=".repeat(50));
console.log("  [3] 수량 정합성 (LOT수량 - 투입량 = 재고)");
console.log("=".repeat(50));
const invCheck = await q(`
  SELECT l.lot_number,
    l.quantity::numeric as lot_qty,
    COALESCE(SUM(pi.input_quantity::numeric),0) as consumed,
    i.quantity::numeric as inv_qty,
    (l.quantity::numeric - COALESCE(SUM(pi.input_quantity::numeric),0)) as expected_inv
  FROM inbound_lots l
  LEFT JOIN production_inputs pi ON pi.lot_id = l.id
  LEFT JOIN inventory i ON i.lot_id = l.id
  WHERE l.status = 'available'
  GROUP BY l.lot_number, l.quantity, i.quantity
  ORDER BY l.lot_number
`);
for (const row of invCheck) {
  const match = Number(row.inv_qty) === Number(row.expected_inv);
  log(match, `${row.lot_number}: ${row.lot_qty} - ${row.consumed} = ${row.inv_qty} (기대: ${row.expected_inv})`);
}

// ═══════════════════════════════════════════
console.log("\n" + "=".repeat(50));
console.log("  [4] 상태 일관성 (LOT vs Receipt vs COA)");
console.log("=".repeat(50));
const statusCheck = await q(`
  SELECT l.lot_number, l.status as lot_status, r.status as receipt_status,
    c.overall_result as coa_result
  FROM inbound_lots l
  JOIN inbound_receipts r ON l.receipt_id = r.id
  LEFT JOIN coa_inspections c ON l.coa_id = c.id
  ORDER BY l.lot_number
`);
for (const row of statusCheck) {
  let ok = true;
  let note = "";
  if (row.coa_result === "pass" && row.lot_status !== "available") { ok = false; note = "COA적합 but LOT!=available"; }
  if (row.coa_result === "fail" && row.lot_status !== "rejected") { ok = false; note = "COA부적합 but LOT!=rejected"; }
  if (row.coa_result === null && row.lot_status !== "inspection") { ok = false; note = "COA없음 but LOT!=inspection"; }
  if (row.receipt_status === "rejected" && row.coa_result !== "fail") { ok = false; note = "Receipt반려 but COA!=fail"; }
  if (row.receipt_status === "approved" && row.coa_result !== "pass") { ok = false; note = "Receipt승인 but COA!=pass"; }
  if (row.receipt_status === "pending" && row.coa_result !== null) { ok = false; note = "Receipt대기 but COA존재"; }
  log(ok, `${row.lot_number}: LOT=${row.lot_status}, Receipt=${row.receipt_status}, COA=${row.coa_result ?? "없음"} ${note}`);
}

// ═══════════════════════════════════════════
console.log("\n" + "=".repeat(50));
console.log("  [5] 재고 트랜잭션 합계 = 현재 재고");
console.log("=".repeat(50));
const txCheck = await q(`
  SELECT l.lot_number,
    SUM(CASE WHEN t.tx_type='inbound' THEN t.quantity::numeric ELSE 0 END) as total_in,
    SUM(CASE WHEN t.tx_type IN ('consume','reject') THEN t.quantity::numeric ELSE 0 END) as total_out,
    COALESCE(i.quantity::numeric, 0) as current_inv
  FROM inbound_lots l
  LEFT JOIN inventory_transactions t ON t.lot_id = l.id
  LEFT JOIN inventory i ON i.lot_id = l.id
  GROUP BY l.lot_number, i.quantity
  ORDER BY l.lot_number
`);
for (const row of txCheck) {
  const expected = Number(row.total_in) - Number(row.total_out);
  const match = Number(row.current_inv) === expected;
  log(match, `${row.lot_number}: 입고${row.total_in} - 출고${row.total_out} = ${expected} (실제: ${row.current_inv})`);
}

// ═══════════════════════════════════════════
console.log("\n" + "=".repeat(50));
console.log("  [6] 생산투입량 vs 소요량");
console.log("=".repeat(50));
const prodCheck = await q(`
  SELECT o.order_number, o.product_name, o.status,
    m.name as material_name,
    pm.required_qty::numeric as required,
    COALESCE(SUM(pi.input_quantity::numeric),0) as actual_input
  FROM production_orders o
  JOIN production_order_materials pm ON pm.order_id = o.id
  JOIN materials m ON pm.material_id = m.id
  LEFT JOIN production_inputs pi ON pi.order_id = o.id AND pi.material_id = pm.material_id
  GROUP BY o.order_number, o.product_name, o.status, m.name, pm.required_qty
  ORDER BY o.order_number, m.name
`);
for (const row of prodCheck) {
  let ok = true;
  let note = "";
  if (row.status === "completed" && Number(row.actual_input) < Number(row.required)) {
    ok = false; note = "완료상태인데 투입 부족!";
  }
  if (row.status === "planned" && Number(row.actual_input) > 0) {
    ok = false; note = "계획상태인데 투입 존재!";
  }
  log(ok, `${row.order_number} [${row.status}] ${row.material_name}: 소요=${row.required} 투입=${row.actual_input} ${note}`);
}

// ═══════════════════════════════════════════
console.log("\n" + "=".repeat(50));
console.log("  [7] COA 검사항목 수 = 원료 규격 수");
console.log("=".repeat(50));
const coaItemCheck = await q(`
  SELECT l.lot_number, m.name,
    (SELECT count(*)::int FROM material_specs ms WHERE ms.material_id = c.material_id AND ms.is_active = true) as spec_count,
    (SELECT count(*)::int FROM coa_inspection_items ci WHERE ci.inspection_id = c.id) as item_count
  FROM coa_inspections c
  JOIN inbound_lots l ON c.lot_id = l.id
  JOIN materials m ON c.material_id = m.id
  ORDER BY l.lot_number
`);
for (const row of coaItemCheck) {
  const match = row.spec_count === row.item_count;
  log(match, `${row.lot_number} (${row.name}): 규격=${row.spec_count}, 검사=${row.item_count}`);
}

// ═══════════════════════════════════════════
console.log("\n" + "=".repeat(50));
console.log("  [8] 보관조건 일치 (원료 ↔ 위치)");
console.log("=".repeat(50));
const storageCheck = await q(`
  SELECT l.lot_number, m.name, m.storage_type as mat_storage, loc.storage_type as loc_storage, loc.code as loc_code
  FROM inventory i
  JOIN inbound_lots l ON i.lot_id = l.id
  JOIN materials m ON i.material_id = m.id
  JOIN locations loc ON i.location_id = loc.id
`);
for (const row of storageCheck) {
  const match = row.mat_storage === row.loc_storage;
  log(match, `${row.lot_number} (${row.name}): 원료=${row.mat_storage}, 위치=${row.loc_storage} [${row.loc_code}]`);
}

// ═══════════════════════════════════════════
console.log("\n" + "=".repeat(50));
console.log("  RESULT");
console.log("=".repeat(50));
console.log(`  Total: ${totalChecks}, Pass: ${passChecks}, Fail: ${failChecks}`);
console.log(`  ${failChecks === 0 ? "ALL CHECKS PASSED" : `${failChecks} CHECKS FAILED`}`);

await client.end();
process.exit(failChecks > 0 ? 1 : 0);
