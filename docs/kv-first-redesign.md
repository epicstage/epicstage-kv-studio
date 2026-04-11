# KV-First Process Redesign

## 핵심 원칙

> 마스터 KV를 먼저 확정하고, KV의 모든 비주얼 요소를 엄격하게 상속해서 54종 바리에이션을 만든다.

---

## 1. 새 플로우 (4-Step)

```
Step 1  입력 & 레퍼런스     → 행사 정보, 티어, CI 업로드, 레퍼런스 검색
Step 2  가이드라인 확인     → 색상/무드/모티프/레이아웃 (KV 생성 전 참고 자료)
Step 3  마스터 KV 생성     → 1장 확정 후에만 Step 4 진입 가능
Step 4  바리에이션 생성     → 54종 중 원하는 포맷 선택, KV 기반 생성
```

현재(3-Step) → 변경 내용:
- Step 1·2 동일 (Step 1 레이블만 "입력 & 레퍼런스"로 변경)
- **Step 3 신설**: 마스터 KV 전용 UI
- **기존 Step 3 → Step 4**: ProductionGrid 이동, KV 기반 생성으로 로직 교체

---

## 2. Step 3 — 마스터 KV

### 2-1. UI 구성

```
┌──────────────────────────────────────────────────────┐
│  마스터 KV                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ 16:9 가로형  │  │  3:4 세로형  │  │ 1:1 정사각 │ │  ← 비율 선택
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                       │
│  [ 생성 ]  [ 업로드 ]                                 │
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │                  KV 이미지                     │   │
│  │             (생성되면 여기 표시)               │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  [ 재생성 (다른 시드) ]  [ 색상 편집 ]               │
│                                                       │
│  ████████████████  Step 4로 확정  ████████████████   │  ← 확정 버튼
└──────────────────────────────────────────────────────┘
```

### 2-2. 생성 방식

**A. Gemini 생성 (기본)**
- 가이드라인 + CI 이미지 → `generateMasterKV()` 신규 함수
- 프롬프트: 기존 `generateProductionImage` 동일 방식, 단 prod.name = "메인 KV"
- 재생성 = temperature: 1, 매번 다른 시드

**B. 업로드**
- PNG/JPG/WebP 업로드 → base64 변환 → `masterKv.imageUrl`에 저장
- 업로드 이미지는 "리사이징 전용" — 바리에이션 생성 시 Gemini에 그대로 전달

### 2-3. 편집

- 색상 편집: 현재 ColorPaletteEditor 동일 (가이드라인의 color_palette 수정)
- 재생성: "다른 시드로 재생성" 버튼 → 같은 프롬프트, temperature:1

### 2-4. 확정

- "Step 4로 확정" 버튼 클릭 → `version.masterKv.confirmed = true`
- 확정 후 Step 4 접근 가능
- 확정 후 KV 수정 시 → Step 4의 모든 바리에이션에 `stale: true` 표시

---

## 3. Step 4 — 바리에이션 생성

### 3-1. 카탈로그 (54종)

MASTER_CATALOG에서 KV 3종 제외한 전체:
- 현장 15종 (무대 배경 ~ LED 전광판)
- 인쇄 13종 (프로그램 북 ~ 상장)
- 디지털 16종 (인스타그램 ~ 웨비나 타이틀)
- 굿즈 7종 (에코백 ~ 기프트 박스)

### 3-2. UI 구성

현행 CatalogSelector + ProductionGrid 구조 유지, 변경점:

1. **"KV 변경됨" 배지**: `prod.stale === true` 시 카드에 주황색 배지 + "재생성 필요"
2. **생성 버튼**: "제작 계획 생성 → 이미지 생성" 2단계 유지 (현행 동일)
3. **대지 버전 버튼**: 수정 필요 (아래 섹션 참조)

### 3-3. 생성 로직 변경

**현재:**
```
generateProductionImage(guideline, prod, ciImages, guideImages, refAnalysis)
```

**변경 후:**
```
generateProductionImage(guideline, prod, ciImages, masterKvUrl, refAnalysis)
```

- `guideImages` → `masterKvUrl` (마스터 KV 1장으로 교체)
- Gemini 호출 시 첫 번째 inlineData = 마스터 KV 이미지
- 프롬프트 prefix 추가:

```
MASTER KV REFERENCE (attached image): Extract all visual elements from this KV image.
Your output MUST use the identical color palette, graphic motifs, background style,
typography mood, and compositional language — adapted to ${prod.ratio} aspect ratio.
Do NOT invent new design elements.
```

### 3-4. 대지 버전 수정 (현재 broken)

**현재 문제:**
- `generateNoTextVersion` prod 경로: multi-turn + `thoughtSignature` 방식
- Gemini `gemini-3.1-flash-image-preview`는 multi-turn 이미지 편집이 불안정

**수정 방향:**

```typescript
// 단일 턴으로 교체
export async function generateNoTextVersion(originalImageUrl: string): Promise<string> {
  // originalImageUrl의 base64 추출
  // 단일 user turn: [이미지 inlineData, removeTextPrompt]
  // thoughtSignature 제거
}
```

프롬프트:
```
Remove ALL text, numbers, and typographic elements from this image.
Preserve 100% of: backgrounds, colors, graphic shapes, textures, patterns, decorative elements.
Output only the text-free artboard/canvas version.
```

---

## 4. 데이터 모델 변경

### use-store.ts — Version 타입 추가

```typescript
export type MasterKv = {
  imageUrl: string;      // data:image/... base64 또는 업로드 URL
  ratio: string;         // "16:9" | "3:4" | "1:1"
  confirmed: boolean;
  uploadedByUser?: boolean;  // 업로드 여부
};

// Version에 추가
export type Version = {
  // ... 기존 필드
  masterKv?: MasterKv;
};

// Production에 추가
export type Production = {
  // ... 기존 필드
  stale?: boolean;   // KV 변경 후 재생성 필요 여부
};
```

### store actions 추가

```typescript
setMasterKv: (versionId: string, kv: MasterKv) => void;
confirmMasterKv: (versionId: string) => void;
markVariationsStale: (versionId: string) => void;  // KV 변경 시 호출
```

---

## 5. 파일별 변경 목록

| 파일 | 변경 내용 |
|------|-----------|
| `use-store.ts` | `MasterKv` 타입, `masterKv` 필드, `stale` 필드, 3개 액션 추가 |
| `constants.ts` | KV_ITEMS (3종), NON_KV_CATALOG (54종) 상수 분리 |
| `guideline-generator.ts` | `generateMasterKV()` 신규, `generateProductionImage()` 시그니처 변경, `generateNoTextVersion()` 단일턴으로 수정 |
| `studio-app.tsx` | Step 4개로 확장, Step 3 KV UI 추가, Step 4 = 기존 Step 3 |
| `kv-generator.tsx` | **신규** — Step 3 전용 컴포넌트 |
| `production-grid.tsx` | `masterKvUrl` 수신, `stale` 배지, 대지 버튼 수정 |
| `workers/src/index.ts` | `/api/generate-notext` 엔드포인트 추가 (로컬 개발용) |

---

## 6. 신규 컴포넌트: kv-generator.tsx

```
KvGenerator
├── KvRatioSelector   (16:9 / 3:4 / 1:1 탭)
├── KvCanvas          (생성된 이미지 표시, 업로드 드롭존)
├── KvActions         (생성 / 재생성 / 업로드 버튼)
├── KvColorEdit       (ColorPaletteEditor 재사용)
└── KvConfirmBar      (확정 버튼, 확정 상태 표시)
```

---

## 7. 구현 순서

1. **`use-store.ts`** — 타입 + 액션 추가
2. **`constants.ts`** — KV_ITEMS / NON_KV_CATALOG 분리
3. **`guideline-generator.ts`** — `generateMasterKV`, `generateNoTextVersion` 수정
4. **`kv-generator.tsx`** — Step 3 신규 컴포넌트
5. **`studio-app.tsx`** — 4-Step 구조로 리팩터
6. **`production-grid.tsx`** — masterKvUrl 연결, stale 배지
7. **배포 & 테스트**

---

## 8. 대지 버전 버그 원인 (현재)

`generateNoTextVersion` prod 경로:
```typescript
// 문제: history[1].parts에 thoughtSignature를 넣는데
// 첫 생성 시 thoughtSignature가 undefined → 빈 parts
// → Gemini가 이전 이미지를 "모델 응답"으로 인식 못 함
const history = [
  { role: "user", parts: [{ text: originalPrompt }] },
  {
    role: "model",
    parts: [
      ...(thoughtSignature ? [{ thoughtSignature }] : []),  // ← undefined 시 빈 배열
      { inlineData: { mimeType: imgMime, data: imgData } },
    ],
  },
];
```

수정: multi-turn 제거, 단일 턴에 원본 이미지 + 텍스트 제거 지시만 전달.
