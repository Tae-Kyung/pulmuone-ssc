"""
Pulmuone SSC 2.0 시스템 소개 및 사용 매뉴얼 PPT 생성 스크립트
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ── 색상 팔레트 ──
GREEN_DARK = RGBColor(0x00, 0x6B, 0x3F)    # 풀무원 그린 (진)
GREEN_MID  = RGBColor(0x00, 0x96, 0x5E)     # 풀무원 그린 (중)
GREEN_LIGHT= RGBColor(0xE8, 0xF5, 0xE9)     # 연한 녹색 배경
WHITE      = RGBColor(0xFF, 0xFF, 0xFF)
BLACK      = RGBColor(0x33, 0x33, 0x33)
GRAY       = RGBColor(0x66, 0x66, 0x66)
GRAY_LIGHT = RGBColor(0xF5, 0xF5, 0xF5)
BLUE       = RGBColor(0x1E, 0x88, 0xE5)
ORANGE     = RGBColor(0xFB, 0x8C, 0x00)
RED        = RGBColor(0xE5, 0x39, 0x35)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

# ── Helper Functions ──
def add_shape(slide, left, top, width, height, fill_color=None, line_color=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.line.fill.background()
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    if line_color:
        shape.line.color.rgb = line_color
        shape.line.width = Pt(1)
    else:
        shape.line.fill.background()
    return shape

def add_rounded_shape(slide, left, top, width, height, fill_color=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.line.fill.background()
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    return shape

def add_text(slide, left, top, width, height, text, font_size=18, color=BLACK, bold=False, alignment=PP_ALIGN.LEFT, font_name="맑은 고딕"):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.font.name = font_name
    p.alignment = alignment
    return txBox

def add_multiline_text(slide, left, top, width, height, lines, font_size=14, color=BLACK, line_spacing=1.5, font_name="맑은 고딕"):
    """lines: list of (text, bold, color) or just str"""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        if isinstance(line, tuple):
            p.text = line[0]
            p.font.bold = line[1] if len(line) > 1 else False
            p.font.color.rgb = line[2] if len(line) > 2 else color
        else:
            p.text = line
        p.font.size = Pt(font_size)
        p.font.name = font_name
        p.space_after = Pt(font_size * 0.3)
    return txBox

def add_header_bar(slide, title, subtitle=""):
    """상단 녹색 헤더 바"""
    add_shape(slide, 0, 0, SLIDE_W, Inches(1.2), fill_color=GREEN_DARK)
    add_text(slide, Inches(0.8), Inches(0.15), Inches(10), Inches(0.6), title,
             font_size=28, color=WHITE, bold=True)
    if subtitle:
        add_text(slide, Inches(0.8), Inches(0.65), Inches(10), Inches(0.4), subtitle,
                 font_size=14, color=RGBColor(0xA5, 0xD6, 0xA7))
    # 페이지 번호 영역
    add_text(slide, Inches(11.5), Inches(0.3), Inches(1.5), Inches(0.4),
             "SSC 2.0", font_size=12, color=RGBColor(0xA5, 0xD6, 0xA7), alignment=PP_ALIGN.RIGHT)

def add_footer(slide, page_num):
    add_shape(slide, 0, Inches(7.1), SLIDE_W, Inches(0.4), fill_color=GRAY_LIGHT)
    add_text(slide, Inches(0.5), Inches(7.12), Inches(5), Inches(0.3),
             "Pulmuone Technology Institute | Quality Technology Center",
             font_size=9, color=GRAY)
    add_text(slide, Inches(11), Inches(7.12), Inches(2), Inches(0.3),
             f"Page {page_num}", font_size=9, color=GRAY, alignment=PP_ALIGN.RIGHT)

def add_card(slide, left, top, width, height, title, items, icon_color=GREEN_MID, title_size=16, item_size=12):
    """카드형 박스"""
    card = add_rounded_shape(slide, left, top, width, height, fill_color=WHITE)
    card.shadow.inherit = False
    # 상단 색상 바
    add_shape(slide, left, top, width, Inches(0.06), fill_color=icon_color)
    # 타이틀
    add_text(slide, left + Inches(0.2), top + Inches(0.15), width - Inches(0.4), Inches(0.4),
             title, font_size=title_size, color=GREEN_DARK, bold=True)
    # 항목들
    y = top + Inches(0.55)
    for item in items:
        add_text(slide, left + Inches(0.3), y, width - Inches(0.5), Inches(0.3),
                 f"• {item}", font_size=item_size, color=BLACK)
        y += Inches(0.28)
    return card

def add_table_slide(slide, left, top, rows_data, col_widths, header_color=GREEN_DARK):
    """테이블 추가"""
    rows = len(rows_data)
    cols = len(rows_data[0])
    table_shape = slide.shapes.add_table(rows, cols, left, top,
                                          sum(col_widths), Inches(0.4) * rows)
    table = table_shape.table

    for ci, w in enumerate(col_widths):
        table.columns[ci].width = w

    for ri, row in enumerate(rows_data):
        for ci, cell_text in enumerate(row):
            cell = table.cell(ri, ci)
            cell.text = str(cell_text)
            for paragraph in cell.text_frame.paragraphs:
                paragraph.font.size = Pt(11)
                paragraph.font.name = "맑은 고딕"
                if ri == 0:
                    paragraph.font.color.rgb = WHITE
                    paragraph.font.bold = True
                    paragraph.alignment = PP_ALIGN.CENTER
                else:
                    paragraph.font.color.rgb = BLACK
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            if ri == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = header_color
            elif ri % 2 == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = GRAY_LIGHT
    return table_shape


# ═══════════════════════════════════════════
# SLIDE 1: 표지
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank
add_shape(slide, 0, 0, SLIDE_W, SLIDE_H, fill_color=GREEN_DARK)

# 장식 라인
add_shape(slide, 0, Inches(2.8), SLIDE_W, Inches(0.03), fill_color=RGBColor(0xA5, 0xD6, 0xA7))
add_shape(slide, 0, Inches(4.7), SLIDE_W, Inches(0.03), fill_color=RGBColor(0xA5, 0xD6, 0xA7))

add_text(slide, Inches(1), Inches(1.2), Inches(11), Inches(0.6),
         "PULMUONE", font_size=20, color=RGBColor(0xA5, 0xD6, 0xA7), bold=False, alignment=PP_ALIGN.CENTER)
add_text(slide, Inches(1), Inches(1.8), Inches(11), Inches(1),
         "Smart Supply Chain 2.0", font_size=44, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)

add_text(slide, Inches(1), Inches(3.0), Inches(11), Inches(0.7),
         "AI 기반 원료·재고 통합관리 플랫폼", font_size=24, color=RGBColor(0xC8, 0xE6, 0xC9), alignment=PP_ALIGN.CENTER)
add_text(slide, Inches(1), Inches(3.6), Inches(11), Inches(0.6),
         "시스템 소개 및 사용 매뉴얼", font_size=20, color=RGBColor(0xA5, 0xD6, 0xA7), alignment=PP_ALIGN.CENTER)

add_text(slide, Inches(1), Inches(5.0), Inches(11), Inches(0.5),
         "풀무원기술원 품질기술센터", font_size=16, color=RGBColor(0xC8, 0xE6, 0xC9), alignment=PP_ALIGN.CENTER)
add_text(slide, Inches(1), Inches(5.5), Inches(11), Inches(0.5),
         "2026년 11월", font_size=14, color=RGBColor(0xA5, 0xD6, 0xA7), alignment=PP_ALIGN.CENTER)

page_num = 1

# ═══════════════════════════════════════════
# SLIDE 2: 목차
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
page_num += 1
add_header_bar(slide, "목차", "Table of Contents")
add_footer(slide, page_num)

toc = [
    ("01", "프로젝트 개요", "시스템 목적, AS-IS / TO-BE 비교"),
    ("02", "시스템 아키텍처", "기술 스택, 모노레포 구조"),
    ("03", "핵심 모듈 소개 (12개)", "전체 모듈 맵 및 기능 요약"),
    ("04", "Web 관리자 화면", "대시보드, 마스터, 입고, COA, 재고, 생산, 추적, 알림"),
    ("05", "Mobile 현장 화면", "스캔 입고, COA 촬영, 재고 조회, 생산 투입"),
    ("06", "사용 매뉴얼 - 마스터 관리", "원료, 공급업체, 규격, Location, 사용자"),
    ("07", "사용 매뉴얼 - 입고 & LOT", "입고 등록, LOT 생성, 바코드 발급"),
    ("08", "사용 매뉴얼 - COA 검수", "이미지 업로드, OCR 결과, 규격 비교, 승인"),
    ("09", "사용 매뉴얼 - 재고 관리", "재고 현황, 이동, Hold, 소비기한 모니터링"),
    ("10", "사용 매뉴얼 - 생산 투입", "작업지시, 바코드 스캔 투입, 검증 로직"),
    ("11", "사용 매뉴얼 - 추적성 & 리콜", "정방향/역방향 추적, 리콜 시뮬레이션"),
    ("12", "사용 매뉴얼 - 알림 & 대시보드", "알림 유형, KPI, 실시간 모니터링"),
]

y_start = Inches(1.5)
for i, (num, title, desc) in enumerate(toc):
    y = y_start + Inches(i * 0.45)
    col = i % 2
    x = Inches(0.8) + col * Inches(6.2)
    if i >= 6:
        y = y_start + Inches((i - 6) * 0.45) + Inches(2.85)
        col = (i - 6) % 2
        x = Inches(0.8) + col * Inches(6.2)

    # 번호 박스
    num_box = add_rounded_shape(slide, x, y, Inches(0.5), Inches(0.35), fill_color=GREEN_MID)
    num_box.text_frame.paragraphs[0].text = num
    num_box.text_frame.paragraphs[0].font.size = Pt(12)
    num_box.text_frame.paragraphs[0].font.color.rgb = WHITE
    num_box.text_frame.paragraphs[0].font.bold = True
    num_box.text_frame.paragraphs[0].font.name = "맑은 고딕"
    num_box.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    add_text(slide, x + Inches(0.6), y - Inches(0.02), Inches(4.5), Inches(0.25),
             title, font_size=13, color=BLACK, bold=True)
    add_text(slide, x + Inches(0.6), y + Inches(0.2), Inches(5), Inches(0.2),
             desc, font_size=9, color=GRAY)

# 구분선
add_shape(slide, Inches(0.8), y_start + Inches(2.7), Inches(11.7), Inches(0.02), fill_color=GREEN_LIGHT)
add_text(slide, Inches(0.8), y_start + Inches(2.35), Inches(3), Inches(0.3),
         "시스템 소개", font_size=11, color=GREEN_MID, bold=True)
add_text(slide, Inches(0.8), y_start + Inches(5.2) - Inches(2.85) + Inches(2.7), Inches(3), Inches(0.3),
         "사용 매뉴얼", font_size=11, color=GREEN_MID, bold=True)


# ═══════════════════════════════════════════
# SLIDE 3: 프로젝트 개요
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
page_num += 1
add_header_bar(slide, "01. 프로젝트 개요", "원료 입고부터 생산 투입까지 LOT 단위 전 과정 관리")
add_footer(slide, page_num)

# 목적 박스
add_rounded_shape(slide, Inches(0.5), Inches(1.5), Inches(12.3), Inches(1.2), fill_color=GREEN_LIGHT)
add_text(slide, Inches(0.8), Inches(1.55), Inches(11.5), Inches(0.3),
         "시스템 목적", font_size=16, color=GREEN_DARK, bold=True)
add_text(slide, Inches(0.8), Inches(1.9), Inches(11.5), Inches(0.7),
         "원료 입고부터 생산 투입까지 전 과정을 LOT 단위로 연결하여 실물과 시스템 재고 일치도를 향상시키고,\n스마트폰 Scan과 AI 자동검수를 통해 정확성·업무효율·Traceability를 강화한다.",
         font_size=13, color=BLACK)

# AS-IS / TO-BE 비교 테이블
add_text(slide, Inches(0.8), Inches(2.9), Inches(5), Inches(0.4),
         "AS-IS vs TO-BE 핵심 전환", font_size=16, color=GREEN_DARK, bold=True)

table_data = [
    ["구분", "AS-IS (현행)", "TO-BE (SSC 2.0)"],
    ["입고", "수기 등록, LOT 직접 입력", "Barcode/QR Scan → 자동 호출"],
    ["COA 검수", "담당자 육안 검토", "AI-OCR → 규격 자동비교 → 판정지원"],
    ["재고", "수동 확인, 위치 이력 미흡", "LOT/Location별 실시간 동기화"],
    ["추적", "수동 역추적, 시간 과다", "정방향/역방향 즉시 조회"],
    ["알림", "수동 점검", "자동 알림 (소비기한, Hold, 부적합)"],
]
add_table_slide(slide, Inches(0.8), Inches(3.4), table_data,
                [Inches(1.5), Inches(4.8), Inches(5.5)])


# ═══════════════════════════════════════════
# SLIDE 4: 시스템 아키텍처
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
page_num += 1
add_header_bar(slide, "02. 시스템 아키텍처", "기술 스택 및 모노레포 구조")
add_footer(slide, page_num)

# 기술 스택 테이블
add_text(slide, Inches(0.5), Inches(1.4), Inches(5), Inches(0.4),
         "기술 스택", font_size=16, color=GREEN_DARK, bold=True)

tech_data = [
    ["계층", "기술", "설명"],
    ["Database", "PostgreSQL 15+", "LOT/재고/추적 데이터 관리"],
    ["Backend", "Supabase (BaaS)", "Auth, Storage, Realtime, Edge Functions"],
    ["Web Frontend", "Next.js 15 (App Router)", "관리자 대시보드 (PC/태블릿)"],
    ["Mobile Frontend", "Next.js 15 (PWA)", "현장 스마트폰 스캔 업무"],
    ["ORM", "Drizzle ORM", "타입세이프 쿼리, 스키마 관리"],
    ["UI", "shadcn/ui + Tailwind CSS", "일관된 디자인 시스템"],
    ["Language", "TypeScript (풀스택)", "타입 안전성, 코드 공유"],
    ["Monorepo", "Turborepo + pnpm", "패키지 간 의존성 관리"],
    ["Barcode/QR", "html5-qrcode + qrcode", "모바일 스캔 및 QR 생성"],
    ["OCR/AI", "Claude Vision + Rule Engine", "COA 시험성적서 자동 판독"],
]
add_table_slide(slide, Inches(0.5), Inches(1.9), tech_data,
                [Inches(1.5), Inches(3), Inches(4)])

# 모노레포 구조
add_text(slide, Inches(9.2), Inches(1.4), Inches(4), Inches(0.4),
         "프로젝트 구조", font_size=16, color=GREEN_DARK, bold=True)

structure_lines = [
    "pulmuone-ssc/",
    "  apps/",
    "    web/         관리자 대시보드",
    "    mobile/      현장 모바일 PWA",
    "  packages/",
    "    db/           Drizzle 스키마",
    "    shared/       공통 타입/상수",
    "  docs/           문서",
]
add_rounded_shape(slide, Inches(9.2), Inches(1.85), Inches(3.8), Inches(3.2), fill_color=RGBColor(0x26, 0x32, 0x38))
y = Inches(1.95)
for line in structure_lines:
    add_text(slide, Inches(9.4), y, Inches(3.5), Inches(0.3),
             line, font_size=11, color=RGBColor(0xB2, 0xFF, 0x59), font_name="Consolas")
    y += Inches(0.32)

# Web / Mobile 요약
add_rounded_shape(slide, Inches(9.2), Inches(5.2), Inches(3.8), Inches(1.6), fill_color=GREEN_LIGHT)
add_text(slide, Inches(9.4), Inches(5.3), Inches(3.5), Inches(0.25),
         "Web: 18개 페이지 + 12개 Actions", font_size=11, color=GREEN_DARK, bold=True)
add_text(slide, Inches(9.4), Inches(5.6), Inches(3.5), Inches(0.25),
         "Mobile: 6개 페이지 + 5개 Actions", font_size=11, color=GREEN_DARK, bold=True)
add_text(slide, Inches(9.4), Inches(5.9), Inches(3.5), Inches(0.6),
         "Server Actions 패턴 (CRUD)\n@tanstack/react-table (DataTable)\nsonner (Toast 알림)",
         font_size=10, color=GRAY)


# ═══════════════════════════════════════════
# SLIDE 5: 핵심 모듈 맵
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
page_num += 1
add_header_bar(slide, "03. 핵심 모듈 소개", "12개 핵심 모듈 - 전체 프로세스 맵")
add_footer(slide, page_num)

modules = [
    ("1. Master", "원료/업체/규격\n마스터 관리", GREEN_MID),
    ("2. Inbound", "입고 등록\nLOT 관리", GREEN_MID),
    ("3. Barcode", "QR 바코드\n생성/출력", GREEN_MID),
    ("4. COA", "시험성적서\n촬영/업로드", BLUE),
    ("5. OCR", "시험정보\nAI 추출", BLUE),
    ("6. Rule", "규격 자동비교\n합격/불합격", BLUE),
    ("7. Inventory", "LOT x Location\n재고 관리", ORANGE),
    ("8. Production", "Scan 기반\n생산 투입", ORANGE),
    ("9. Mobile", "스마트폰\nScan 업무", RGBColor(0x7B, 0x1F, 0xA2)),
    ("10. Traceability", "정방향/역방향\n추적", RED),
    ("11. Alert", "소비기한/Hold\n부적합 알림", RED),
    ("12. Dashboard", "KPI 현황판\n실시간 모니터링", RED),
]

# 프로세스 흐름
add_text(slide, Inches(0.5), Inches(1.4), Inches(12), Inches(0.3),
         "입고 → 검수 → 재고 → 생산 → 추적  |  전 과정 LOT 연결",
         font_size=14, color=GRAY, alignment=PP_ALIGN.CENTER)

# 모듈 카드 4x3 배치
for i, (name, desc, color) in enumerate(modules):
    row = i // 4
    col = i % 4
    x = Inches(0.5) + col * Inches(3.15)
    y = Inches(1.9) + row * Inches(1.65)

    card = add_rounded_shape(slide, x, y, Inches(2.9), Inches(1.4), fill_color=WHITE)
    # 상단 바
    add_shape(slide, x, y, Inches(2.9), Inches(0.06), fill_color=color)
    # 모듈명
    add_text(slide, x + Inches(0.15), y + Inches(0.12), Inches(2.6), Inches(0.3),
             name, font_size=14, color=color, bold=True)
    # 설명
    add_text(slide, x + Inches(0.15), y + Inches(0.5), Inches(2.6), Inches(0.8),
             desc, font_size=11, color=BLACK)

# 카테고리 라벨
add_text(slide, Inches(0.5), Inches(1.65), Inches(3), Inches(0.3),
         "기초 관리", font_size=10, color=GREEN_MID, bold=True)
add_text(slide, Inches(3.65), Inches(3.3), Inches(3), Inches(0.3),
         "품질 검수", font_size=10, color=BLUE, bold=True)
add_text(slide, Inches(6.8), Inches(3.3), Inches(3), Inches(0.3),
         "재고/생산", font_size=10, color=ORANGE, bold=True)
add_text(slide, Inches(9.95), Inches(3.3), Inches(3), Inches(0.3),
         "추적/모니터링", font_size=10, color=RED, bold=True)


# ═══════════════════════════════════════════
# SLIDE 6: Web 관리자 화면 - 전체 라우트
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
page_num += 1
add_header_bar(slide, "04. Web 관리자 화면", "18개 페이지 구성 - PC/태블릿 기반 관리 업무")
add_footer(slide, page_num)

# 사이드바 구조
add_text(slide, Inches(0.5), Inches(1.4), Inches(3), Inches(0.3),
         "사이드바 네비게이션", font_size=14, color=GREEN_DARK, bold=True)

sidebar_items = [
    ("대시보드", "/dashboard"),
    ("마스터 관리", ""),
    ("  원료 관리", "/master/materials"),
    ("  공급업체 관리", "/master/suppliers"),
    ("  규격 관리", "/master/specs"),
    ("  Location 관리", "/master/locations"),
    ("  사용자 관리", "/master/users"),
    ("입고 관리", "/inbound"),
    ("COA 검수", "/coa"),
    ("재고 현황", "/inventory"),
    ("재고 이력", "/inventory/transactions"),
    ("생산 관리", "/production"),
    ("Traceability", "/trace"),
    ("알림", "/alerts"),
]

nav_data = [["메뉴명", "경로"]] + [[n, p] for n, p in sidebar_items]
add_table_slide(slide, Inches(0.5), Inches(1.8), nav_data,
                [Inches(2.2), Inches(2.8)])

# 화면 기능 요약 카드
cards_data = [
    ("대시보드", ["오늘 입고건수 KPI", "OCR 완료/오류/대기 현황", "최근 입고 10건 리스트", "미처리 알림 5건", "재고 상태별 요약"]),
    ("입고 관리", ["입고 등록 (자동 번호 생성)", "LOT 생성 (바코드 자동 발급)", "LOT 상태 관리", "입고 상세 조회"]),
    ("COA 검수", ["이미지 업로드", "수동 OCR 결과 입력", "규격 자동비교 (Rule Engine)", "합격/불합격 승인"]),
    ("재고/생산", ["LOT x Location 재고 매트릭스", "재고 이동/Hold/Release", "작업지시서 관리", "바코드 스캔 생산 투입"]),
]

x_start = Inches(6)
for i, (title, items) in enumerate(cards_data):
    y = Inches(1.5) + i * Inches(1.4)
    add_card(slide, x_start, y, Inches(6.8), Inches(1.25), title, items,
             icon_color=[GREEN_MID, BLUE, ORANGE, RED][i], title_size=13, item_size=10)


# ═══════════════════════════════════════════
# SLIDE 7: Mobile 현장 화면
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
page_num += 1
add_header_bar(slide, "05. Mobile 현장 화면 (PWA)", "6개 페이지 - 스마트폰 기반 현장 업무")
add_footer(slide, page_num)

mobile_screens = [
    ("홈", "5개 퀵 액션 카드\n현장 업무 메인 허브", RGBColor(0x42, 0xA5, 0xF5), [
        "입고 스캔", "COA 촬영", "재고 조회", "생산 투입", "알림 확인"
    ]),
    ("입고 스캔", "바코드 스캔 → LOT 조회\n입고 확인 처리", BLUE, [
        "html5-qrcode 카메라 스캔", "LOT 정보 자동 표시", "입고 확인 버튼"
    ]),
    ("COA 촬영", "시험성적서 사진 촬영\n이미지 업로드", RGBColor(0x7B, 0x1F, 0xA2), [
        "카메라 촬영 (capture=environment)", "이미지 미리보기", "서버 업로드"
    ]),
    ("재고 조회", "바코드 스캔 → 재고 확인\n다중 Location 표시", GREEN_MID, [
        "바코드 스캔으로 LOT 조회", "Location별 재고량 표시", "Location 등록"
    ]),
    ("생산 투입", "작업지시 선택 → 스캔\n수량 입력 → 투입", ORANGE, [
        "오늘 작업지시 목록", "바코드 스캔 투입", "ERR-012/045 검증"
    ]),
    ("알림", "미처리 알림 확인\n즉시 대응", RED, [
        "Critical/Warning/Info 분류", "읽음 처리", "최대 50건 표시"
    ]),
]

for i, (name, desc, color, features) in enumerate(mobile_screens):
    col = i % 3
    row = i // 3
    x = Inches(0.5) + col * Inches(4.2)
    y = Inches(1.5) + row * Inches(2.8)

    # 카드
    card = add_rounded_shape(slide, x, y, Inches(3.9), Inches(2.5), fill_color=WHITE)
    add_shape(slide, x, y, Inches(3.9), Inches(0.06), fill_color=color)

    # 화면명
    add_text(slide, x + Inches(0.2), y + Inches(0.15), Inches(3.5), Inches(0.3),
             name, font_size=16, color=color, bold=True)
    add_text(slide, x + Inches(0.2), y + Inches(0.5), Inches(3.5), Inches(0.5),
             desc, font_size=11, color=GRAY)

    # 기능 목록
    fy = y + Inches(1.1)
    for feat in features:
        add_text(slide, x + Inches(0.3), fy, Inches(3.3), Inches(0.25),
                 f"• {feat}", font_size=10, color=BLACK)
        fy += Inches(0.25)


# ═══════════════════════════════════════════
# SLIDE 8: 매뉴얼 - 마스터 관리
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
page_num += 1
add_header_bar(slide, "06. 사용 매뉴얼 - 마스터 관리", "원료, 공급업체, 규격, Location, 사용자 기초 데이터 관리")
add_footer(slide, page_num)

# 5개 마스터 카드
masters = [
    ("원료 관리", "/master/materials", [
        "원료 코드/명칭 등록",
        "공급업체 연결",
        "단위, 보관유형, 유통기한 설정",
        "안전재고 수량 설정",
        "검색/필터/정렬 지원"
    ]),
    ("공급업체 관리", "/master/suppliers", [
        "업체 코드/명칭 등록",
        "사업자등록번호 관리",
        "담당자/연락처/이메일",
        "주소 정보 관리",
        "활성/비활성 상태 관리"
    ]),
    ("규격 관리", "/master/specs", [
        "원료별 시험 항목 설정",
        "규격 유형: min/max/range/negative/exact",
        "최소값/최대값/텍스트 기준",
        "필수(Critical) 항목 지정",
        "정렬 순서 관리"
    ]),
    ("Location 관리", "/master/locations", [
        "창고/Zone/Rack/Level 구조",
        "Location 코드 체계",
        "보관유형 (상온/냉장/냉동)",
        "QR 코드 부여",
        "활성/비활성 관리"
    ]),
    ("사용자 관리", "/master/users", [
        "사번/성명 등록",
        "부서/역할 지정",
        "연락처 관리",
        "역할: admin/manager/operator/viewer",
        "활성/비활성 관리"
    ]),
]

for i, (name, path, items) in enumerate(masters):
    if i < 3:
        x = Inches(0.3) + i * Inches(4.2)
        y = Inches(1.5)
    else:
        x = Inches(2.4) + (i - 3) * Inches(4.2)
        y = Inches(4.2)

    add_card(slide, x, y, Inches(3.9), Inches(2.3), f"{name}  ({path})", items,
             icon_color=GREEN_MID, title_size=12, item_size=10)

# 공통 조작법
add_rounded_shape(slide, Inches(0.3), Inches(6.3), Inches(12.7), Inches(0.7), fill_color=GREEN_LIGHT)
add_text(slide, Inches(0.6), Inches(6.35), Inches(12), Inches(0.5),
         "공통 조작: [+ 추가] 버튼으로 신규 등록  |  행 클릭으로 수정  |  삭제는 비활성(Soft Delete) 처리  |  DataTable에서 정렬/검색 가능",
         font_size=11, color=GREEN_DARK)


# ═══════════════════════════════════════════
# SLIDE 9: 매뉴얼 - 입고 & LOT
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
page_num += 1
add_header_bar(slide, "07. 사용 매뉴얼 - 입고 & LOT 관리", "입고 등록 → LOT 생성 → 바코드 발급 프로세스")
add_footer(slide, page_num)

# 프로세스 플로우
flow_steps = [
    ("1", "입고 등록", "원료/공급업체 선택\n수량/일자 입력"),
    ("2", "LOT 생성", "공급업체 LOT 입력\n제조일/소비기한 설정"),
    ("3", "바코드 발급", "QR 코드 자동 생성\nPM-LOT-XXXXXX"),
    ("4", "상태 관리", "inspection → available\n→ hold/rejected/expired"),
]

for i, (num, title, desc) in enumerate(flow_steps):
    x = Inches(0.5) + i * Inches(3.2)
    y = Inches(1.5)

    # 번호 원
    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, x, y, Inches(0.5), Inches(0.5))
    circle.fill.solid()
    circle.fill.fore_color.rgb = GREEN_MID
    circle.line.fill.background()
    circle.text_frame.paragraphs[0].text = num
    circle.text_frame.paragraphs[0].font.size = Pt(18)
    circle.text_frame.paragraphs[0].font.color.rgb = WHITE
    circle.text_frame.paragraphs[0].font.bold = True
    circle.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    add_text(slide, x + Inches(0.6), y + Inches(0.05), Inches(2.2), Inches(0.3),
             title, font_size=15, color=GREEN_DARK, bold=True)
    add_text(slide, x + Inches(0.6), y + Inches(0.35), Inches(2.5), Inches(0.5),
             desc, font_size=11, color=GRAY)

# 상세 설명
add_text(slide, Inches(0.5), Inches(2.4), Inches(6), Inches(0.3),
         "입고 등록 상세", font_size=14, color=GREEN_DARK, bold=True)

inbound_details = [
    ["항목", "설명", "비고"],
    ["입고번호", "RCV-YYYYMMDD-XXXX 자동생성", "시스템 자동 부여"],
    ["원료 선택", "드롭다운에서 원료 선택", "원료 마스터 연동"],
    ["공급업체", "드롭다운에서 업체 선택", "공급업체 마스터 연동"],
    ["입고수량/단위", "숫자 입력 + 단위 선택", "kg, ea, L 등"],
    ["입고일자", "날짜 선택기", "기본값: 오늘"],
    ["비고", "자유 입력 (선택)", "특이사항 기록"],
]
add_table_slide(slide, Inches(0.5), Inches(2.8), inbound_details,
                [Inches(1.5), Inches(3.5), Inches(2.5)])

# LOT 상세
add_text(slide, Inches(0.5), Inches(5.3), Inches(6), Inches(0.3),
         "LOT 생성 상세", font_size=14, color=GREEN_DARK, bold=True)

lot_details = [
    ["항목", "설명"],
    ["LOT번호", "LOT-YYYYMMDD-XXXX 자동생성"],
    ["바코드값", "PM-{LOT번호} 자동생성 → QR 코드"],
    ["공급업체 LOT", "업체 제공 LOT번호 수기 입력"],
    ["제조일/소비기한", "날짜 선택기로 입력"],
    ["초기상태", "inspection (검수대기)"],
]
add_table_slide(slide, Inches(0.5), Inches(5.7), lot_details,
                [Inches(1.8), Inches(4.5)])

# 모바일 스캔
add_rounded_shape(slide, Inches(7.5), Inches(2.5), Inches(5.5), Inches(4.3), fill_color=GREEN_LIGHT)
add_text(slide, Inches(7.7), Inches(2.6), Inches(5), Inches(0.3),
         "모바일: 입고 스캔", font_size=14, color=GREEN_DARK, bold=True)
mobile_inbound = [
    "1. 모바일 홈 → [입고 스캔] 선택",
    "2. 카메라 자동 활성화",
    "3. 바코드/QR 스캔",
    "4. LOT 정보 자동 표시:",
    "   - LOT번호, 원료명, 공급업체",
    "   - 수량, 제조일, 소비기한",
    "   - 현재 상태",
    "5. [입고 확인] 버튼 → 완료",
    "",
    "※ 바코드가 없는 경우 수기 검색 가능",
]
y = Inches(3.0)
for line in mobile_inbound:
    add_text(slide, Inches(7.9), y, Inches(5), Inches(0.25),
             line, font_size=11, color=BLACK)
    y += Inches(0.28)


# ═══════════════════════════════════════════
# SLIDE 10: 매뉴얼 - COA 검수
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
page_num += 1
add_header_bar(slide, "08. 사용 매뉴얼 - COA 검수", "시험성적서 업로드 → OCR 추출 → 규격 자동비교 → 승인/반려")
add_footer(slide, page_num)

# 프로세스
coa_flow = [
    ("1", "이미지 업로드", "COA 시험성적서\n사진 촬영/파일 선택"),
    ("2", "검사 항목 입력", "시험항목별\n결과값 수동 입력"),
    ("3", "규격 자동비교", "Rule Engine이\n합격/불합격 자동판정"),
    ("4", "승인/반려", "검수 담당자\n최종 판정"),
]

for i, (num, title, desc) in enumerate(coa_flow):
    x = Inches(0.5) + i * Inches(3.2)
    y = Inches(1.5)
    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, x, y, Inches(0.5), Inches(0.5))
    circle.fill.solid()
    circle.fill.fore_color.rgb = BLUE
    circle.line.fill.background()
    circle.text_frame.paragraphs[0].text = num
    circle.text_frame.paragraphs[0].font.size = Pt(18)
    circle.text_frame.paragraphs[0].font.color.rgb = WHITE
    circle.text_frame.paragraphs[0].font.bold = True
    circle.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    add_text(slide, x + Inches(0.6), y + Inches(0.05), Inches(2.2), Inches(0.3),
             title, font_size=15, color=BLUE, bold=True)
    add_text(slide, x + Inches(0.6), y + Inches(0.35), Inches(2.5), Inches(0.5),
             desc, font_size=11, color=GRAY)

# Rule Engine 상세
add_text(slide, Inches(0.5), Inches(2.5), Inches(6), Inches(0.3),
         "Rule Engine - 규격 비교 로직", font_size=14, color=BLUE, bold=True)

rule_data = [
    ["규격 유형", "판정 로직", "예시"],
    ["min (최소값)", "coaValue >= specMin → Pass", "수분함량 >= 5.0%"],
    ["max (최대값)", "coaValue <= specMax → Pass", "중금속 <= 0.1 ppm"],
    ["range (범위)", "specMin <= coaValue <= specMax → Pass", "pH 6.0 ~ 7.0"],
    ["negative (음성)", "coaValue contains '음성/negative/불검출' → Pass", "대장균 음성"],
    ["exact (일치)", "coaValue == specText → Pass", "등급 '1등급'"],
]
add_table_slide(slide, Inches(0.5), Inches(2.9), rule_data,
                [Inches(1.5), Inches(4.0), Inches(2.5)], header_color=BLUE)

# 불합격 시 자동 처리
add_rounded_shape(slide, Inches(0.5), Inches(5.2), Inches(7.5), Inches(1.6), fill_color=RGBColor(0xFF, 0xEB, 0xEE))
add_text(slide, Inches(0.7), Inches(5.3), Inches(7), Inches(0.3),
         "불합격 시 자동 처리", font_size=14, color=RED, bold=True)
fail_items = [
    "• 1개 이상 항목 Fail → 전체 결과 'fail' 판정",
    "• 해당 LOT 상태 자동 변경: inspection → hold",
    "• 알림 자동 생성 (alertType: 'rejected', severity: 'critical')",
    "• 담당자가 검토 후 승인(available) 또는 반려(rejected) 최종 결정",
]
y = Inches(5.65)
for item in fail_items:
    add_text(slide, Inches(0.9), y, Inches(7), Inches(0.25), item, font_size=11, color=BLACK)
    y += Inches(0.28)

# 모바일 COA
add_rounded_shape(slide, Inches(8.5), Inches(2.5), Inches(4.5), Inches(4.3), fill_color=RGBColor(0xE8, 0xEA, 0xF6))
add_text(slide, Inches(8.7), Inches(2.6), Inches(4), Inches(0.3),
         "모바일: COA 촬영", font_size=14, color=RGBColor(0x7B, 0x1F, 0xA2), bold=True)
mobile_coa = [
    "1. 모바일 홈 → [COA 촬영] 선택",
    "2. [사진 촬영] 버튼 탭",
    "3. 카메라로 시험성적서 촬영",
    "4. 이미지 미리보기 확인",
    "5. [업로드] 버튼 → 서버 전송",
    "6. 업로드 완료 알림",
    "",
    "※ 촬영된 이미지는 Web에서",
    "   OCR 결과 입력 후 검수 진행",
]
y = Inches(3.0)
for line in mobile_coa:
    add_text(slide, Inches(8.9), y, Inches(4), Inches(0.25),
             line, font_size=11, color=BLACK)
    y += Inches(0.28)


# ═══════════════════════════════════════════
# SLIDE 11: 매뉴얼 - 재고 관리
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
page_num += 1
add_header_bar(slide, "09. 사용 매뉴얼 - 재고 관리", "LOT x Location 실시간 재고 매트릭스 & 이력 관리")
add_footer(slide, page_num)

# 재고 현황
add_card(slide, Inches(0.5), Inches(1.5), Inches(6), Inches(2.5),
         "재고 현황  (/inventory)", [
             "LOT x Location 매트릭스 형태 표시",
             "LOT별: 원료명, 수량, 상태, 소비기한",
             "Location별: 창고/Zone/Rack/Level",
             "상태 필터: available / hold / inspection",
             "소비기한 임박 LOT 별도 표시 (30일 이내)",
             "재고 등록: LOT를 Location에 배치",
         ], icon_color=ORANGE, title_size=14, item_size=11)

add_card(slide, Inches(6.8), Inches(1.5), Inches(6), Inches(2.5),
         "재고 이력  (/inventory/transactions)", [
             "모든 재고 변동 이력 조회 (최근 100건)",
             "거래 유형: inbound / move / consume / hold / release / reject",
             "방향: in (입고) / out (출고) / internal (내부이동)",
             "LOT번호, 원료명, Location, 수량 표시",
             "시간순 정렬 (최신순)",
         ], icon_color=ORANGE, title_size=14, item_size=11)

# 주요 기능 상세
add_text(slide, Inches(0.5), Inches(4.3), Inches(12), Inches(0.3),
         "재고 관리 주요 기능", font_size=14, color=ORANGE, bold=True)

inv_features = [
    ["기능", "설명", "비고"],
    ["재고 등록 (Inbound)", "LOT + Location + 수량 입력 → 재고 생성", "동일 LOT+Location은 수량 합산"],
    ["재고 이동 (Move)", "출발지 → 목적지 Location 이동", "FIFO 기반 수량 차감"],
    ["Hold / Release", "품질 이슈 시 Hold, 해제 시 Release", "상태 변경 + 사유 기록"],
    ["소비기한 모니터링", "30일 이내 만료 LOT 자동 표시", "available/inspection 상태만"],
    ["모바일 재고 조회", "바코드 스캔 → 해당 LOT 전 Location 재고 표시", "Location QR 등록도 가능"],
]
add_table_slide(slide, Inches(0.5), Inches(4.7), inv_features,
                [Inches(2.2), Inches(5.5), Inches(4)], header_color=ORANGE)


# ═══════════════════════════════════════════
# SLIDE 12: 매뉴얼 - 생산 투입
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
page_num += 1
add_header_bar(slide, "10. 사용 매뉴얼 - 생산 투입", "작업지시서 기반 바코드 스캔 투입 & 2단계 검증")
add_footer(slide, page_num)

# 프로세스
prod_flow = [
    ("1", "작업지시 생성", "제품명/LOT, 계획일\n필요 원료 등록"),
    ("2", "바코드 스캔", "원료 LOT 스캔\n자동 검증"),
    ("3", "수량 입력", "투입량 입력\nFIFO 차감"),
    ("4", "투입 완료", "Traceability 연결\n상태 업데이트"),
]

for i, (num, title, desc) in enumerate(prod_flow):
    x = Inches(0.5) + i * Inches(3.2)
    y = Inches(1.5)
    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, x, y, Inches(0.5), Inches(0.5))
    circle.fill.solid()
    circle.fill.fore_color.rgb = ORANGE
    circle.line.fill.background()
    circle.text_frame.paragraphs[0].text = num
    circle.text_frame.paragraphs[0].font.size = Pt(18)
    circle.text_frame.paragraphs[0].font.color.rgb = WHITE
    circle.text_frame.paragraphs[0].font.bold = True
    circle.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER

    add_text(slide, x + Inches(0.6), y + Inches(0.05), Inches(2.2), Inches(0.3),
             title, font_size=15, color=ORANGE, bold=True)
    add_text(slide, x + Inches(0.6), y + Inches(0.35), Inches(2.5), Inches(0.5),
             desc, font_size=11, color=GRAY)

# 2단계 검증 로직
add_text(slide, Inches(0.5), Inches(2.5), Inches(6), Inches(0.3),
         "2단계 자동 검증 시스템", font_size=14, color=ORANGE, bold=True)

# ERR-012
add_rounded_shape(slide, Inches(0.5), Inches(2.9), Inches(6), Inches(1.8), fill_color=RGBColor(0xFF, 0xF3, 0xE0))
add_text(slide, Inches(0.7), Inches(3.0), Inches(5.5), Inches(0.3),
         "ERR-012: LOT 상태 검증", font_size=13, color=ORANGE, bold=True)
err012_lines = [
    "• Hold / Expired / Rejected 상태의 LOT는 투입 차단",
    "• 자동 알림 생성: alertType='input_blocked', severity='critical'",
    "• 알림 메시지: '{LOT번호} LOT가 {상태}이므로 투입 불가'",
    "• 담당자 즉시 확인 필요",
]
y = Inches(3.35)
for item in err012_lines:
    add_text(slide, Inches(0.9), y, Inches(5.5), Inches(0.25), item, font_size=11, color=BLACK)
    y += Inches(0.25)

# ERR-045
add_rounded_shape(slide, Inches(0.5), Inches(4.9), Inches(6), Inches(1.8), fill_color=RGBColor(0xFF, 0xEB, 0xEE))
add_text(slide, Inches(0.7), Inches(5.0), Inches(5.5), Inches(0.3),
         "ERR-045: 원료 매칭 검증", font_size=13, color=RED, bold=True)
err045_lines = [
    "• 작업지시서에 포함되지 않은 원료 투입 시도 시 차단",
    "• 자동 알림 생성: alertType='input_blocked', severity='warning'",
    "• 알림 메시지: '{원료명}은(는) 작업지시 {지시번호}에 미포함'",
    "• 오투입 방지 → 생산 품질 보장",
]
y = Inches(5.35)
for item in err045_lines:
    add_text(slide, Inches(0.9), y, Inches(5.5), Inches(0.25), item, font_size=11, color=BLACK)
    y += Inches(0.25)

# 모바일 생산 투입
add_rounded_shape(slide, Inches(7), Inches(2.5), Inches(5.8), Inches(4.2), fill_color=RGBColor(0xFE, 0xF7, 0xE0))
add_text(slide, Inches(7.2), Inches(2.6), Inches(5.5), Inches(0.3),
         "모바일: 생산 투입 절차", font_size=14, color=ORANGE, bold=True)
mobile_prod = [
    "1. 모바일 홈 → [생산 투입] 선택",
    "2. 오늘 작업지시 목록 표시 (planned/in_progress)",
    "3. 작업지시 선택",
    "4. 원료 LOT 바코드 스캔",
    "5. 자동 검증 (ERR-012 / ERR-045)",
    "   - 통과 시: 투입 수량 입력 화면",
    "   - 실패 시: 오류 메시지 표시",
    "6. 투입 수량 입력",
    "7. [투입 확인] → FIFO 재고 차감",
    "8. 투입 완료 알림 (LOT번호 표시)",
    "",
    "※ 작업지시 상태: planned → in_progress 자동 전환",
    "※ 모든 투입 기록은 Traceability로 자동 연결",
]
y = Inches(3.0)
for line in mobile_prod:
    add_text(slide, Inches(7.4), y, Inches(5.3), Inches(0.25),
             line, font_size=11, color=BLACK)
    y += Inches(0.27)


# ═══════════════════════════════════════════
# SLIDE 13: 매뉴얼 - Traceability & 리콜
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
page_num += 1
add_header_bar(slide, "11. 사용 매뉴얼 - 추적성 & 리콜 시뮬레이션", "정방향/역방향 추적 및 리콜 대응 시뮬레이션")
add_footer(slide, page_num)

# 3가지 추적 기능
trace_features = [
    ("정방향 추적 (Forward)", BLUE,
     "원료 LOT → 어떤 제품에 사용되었나?",
     [
         "원료 LOT번호 검색/입력",
         "해당 LOT가 투입된 모든 제품 표시",
         "제품별: 투입량, 투입일시, 작업상태",
         "원료 상세: 원료명, 공급업체, 제조일, 소비기한",
     ]),
    ("역방향 추적 (Backward)", GREEN_MID,
     "제품 LOT → 어떤 원료가 사용되었나?",
     [
         "제품 LOT번호 검색/입력",
         "해당 제품에 사용된 모든 원료 표시",
         "원료별: LOT번호, 공급업체, 제조일, 소비기한",
         "제품 상세: 제품명, 작업지시번호, 계획일",
     ]),
    ("리콜 시뮬레이션", RED,
     "문제 LOT → 영향 범위는?",
     [
         "문제 원료 LOT번호 입력",
         "영향받는 모든 제품 자동 파악",
         "각 제품의 다른 원료 LOT까지 표시",
         "리콜 대상 LOT 명확화 → 즉시 대응 가능",
     ]),
]

for i, (title, color, subtitle, items) in enumerate(trace_features):
    x = Inches(0.5) + i * Inches(4.2)
    y = Inches(1.5)

    card = add_rounded_shape(slide, x, y, Inches(3.9), Inches(3.5), fill_color=WHITE)
    add_shape(slide, x, y, Inches(3.9), Inches(0.06), fill_color=color)

    add_text(slide, x + Inches(0.2), y + Inches(0.15), Inches(3.5), Inches(0.3),
             title, font_size=15, color=color, bold=True)
    add_text(slide, x + Inches(0.2), y + Inches(0.5), Inches(3.5), Inches(0.4),
             subtitle, font_size=11, color=GRAY)

    fy = y + Inches(1.0)
    for item in items:
        add_text(slide, x + Inches(0.3), fy, Inches(3.3), Inches(0.25),
                 f"• {item}", font_size=11, color=BLACK)
        fy += Inches(0.28)

# 사용 방법
add_rounded_shape(slide, Inches(0.5), Inches(5.3), Inches(12.3), Inches(1.6), fill_color=GREEN_LIGHT)
add_text(slide, Inches(0.7), Inches(5.4), Inches(11.5), Inches(0.3),
         "Traceability 화면 사용법  (/trace)", font_size=14, color=GREEN_DARK, bold=True)
trace_manual = [
    "1. 추적 유형 선택: [정방향] / [역방향] / [리콜 시뮬레이션] 탭 선택",
    "2. LOT 검색: 검색창에 LOT번호 2글자 이상 입력 → 자동완성 목록에서 선택 (ILIKE 검색, 최대 10건)",
    "3. [추적 실행] 버튼 클릭 → 결과 표시",
    "4. 리콜 시뮬레이션의 경우: 영향받는 제품 수 + 상세 목록 + 공동 원료 정보까지 한눈에 확인",
]
y = Inches(5.75)
for item in trace_manual:
    add_text(slide, Inches(0.9), y, Inches(11.5), Inches(0.25), item, font_size=11, color=BLACK)
    y += Inches(0.28)


# ═══════════════════════════════════════════
# SLIDE 14: 매뉴얼 - 알림 & 대시보드
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
page_num += 1
add_header_bar(slide, "12. 사용 매뉴얼 - 알림 & 대시보드", "실시간 알림 체계 및 KPI 대시보드")
add_footer(slide, page_num)

# 알림 시스템
add_text(slide, Inches(0.5), Inches(1.4), Inches(6), Inches(0.3),
         "알림 시스템  (/alerts)", font_size=14, color=RED, bold=True)

alert_data = [
    ["알림 유형", "발생 조건", "심각도", "자동 처리"],
    ["rejected", "COA 검수 불합격", "Critical", "LOT → hold 상태"],
    ["input_blocked\n(ERR-012)", "Hold/Expired/Rejected LOT 투입 시도", "Critical", "투입 차단"],
    ["input_blocked\n(ERR-045)", "작업지시 미포함 원료 투입 시도", "Warning", "투입 차단"],
    ["expiry_warning", "소비기한 30일 이내", "Warning", "모니터링 표시"],
]
add_table_slide(slide, Inches(0.5), Inches(1.8), alert_data,
                [Inches(1.8), Inches(3.5), Inches(1.2), Inches(2)], header_color=RED)

# 알림 관리
add_rounded_shape(slide, Inches(0.5), Inches(4.0), Inches(8), Inches(1.2), fill_color=RGBColor(0xFF, 0xEB, 0xEE))
add_text(slide, Inches(0.7), Inches(4.05), Inches(7.5), Inches(0.3),
         "알림 관리 조작법", font_size=13, color=RED, bold=True)
alert_ops = [
    "• [모두 읽음] 버튼: 미확인 알림 전체 읽음 처리",
    "• 개별 알림 클릭: 읽음 처리 + 상세 내용 확인",
    "• [해결 완료] 버튼: 알림 해결 처리 (resolvedAt 기록) | 최근 200건 표시 (최신순)",
]
y = Inches(4.4)
for item in alert_ops:
    add_text(slide, Inches(0.9), y, Inches(7.5), Inches(0.25), item, font_size=11, color=BLACK)
    y += Inches(0.25)

# 대시보드
add_text(slide, Inches(0.5), Inches(5.5), Inches(6), Inches(0.3),
         "대시보드  (/dashboard)", font_size=14, color=GREEN_DARK, bold=True)

dashboard_cards = [
    ("오늘 입고", "당일 입고건수\n실시간 카운트", GREEN_MID),
    ("OCR 완료", "OCR 처리 완료\n건수 표시", BLUE),
    ("검수 오류", "COA 불합격\n건수 (Fail)", RED),
    ("검수 대기", "미처리 COA\n건수 (Pending)", ORANGE),
]

for i, (name, desc, color) in enumerate(dashboard_cards):
    x = Inches(0.5) + i * Inches(2.1)
    y = Inches(5.9)
    card = add_rounded_shape(slide, x, y, Inches(1.9), Inches(1.0), fill_color=WHITE)
    add_shape(slide, x, y, Inches(1.9), Inches(0.05), fill_color=color)
    add_text(slide, x + Inches(0.1), y + Inches(0.1), Inches(1.7), Inches(0.25),
             name, font_size=11, color=color, bold=True)
    add_text(slide, x + Inches(0.1), y + Inches(0.4), Inches(1.7), Inches(0.5),
             desc, font_size=9, color=GRAY)

# 대시보드 추가 요소
add_rounded_shape(slide, Inches(9), Inches(4.0), Inches(4.2), Inches(2.9), fill_color=GREEN_LIGHT)
add_text(slide, Inches(9.2), Inches(4.1), Inches(3.8), Inches(0.3),
         "대시보드 구성 요소", font_size=13, color=GREEN_DARK, bold=True)
dash_items = [
    "• KPI 카드 4종 (입고/OCR/오류/대기)",
    "• 최근 입고 10건 리스트",
    "  - 입고번호, 원료, 업체, 수량",
    "  - LOT수, COA 상태 표시",
    "• 미처리 알림 5건 표시",
    "• 재고 상태별 요약",
    "  - available / hold / inspection",
    "  - 각 상태별 건수 집계",
]
y = Inches(4.45)
for item in dash_items:
    add_text(slide, Inches(9.3), y, Inches(3.8), Inches(0.25), item, font_size=10, color=BLACK)
    y += Inches(0.27)


# ═══════════════════════════════════════════
# SLIDE 15: 마무리
# ═══════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
page_num += 1
add_shape(slide, 0, 0, SLIDE_W, SLIDE_H, fill_color=GREEN_DARK)

add_shape(slide, 0, Inches(2.2), SLIDE_W, Inches(0.03), fill_color=RGBColor(0xA5, 0xD6, 0xA7))
add_shape(slide, 0, Inches(5.0), SLIDE_W, Inches(0.03), fill_color=RGBColor(0xA5, 0xD6, 0xA7))

add_text(slide, Inches(1), Inches(1.0), Inches(11), Inches(0.6),
         "PULMUONE SSC 2.0", font_size=20, color=RGBColor(0xA5, 0xD6, 0xA7), alignment=PP_ALIGN.CENTER)

add_text(slide, Inches(1), Inches(2.5), Inches(11), Inches(0.8),
         "Thank You", font_size=44, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)

add_text(slide, Inches(1), Inches(3.4), Inches(11), Inches(0.6),
         "AI 기반 원료·재고 통합관리 플랫폼", font_size=20, color=RGBColor(0xC8, 0xE6, 0xC9), alignment=PP_ALIGN.CENTER)

# 핵심 성과 요약
summary_items = [
    "12개 핵심 모듈 구축 완료",
    "Web 18페이지 + Mobile 6페이지",
    "LOT 기반 전 과정 추적성 확보",
    "AI-OCR 규격 자동비교 시스템",
    "2단계 생산 투입 검증 (ERR-012/045)",
    "리콜 시뮬레이션 즉시 대응 체계",
]

y = Inches(5.3)
for item in summary_items:
    add_text(slide, Inches(3), y, Inches(7), Inches(0.3),
             f"  {item}", font_size=13, color=RGBColor(0xC8, 0xE6, 0xC9), alignment=PP_ALIGN.CENTER)
    y += Inches(0.3)

add_text(slide, Inches(1), Inches(4.2), Inches(11), Inches(0.4),
         "풀무원기술원 품질기술센터  |  2026", font_size=14, color=RGBColor(0xA5, 0xD6, 0xA7), alignment=PP_ALIGN.CENTER)


# ── 저장 ──
output_path = r"D:\DATA2\pulmuone-ssc\docs\Pulmuone_SSC2.0_시스템소개_사용매뉴얼.pptx"
prs.save(output_path)
print(f"PPT 생성 완료: {output_path}")
print(f"총 {page_num} 페이지")
