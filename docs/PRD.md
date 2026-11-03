# PRD: Pulmuone Smart Supply Chain 2.0 (SSC 2.0)

> AI 기반 원료·재고 통합관리 플랫폼

- **버전**: 1.0
- **작성일**: 2026-10-27
- **주관**: 풀무원기술원 품질기술센터

---

## 1. 프로젝트 개요

### 1.1 목적

원료 입고부터 생산 투입까지 전 과정을 LOT 단위로 연결하여 실물과 시스템 재고 일치도를 향상시키고, 스마트폰 Scan과 AI 자동검수를 통해 정확성/업무효율/Traceability를 강화한다.

### 1.2 시스템명

**Pulmuone SSC 2.0** (Smart Supply Chain 2.0) — AI-OCR 기반 품질 자율관리 플랫폼

### 1.3 핵심 전환

| 구분 | AS-IS | TO-BE |
|---|---|---|
| 입고 | 수기 등록, LOT 직접 입력 | Barcode/QR Scan → 자동 호출 |
| COA 검수 | 담당자 육안 검토 | AI-OCR → 규격 자동비교 → 판정지원 |
| 재고 | 수동 확인, 위치 이력 미흡 | LOT/Location별 실시간 동기화 |
| 추적 | 수동 역추적, 시간 과다 | 정방향/역방향 즉시 조회 |

---

## 2. 기술 스택

### 2.1 인프라

| 계층 | 기술 | 비고 |
|---|---|---|
| **Database** | PostgreSQL 15+ | `postgresql://kbsi_app:SMmQhkEIeXivl5P0yrHWW1JhpwCcmWQg@203.255.78.89:15432/pulmuone?sslmode=require` |
| **Backend (BaaS)** | Supabase | Auth, Storage, Realtime, Edge Functions |
| **Frontend (Web)** | Next.js 14+ (App Router) | 관리자 대시보드, 마스터 관리 |
| **Frontend (Mobile)** | PWA (Progressive Web App) | 현장 스마트폰 Scan 업무 |
| **AI/OCR** | Supabase Edge Functions + 외부 OCR API | COA 시험성적서 판독 |
| **Realtime** | Supabase Realtime (WebSocket) | 재고 변동, 알림 실시간 Push |
| **Storage** | Supabase Storage | COA 이미지, 바코드 이미지 저장 |
| **Auth** | Supabase Auth (RLS) | 역할 기반 접근 제어 |

### 2.2 개발 언어 및 도구

| 용도 | 기술 |
|---|---|
| 언어 | TypeScript (전체) |
| 패키지 매니저 | pnpm |
| ORM | Drizzle ORM (PostgreSQL) |
| 바코드/QR | `@aspect-js/barcode`, `html5-qrcode` |
| OCR | Tesseract.js / Google Vision API / Claude Vision |
| 차트 | Recharts |
| UI 프레임워크 | shadcn/ui + Tailwind CSS |
| 테스트 | Vitest + Playwright |
| 모노레포 | Turborepo |

### 2.3 프로젝트 구조 (모노레포)

```
pulmuone-ssc/
├── apps/
│   ├── web/                    # Next.js 관리자 대시보드
│   └── mobile/                 # Next.js PWA 현장 모바일
├── packages/
│   ├── db/                     # Drizzle 스키마, 마이그레이션
│   ├── supabase/               # Supabase 클라이언트, RLS 정책
│   ├── shared/                 # 공통 타입, 유틸, 상수
│   └── ui/                     # 공유 UI 컴포넌트 (shadcn 기반)
├── supabase/
│   ├── functions/              # Edge Functions (OCR, Alert 등)
│   ├── migrations/             # SQL 마이그레이션 파일
│   └── seed/                   # 시드 데이터
├── docs/                       # 문서
├── turbo.json
├── package.json
└── .env.local
```

---

## 3. 데이터베이스 설계

### 3.1 핵심 엔티티 관계

```
[공급업체] 1──N [원료마스터] 1──N [원료규격]
                    │
                    │ 1──N
                    ▼
              [입고원료] 1──N [입고LOT] 1──1 [바코드]
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
               [COA검수]   [재고이력]   [생산투입]
                              │           │
                              ▼           ▼
                         [Location]   [제품LOT]
```

### 3.2 테이블 정의

#### 3.2.1 Master 관리

```sql
-- 공급업체 마스터
CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(20) UNIQUE NOT NULL,       -- 업체코드
    name            VARCHAR(100) NOT NULL,             -- 업체명
    business_number VARCHAR(20),                       -- 사업자번호
    contact_name    VARCHAR(50),                       -- 담당자명
    contact_phone   VARCHAR(20),                       -- 담당자 연락처
    contact_email   VARCHAR(100),                      -- 담당자 이메일
    address         TEXT,                              -- 주소
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 원료 마스터
CREATE TABLE materials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(30) UNIQUE NOT NULL,       -- 원료코드
    name            VARCHAR(200) NOT NULL,             -- 원료명
    category        VARCHAR(50),                       -- 원료 분류
    unit            VARCHAR(20) NOT NULL,              -- 관리단위 (kg, L, EA 등)
    supplier_id     UUID REFERENCES suppliers(id),     -- 주 공급업체
    storage_type    VARCHAR(20) DEFAULT 'ambient',     -- 보관조건 (ambient/cold/frozen)
    shelf_life_days INTEGER,                           -- 기본 유통기한(일)
    safety_stock    NUMERIC(12,3),                     -- 안전재고 수량
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 원료별 검수 규격 (COA 자동비교용 Rule)
CREATE TABLE material_specs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id     UUID NOT NULL REFERENCES materials(id),
    test_item       VARCHAR(100) NOT NULL,             -- 시험항목 (Moisture, pH 등)
    spec_type       VARCHAR(20) NOT NULL,              -- 규격유형: max, min, range, exact, negative
    spec_min        NUMERIC(15,5),                     -- 하한값
    spec_max        NUMERIC(15,5),                     -- 상한값
    spec_text       VARCHAR(100),                      -- 텍스트 규격 (Negative 등)
    unit            VARCHAR(30),                       -- 시험단위 (%, CFU/g, ppm 등)
    is_critical     BOOLEAN DEFAULT FALSE,             -- 필수 검사항목 여부
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(material_id, test_item)
);

-- 보관 Location 마스터
CREATE TABLE locations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) UNIQUE NOT NULL,       -- Location 코드
    warehouse       VARCHAR(50) NOT NULL,              -- 창고 (창고 A)
    zone            VARCHAR(50),                       -- Zone (Zone 2)
    rack            VARCHAR(50),                       -- Rack (Rack 3)
    level           VARCHAR(20),                       -- 단 (2단)
    storage_type    VARCHAR(20) DEFAULT 'ambient',     -- 보관조건
    qr_code         VARCHAR(100),                      -- Location QR 코드 값
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 프로필 (Supabase Auth 확장)
CREATE TABLE user_profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id),
    employee_id     VARCHAR(20) UNIQUE,                -- 사번
    name            VARCHAR(50) NOT NULL,              -- 이름
    department      VARCHAR(50),                       -- 부서
    role            VARCHAR(30) NOT NULL DEFAULT 'operator',
                    -- admin, quality_manager, warehouse_manager, operator
    phone           VARCHAR(20),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.2.2 입고 관리

```sql
-- 입고 원료 (입고 건별)
CREATE TABLE inbound_receipts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number  VARCHAR(30) UNIQUE NOT NULL,       -- 입고번호 (자동채번)
    material_id     UUID NOT NULL REFERENCES materials(id),
    supplier_id     UUID NOT NULL REFERENCES suppliers(id),
    received_date   DATE NOT NULL,                     -- 입고일자
    total_quantity  NUMERIC(12,3) NOT NULL,            -- 입고 총수량
    unit            VARCHAR(20) NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending',     -- pending, inspecting, approved, rejected
    received_by     UUID REFERENCES user_profiles(id), -- 입고 담당자
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 입고 LOT (LOT 단위 관리 — 시스템 핵심 Key)
CREATE TABLE inbound_lots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id      UUID NOT NULL REFERENCES inbound_receipts(id),
    lot_number      VARCHAR(50) UNIQUE NOT NULL,       -- 시스템 LOT 번호 (자동생성)
    supplier_lot    VARCHAR(100),                      -- 공급사 LOT 번호
    material_id     UUID NOT NULL REFERENCES materials(id),
    quantity        NUMERIC(12,3) NOT NULL,            -- LOT 수량
    unit            VARCHAR(20) NOT NULL,
    manufacture_date DATE,                             -- 제조일자
    expiry_date     DATE,                              -- 소비기한
    barcode_value   VARCHAR(100) UNIQUE,               -- 바코드/QR 값
    barcode_type    VARCHAR(10) DEFAULT 'QR',          -- BARCODE, QR
    status          VARCHAR(20) DEFAULT 'inspection',
                    -- inspection, available, hold, expired, rejected, consumed
    location_id     UUID REFERENCES locations(id),     -- 현재 보관 위치
    coa_id          UUID,                              -- COA 검수 결과 (FK 후술)
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_inbound_lots_material ON inbound_lots(material_id);
CREATE INDEX idx_inbound_lots_status ON inbound_lots(status);
CREATE INDEX idx_inbound_lots_expiry ON inbound_lots(expiry_date);
CREATE INDEX idx_inbound_lots_barcode ON inbound_lots(barcode_value);
CREATE INDEX idx_inbound_lots_location ON inbound_lots(location_id);
```

#### 3.2.3 COA 검수 (AI-OCR)

```sql
-- COA 검수 건
CREATE TABLE coa_inspections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id          UUID NOT NULL REFERENCES inbound_lots(id),
    material_id     UUID NOT NULL REFERENCES materials(id),
    image_path      TEXT NOT NULL,                     -- Supabase Storage 경로
    ocr_status      VARCHAR(20) DEFAULT 'pending',     -- pending, processing, completed, failed
    overall_result  VARCHAR(20),                       -- pass, fail, review
    avg_confidence  NUMERIC(5,2),                      -- 평균 OCR 신뢰도 (%)
    reviewed_by     UUID REFERENCES user_profiles(id), -- 최종 검토 담당자
    reviewed_at     TIMESTAMPTZ,
    review_comment  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- COA 검수 항목별 결과
CREATE TABLE coa_inspection_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id   UUID NOT NULL REFERENCES coa_inspections(id) ON DELETE CASCADE,
    spec_id         UUID NOT NULL REFERENCES material_specs(id),
    test_item       VARCHAR(100) NOT NULL,             -- 시험항목명
    spec_criteria   VARCHAR(100),                      -- 규격 기준 (≤ 5.0% 등)
    coa_value       VARCHAR(100),                      -- OCR 판독값
    coa_numeric     NUMERIC(15,5),                     -- 숫자 변환값 (비교용)
    status          VARCHAR(10) NOT NULL,              -- pass, fail
    ocr_confidence  NUMERIC(5,2),                      -- 항목별 OCR 신뢰도 (%)
    is_alert        BOOLEAN DEFAULT FALSE,             -- 알림 발생 여부
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- FK 연결
ALTER TABLE inbound_lots
    ADD CONSTRAINT fk_inbound_lots_coa
    FOREIGN KEY (coa_id) REFERENCES coa_inspections(id);
```

#### 3.2.4 재고 관리

```sql
-- 현재고 (실시간 재고 스냅샷 — LOT × Location)
CREATE TABLE inventory (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id          UUID NOT NULL REFERENCES inbound_lots(id),
    material_id     UUID NOT NULL REFERENCES materials(id),
    location_id     UUID NOT NULL REFERENCES locations(id),
    quantity        NUMERIC(12,3) NOT NULL DEFAULT 0,  -- 현재고 수량
    status          VARCHAR(20) NOT NULL DEFAULT 'available',
                    -- available, hold, expired, rejected
    last_moved_at   TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lot_id, location_id)
);

-- 재고 이동 이력 (모든 변동 로그)
CREATE TABLE inventory_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id          UUID NOT NULL REFERENCES inbound_lots(id),
    material_id     UUID NOT NULL REFERENCES materials(id),
    tx_type         VARCHAR(20) NOT NULL,
                    -- inbound, move, consume, adjust, hold, release, reject, return
    quantity        NUMERIC(12,3) NOT NULL,            -- 변동 수량 (+ 입고/복원, - 소비/차감)
    from_location_id UUID REFERENCES locations(id),
    to_location_id  UUID REFERENCES locations(id),
    reference_type  VARCHAR(30),                       -- 참조 유형 (receipt, production, adjustment)
    reference_id    UUID,                              -- 참조 ID
    performed_by    UUID REFERENCES user_profiles(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_inventory_material ON inventory(material_id);
CREATE INDEX idx_inventory_lot ON inventory(lot_id);
CREATE INDEX idx_inventory_location ON inventory(location_id);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_tx_lot ON inventory_transactions(lot_id);
CREATE INDEX idx_inventory_tx_type ON inventory_transactions(tx_type);
CREATE INDEX idx_inventory_tx_created ON inventory_transactions(created_at);
```

#### 3.2.5 생산투입 관리

```sql
-- 작업지시
CREATE TABLE production_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number    VARCHAR(30) UNIQUE NOT NULL,       -- 작업지시 번호
    product_name    VARCHAR(200) NOT NULL,             -- 제품명
    product_lot     VARCHAR(50),                       -- 제품 LOT
    planned_date    DATE NOT NULL,                     -- 생산 예정일
    status          VARCHAR(20) DEFAULT 'planned',     -- planned, in_progress, completed, cancelled
    created_by      UUID REFERENCES user_profiles(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 작업지시별 필요 원료 (BOM)
CREATE TABLE production_order_materials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES production_orders(id),
    material_id     UUID NOT NULL REFERENCES materials(id),
    required_qty    NUMERIC(12,3) NOT NULL,            -- 필요 수량
    unit            VARCHAR(20) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 생산 투입 이력 (원료 LOT → 제품 LOT 연결 — Traceability 핵심)
CREATE TABLE production_inputs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES production_orders(id),
    lot_id          UUID NOT NULL REFERENCES inbound_lots(id),
    material_id     UUID NOT NULL REFERENCES materials(id),
    input_quantity  NUMERIC(12,3) NOT NULL,            -- 실제 투입량
    unit            VARCHAR(20) NOT NULL,
    product_lot     VARCHAR(50),                       -- 연결된 제품 LOT
    scanned_barcode VARCHAR(100),                      -- 스캔된 바코드 값
    input_by        UUID REFERENCES user_profiles(id), -- 투입 작업자
    input_at        TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 (Traceability 조회 최적화)
CREATE INDEX idx_prod_inputs_lot ON production_inputs(lot_id);
CREATE INDEX idx_prod_inputs_order ON production_inputs(order_id);
CREATE INDEX idx_prod_inputs_product_lot ON production_inputs(product_lot);
CREATE INDEX idx_prod_inputs_material ON production_inputs(material_id);
```

#### 3.2.6 알림 관리

```sql
-- 알림
CREATE TABLE alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type      VARCHAR(30) NOT NULL,
                    -- expiry_d30, expiry_d7, low_stock, long_idle, rejected, hold, input_blocked
    severity        VARCHAR(10) NOT NULL DEFAULT 'warning',
                    -- info, warning, critical
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    reference_type  VARCHAR(30),                       -- lot, material, inventory, coa
    reference_id    UUID,
    is_read         BOOLEAN DEFAULT FALSE,
    is_resolved     BOOLEAN DEFAULT FALSE,
    target_user_id  UUID REFERENCES user_profiles(id), -- 대상 사용자 (NULL이면 전체)
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_alerts_type ON alerts(alert_type);
CREATE INDEX idx_alerts_unread ON alerts(is_read, is_resolved);
CREATE INDEX idx_alerts_target ON alerts(target_user_id);
```

### 3.3 주요 뷰

```sql
-- 실시간 가용 재고 뷰 (LOT × Location × 상태)
CREATE VIEW v_available_inventory AS
SELECT
    i.id,
    m.code AS material_code,
    m.name AS material_name,
    il.lot_number,
    il.supplier_lot,
    il.expiry_date,
    l.warehouse, l.zone, l.rack, l.level,
    l.code AS location_code,
    i.quantity,
    m.unit,
    i.status,
    il.expiry_date - CURRENT_DATE AS days_until_expiry,
    i.last_moved_at
FROM inventory i
JOIN inbound_lots il ON i.lot_id = il.id
JOIN materials m ON i.material_id = m.id
JOIN locations l ON i.location_id = l.id
WHERE i.quantity > 0;

-- LOT Traceability 뷰 (정방향: 원료 → 제품)
CREATE VIEW v_lot_forward_trace AS
SELECT
    il.lot_number AS material_lot,
    m.name AS material_name,
    pi.input_quantity,
    pi.unit,
    pi.product_lot,
    po.product_name,
    po.order_number,
    pi.input_at
FROM production_inputs pi
JOIN inbound_lots il ON pi.lot_id = il.id
JOIN materials m ON pi.material_id = m.id
JOIN production_orders po ON pi.order_id = po.id;

-- LOT Traceability 뷰 (역방향: 제품 → 원료)
CREATE VIEW v_lot_backward_trace AS
SELECT
    pi.product_lot,
    po.product_name,
    il.lot_number AS material_lot,
    m.name AS material_name,
    s.name AS supplier_name,
    il.supplier_lot,
    il.manufacture_date,
    il.expiry_date,
    pi.input_quantity,
    pi.unit,
    pi.input_at
FROM production_inputs pi
JOIN inbound_lots il ON pi.lot_id = il.id
JOIN materials m ON pi.material_id = m.id
JOIN suppliers s ON il.material_id = m.id AND m.supplier_id = s.id
JOIN production_orders po ON pi.order_id = po.id;
```

### 3.4 Database Functions (Supabase RPC)

```sql
-- LOT 번호 자동채번 (형식: LOT-YYYYMMDD-XXXX)
CREATE OR REPLACE FUNCTION generate_lot_number()
RETURNS VARCHAR AS $$
DECLARE
    today_str VARCHAR;
    seq_num INTEGER;
    new_lot VARCHAR;
BEGIN
    today_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(lot_number FROM 14) AS INTEGER)
    ), 0) + 1
    INTO seq_num
    FROM inbound_lots
    WHERE lot_number LIKE 'LOT-' || today_str || '-%';

    new_lot := 'LOT-' || today_str || '-' || LPAD(seq_num::TEXT, 4, '0');
    RETURN new_lot;
END;
$$ LANGUAGE plpgsql;

-- 입고번호 자동채번 (형식: RCV-YYYYMMDD-XXXX)
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR AS $$
DECLARE
    today_str VARCHAR;
    seq_num INTEGER;
BEGIN
    today_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(receipt_number FROM 14) AS INTEGER)
    ), 0) + 1
    INTO seq_num
    FROM inbound_receipts
    WHERE receipt_number LIKE 'RCV-' || today_str || '-%';

    RETURN 'RCV-' || today_str || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- COA 규격 자동비교 함수
CREATE OR REPLACE FUNCTION check_spec_compliance(
    p_spec_id UUID,
    p_coa_value VARCHAR
)
RETURNS TABLE(status VARCHAR, is_alert BOOLEAN) AS $$
DECLARE
    v_spec material_specs%ROWTYPE;
    v_numeric NUMERIC;
BEGIN
    SELECT * INTO v_spec FROM material_specs WHERE id = p_spec_id;

    -- 텍스트 비교 (Negative 등)
    IF v_spec.spec_type = 'negative' THEN
        IF LOWER(TRIM(p_coa_value)) IN ('negative', 'not detected', 'nd', '음성') THEN
            RETURN QUERY SELECT 'pass'::VARCHAR, FALSE;
        ELSE
            RETURN QUERY SELECT 'fail'::VARCHAR, TRUE;
        END IF;
        RETURN;
    END IF;

    -- 숫자 변환
    v_numeric := CAST(REGEXP_REPLACE(p_coa_value, '[^0-9.]', '', 'g') AS NUMERIC);

    CASE v_spec.spec_type
        WHEN 'max' THEN
            IF v_numeric <= v_spec.spec_max THEN
                RETURN QUERY SELECT 'pass'::VARCHAR, FALSE;
            ELSE
                RETURN QUERY SELECT 'fail'::VARCHAR, TRUE;
            END IF;
        WHEN 'min' THEN
            IF v_numeric >= v_spec.spec_min THEN
                RETURN QUERY SELECT 'pass'::VARCHAR, FALSE;
            ELSE
                RETURN QUERY SELECT 'fail'::VARCHAR, TRUE;
            END IF;
        WHEN 'range' THEN
            IF v_numeric BETWEEN v_spec.spec_min AND v_spec.spec_max THEN
                RETURN QUERY SELECT 'pass'::VARCHAR, FALSE;
            ELSE
                RETURN QUERY SELECT 'fail'::VARCHAR, TRUE;
            END IF;
        ELSE
            RETURN QUERY SELECT 'review'::VARCHAR, FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- 재고 차감 + 이력 기록 (트랜잭션 보장)
CREATE OR REPLACE FUNCTION consume_inventory(
    p_lot_id UUID,
    p_location_id UUID,
    p_quantity NUMERIC,
    p_order_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current NUMERIC;
BEGIN
    -- 현재고 확인 (FOR UPDATE로 락)
    SELECT quantity INTO v_current
    FROM inventory
    WHERE lot_id = p_lot_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_current IS NULL OR v_current < p_quantity THEN
        RETURN FALSE;
    END IF;

    -- 재고 차감
    UPDATE inventory
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE lot_id = p_lot_id AND location_id = p_location_id;

    -- 이력 기록
    INSERT INTO inventory_transactions
        (lot_id, material_id, tx_type, quantity, from_location_id,
         reference_type, reference_id, performed_by)
    SELECT p_lot_id, il.material_id, 'consume', -p_quantity, p_location_id,
           'production', p_order_id, p_user_id
    FROM inbound_lots il WHERE il.id = p_lot_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### 3.5 Supabase Row Level Security (RLS)

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE coa_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE coa_inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 조회 가능 (기본 정책)
CREATE POLICY "authenticated_read" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON material_specs FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON inbound_receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON inbound_lots FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON production_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON production_inputs FOR SELECT TO authenticated USING (true);

-- 알림은 본인 또는 전체 대상만 조회
CREATE POLICY "alerts_read_own" ON alerts FOR SELECT TO authenticated
    USING (target_user_id = auth.uid() OR target_user_id IS NULL);

-- 쓰기 권한은 역할 기반 (admin, quality_manager, warehouse_manager)
CREATE POLICY "admin_write_all" ON suppliers FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role IN ('admin', 'quality_manager')
    ));

-- (나머지 테이블도 역할별 INSERT/UPDATE/DELETE 정책 적용)
```

---

## 4. 기능 모듈 상세

### 4.1 Module 01 — Master 관리 (Web)

| 기능 | 설명 | 우선순위 |
|---|---|---|
| 원료 마스터 CRUD | 원료코드, 명칭, 분류, 단위, 공급업체, 보관조건, 유통기한, 안전재고 | Must |
| 공급업체 마스터 CRUD | 업체코드, 명칭, 사업자번호, 담당자 정보 | Must |
| 원료 규격 관리 | 원료별 시험항목, 규격유형(max/min/range/negative), 기준값, 단위 | Must |
| Location 마스터 | 창고/Zone/Rack/단 계층 구조, QR코드 매핑 | Must |
| 사용자 관리 | 사번, 이름, 부서, 역할(admin/quality_manager/warehouse_manager/operator) | Must |

### 4.2 Module 02 — 입고관리 (Web + Mobile)

| 기능 | 설명 | 우선순위 |
|---|---|---|
| 입고 등록 | 원료 선택, 공급업체, 입고일, 수량 입력 → 입고번호 자동채번 | Must |
| LOT 등록 | 공급사 LOT, 제조일, 소비기한 입력 → 시스템 LOT 번호 자동생성 | Must |
| 바코드/QR 생성 | LOT별 고유 Barcode/QR 자동 생성, 라벨 출력 지원 | Must |
| 모바일 스캔 입고 | 스마트폰으로 원료 Barcode 스캔 → 원료/업체/LOT 자동 확인 | Must |

### 4.3 Module 03 — COA 검수 (Mobile + Web)

| 기능 | 설명 | 우선순위 |
|---|---|---|
| COA 촬영/업로드 | 스마트폰 카메라로 촬영 또는 파일 업로드 → Supabase Storage 저장 | Must |
| OCR 판독 | 이미지에서 시험항목·수치 자동 추출 (Edge Function) | Must |
| 규격 자동비교 | 추출값 vs 규격DB 자동 비교 → 항목별 pass/fail 판정 | Must |
| 신뢰도 표시 | 항목별 OCR Confidence Score 표시 | Must |
| 담당자 최종승인 | AI 판정 결과를 담당자가 확인 후 최종 승인/반려 | Must |
| 부적합 자동 Hold | fail 항목 발생 시 해당 LOT 자동 Hold + Alert 발생 | Must |

### 4.4 Module 04 — 재고관리 (Web + Mobile)

| 기능 | 설명 | 우선순위 |
|---|---|---|
| 현재고 조회 | 원료별/LOT별/Location별 현재고, 가용재고, Hold 재고 | Must |
| 보관위치 등록 | 원료 Scan + 위치 QR Scan → 보관위치 자동 등록 | Must |
| 재고 이동 | Scan으로 출발/도착 Location 등록 → 이동 이력 자동 기록 | Must |
| 재고 상태 관리 | Available / Inspection / Hold / Expired / Rejected 5단계 | Must |
| 소비기한 관리 | D-30, D-7 자동 알림; 만료 시 자동 Expired 전환 | Must |
| 모바일 재고조회 | 원료 Scan → 현 재고상태/소비기한/위치 즉시 확인 | Must |

### 4.5 Module 05 — 생산투입 (Mobile)

| 기능 | 설명 | 우선순위 |
|---|---|---|
| 작업지시 조회 | 당일 작업지시 목록, 필요 원료 확인 | Must |
| 원료 Scan 투입 | Barcode Scan → LOT 자동 호출 → 투입 가능여부 검증 | Must |
| 투입 차단 로직 | Hold/Expired/Rejected LOT 투입 차단 (ERR-012) | Must |
| 원료 불일치 검증 | 작업지시 원료 vs 스캔 원료 불일치 시 차단 (ERR-045) | Must |
| 투입량 입력 | 실제 사용량 입력 → 재고 자동 차감 | Must |
| 제품 LOT 연결 | 투입된 원료 LOT → 제품 LOT 자동 연결 (Traceability) | Must |

### 4.6 Module 06 — Traceability (Web)

| 기능 | 설명 | 우선순위 |
|---|---|---|
| 정방향 추적 | 원료 LOT → 어떤 제품에 투입되었는지 조회 | Must |
| 역방향 추적 | 제품 LOT → 어떤 원료 LOT가 사용되었는지 조회 | Must |
| 추적 시각화 | LOT 연결 관계를 트리/그래프로 시각화 | Should |
| 모의회수 | 특정 원료 LOT 지정 → 영향받는 제품 목록 일괄 조회 | Must |

### 4.7 Module 07 — 대시보드 & 알림 (Web)

| 기능 | 설명 | 우선순위 |
|---|---|---|
| 통합 대시보드 | 금일 입고 예정, AI-OCR 검증 현황, COA 오차/미제출 건수 | Must |
| 입고예정 원료 현황 | 협력사별 입고예정 원료, AI 판독상태, 신뢰도 | Must |
| 품질 이슈 현황 | 주요 품질 이슈, CAPA 조치현황 | Should |
| 알림 센터 | 소비기한 임박, 재고부족, 부적합 발생 등 알림 목록 | Must |
| 실시간 알림 | Supabase Realtime으로 알림 즉시 Push | Must |

---

## 5. Supabase Edge Functions

### 5.1 OCR 처리 함수

```
POST /functions/v1/ocr-process
```

- **Input**: COA 이미지 (Supabase Storage path), material_id
- **Process**:
  1. Storage에서 이미지 로드
  2. OCR 엔진으로 텍스트 추출 (Tesseract.js 또는 Claude Vision)
  3. 시험항목 + 수치 파싱
  4. material_specs 테이블에서 해당 원료 규격 조회
  5. check_spec_compliance() 함수로 항목별 판정
  6. coa_inspections, coa_inspection_items 저장
  7. fail 항목 존재 시 → inbound_lots 상태를 hold로 변경 + alerts 생성
- **Output**: inspection_id, 항목별 판정 결과

### 5.2 알림 스케줄러 (Cron)

```
매일 09:00 실행 — /functions/v1/alert-scheduler
```

- 소비기한 D-30, D-7 도래 LOT 검출 → 알림 생성
- 안전재고 미달 원료 검출 → 알림 생성
- 장기 미이동 재고 (30일+) 검출 → 알림 생성

---

## 6. API 엔드포인트 설계

Supabase 자동 REST API (`/rest/v1/`) + 커스텀 Edge Functions 조합.

### 6.1 Supabase Auto-generated REST (주요)

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/rest/v1/materials?select=*,supplier:suppliers(*)` | 원료 목록 (조인) |
| GET | `/rest/v1/inbound_lots?barcode_value=eq.{value}` | 바코드로 LOT 조회 |
| GET | `/rest/v1/v_available_inventory?material_id=eq.{id}` | 원료별 가용재고 |
| GET | `/rest/v1/v_lot_forward_trace?material_lot=eq.{lot}` | 정방향 추적 |
| GET | `/rest/v1/v_lot_backward_trace?product_lot=eq.{lot}` | 역방향 추적 |
| GET | `/rest/v1/alerts?is_read=eq.false&order=created_at.desc` | 미읽은 알림 |
| POST | `/rest/v1/inbound_receipts` | 입고 등록 |
| POST | `/rest/v1/inbound_lots` | LOT 등록 |
| PATCH | `/rest/v1/inbound_lots?id=eq.{id}` | LOT 상태 변경 |

### 6.2 Custom Edge Functions

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/functions/v1/ocr-process` | COA OCR 판독 + 규격비교 |
| POST | `/functions/v1/production-input` | 생산투입 (검증 + 차감 + LOT연결 트랜잭션) |
| POST | `/functions/v1/generate-barcode` | LOT별 바코드/QR 생성 |
| POST | `/functions/v1/alert-scheduler` | 알림 스케줄러 (Cron 호출) |
| GET  | `/functions/v1/dashboard-summary` | 대시보드 집계 데이터 |
| POST | `/functions/v1/mock-recall` | 모의회수 추적 실행 |

---

## 7. 화면 목록

### 7.1 Web (관리자 대시보드)

| # | 화면 | 경로 | 설명 |
|---|---|---|---|
| W01 | 통합 대시보드 | `/dashboard` | KPI 카드, 입고현황, 품질이슈 |
| W02 | 원료 마스터 | `/master/materials` | 원료 CRUD |
| W03 | 공급업체 마스터 | `/master/suppliers` | 업체 CRUD |
| W04 | 규격 관리 | `/master/materials/[id]/specs` | 원료별 검수 규격 |
| W05 | Location 관리 | `/master/locations` | 보관위치 CRUD |
| W06 | 사용자 관리 | `/master/users` | 사용자/역할 관리 |
| W07 | 입고 관리 | `/inbound` | 입고 목록/등록 |
| W08 | COA 검수 현황 | `/coa` | AI-OCR 결과 목록, 수동검토 |
| W09 | COA 상세 | `/coa/[id]` | 항목별 판정, 승인/반려 |
| W10 | 재고 현황 | `/inventory` | 원료/LOT/Location별 재고 |
| W11 | 재고 이력 | `/inventory/transactions` | 입출고/이동 이력 |
| W12 | 작업지시 | `/production` | 작업지시 목록 |
| W13 | 정방향 추적 | `/trace/forward` | 원료LOT → 제품 추적 |
| W14 | 역방향 추적 | `/trace/backward` | 제품LOT → 원료 추적 |
| W15 | 모의회수 | `/trace/recall` | 리콜 시뮬레이션 |
| W16 | 알림 센터 | `/alerts` | 알림 목록/관리 |
| W17 | 시스템 설정 | `/settings` | 시스템 파라미터 |

### 7.2 Mobile (PWA — 현장 스마트폰)

| # | 화면 | 경로 | 설명 |
|---|---|---|---|
| M01 | 홈 | `/m` | 입고/보관/재고/생산 바로가기 |
| M02 | 스캔 입고 | `/m/inbound/scan` | Barcode Scan → 원료 확인 → 입고 |
| M03 | COA 촬영 | `/m/coa/capture` | 카메라 촬영 → 업로드 |
| M04 | 보관위치 등록 | `/m/storage/scan` | 원료Scan + 위치QR Scan |
| M05 | 재고 조회 | `/m/inventory/scan` | 원료 Scan → 재고상태 즉시 확인 |
| M06 | 생산투입 | `/m/production/input` | 작업지시 선택 → 원료 Scan → 투입 |
| M07 | 알림 | `/m/alerts` | 모바일 알림 확인 |

---

## 8. 비기능 요구사항

| 항목 | 요구사항 |
|---|---|
| **보안** | SSL/TLS 필수 (sslmode=require), Supabase RLS, JWT 인증 |
| **가용성** | 99.5% 이상 (업무시간 기준) |
| **응답시간** | 일반 조회 < 1초, OCR 처리 < 5초, 바코드 스캔 응답 < 0.5초 |
| **동시접속** | 최소 50명 동시 사용 |
| **데이터 보존** | 거래 이력 최소 5년 보관 |
| **모바일 호환** | iOS Safari, Android Chrome (최신 2개 버전) |
| **OCR 정확도** | 95% 이상 (텍스트 추출 기준) |
| **감사추적** | 모든 데이터 변경에 대한 created_at/updated_at + performed_by 기록 |

---

## 9. 개발 단계 (Phase)

### Phase 1 — 기반 구축 (Foundation)

- [ ] 모노레포 프로젝트 셋업 (Turborepo + pnpm)
- [ ] PostgreSQL 스키마 생성 (마이그레이션)
- [ ] Supabase 연결 및 Auth 설정
- [ ] RLS 정책 적용
- [ ] 공통 UI 컴포넌트 (shadcn/ui)
- [ ] Master 관리 화면 (W02~W06)

### Phase 2 — 입고 & COA (Core)

- [ ] 입고 등록/관리 (W07, M02)
- [ ] LOT 자동채번 + 바코드/QR 생성
- [ ] 모바일 Barcode Scan (html5-qrcode)
- [ ] COA 촬영/업로드 (M03)
- [ ] OCR Edge Function 구현
- [ ] 규격 자동비교 Rule Engine
- [ ] COA 검수 화면 (W08, W09)

### Phase 3 — 재고 & 생산 (Operations)

- [ ] 재고 현황/이력 (W10, W11)
- [ ] 보관위치 등록 (M04)
- [ ] 재고 이동/상태 관리
- [ ] 생산투입 (M06) — 검증 + 차감 + LOT 연결
- [ ] 작업지시 관리 (W12)
- [ ] 투입 차단 로직 (ERR-012, ERR-045)

### Phase 4 — Traceability & Dashboard (Intelligence)

- [ ] 정방향/역방향 추적 (W13, W14)
- [ ] 모의회수 (W15)
- [ ] 통합 대시보드 (W01)
- [ ] 알림 시스템 (W16, M07)
- [ ] 알림 스케줄러 (Cron)
- [ ] Realtime 알림 Push

---

## 10. 환경 변수

```env
# PostgreSQL (Direct)
DATABASE_URL=postgresql://kbsi_app:SMmQhkEIeXivl5P0yrHWW1JhpwCcmWQg@203.255.78.89:15432/pulmuone?sslmode=require

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# OCR (선택 — Claude Vision 사용 시)
ANTHROPIC_API_KEY=<api-key>

# 앱 설정
NEXT_PUBLIC_APP_NAME=Pulmuone SSC 2.0
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 11. 용어 정의

| 용어 | 설명 |
|---|---|
| **LOT** | 동일 조건에서 생산된 원료/제품의 관리 단위 번호 |
| **COA** | Certificate of Analysis — 원료의 시험 결과 및 품질 규격 적합 여부를 확인하는 시험성적서 |
| **Traceability** | 원료 입고부터 제품 사용까지 LOT별 이력을 관리하여 문제 발생 시 원인 추적이 가능한 체계 |
| **정방향 추적** | 원료 LOT → 해당 원료가 투입된 제품 추적 |
| **역방향 추적** | 제품 LOT → 해당 제품에 사용된 원료 추적 |
| **Hold** | 품질 검사 결과 보류 판정되어 사용이 일시 중단된 상태 |
| **Recall** | 품질 이상 발생 시 해당 LOT의 원료/제품 이력을 추적하여 회수 및 조치하는 활동 |
| **OCR** | Optical Character Recognition — 이미지에서 문자를 자동 인식하는 기술 |
| **BOM** | Bill of Materials — 제품 생산에 필요한 원료 목록 및 수량 |
| **RLS** | Row Level Security — Supabase/PostgreSQL의 행 수준 접근 제어 |
| **CAPA** | Corrective and Preventive Action — 시정 및 예방 조치 |
