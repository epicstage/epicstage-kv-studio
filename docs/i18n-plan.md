# i18n 구현 계획 — next-intl 도입

> **상태**: 계획 수립 완료, 실행 대기.
> **마지막 업데이트**: 2026-04-17
> **추정 기간**: 1~1.5 작업일 (단독 PR 권장)

---

## 1. 왜 지금 당장 구현하지 않나

### 현재 상태
- 서비스 사용자: 단일 언어(한국어) 사용자 1명
- 영어 사용자 수요: **현재 없음**
- 브랜드/마케팅 방향: 한국 행사 시장 포커스

### 기회비용
- 이 작업 1~1.5일 ≒ UX 개선(토스트, 진행률, 취소, Web Worker, 테스트) 전체 + 디자인 토큰 작업 병행
- i18n은 **실제 영어 UI가 필요한 순간까지 체감 가치 0**
- UX 개선은 머지 즉시 매 세션 체감

### 리스크
- JSX에 하드코딩된 수십 개 문자열을 뽑아내는 기계적 작업이지만, 중간 깨짐 여지가 큼
- 테스트 커버리지가 UI 컴포넌트에 없어 회귀가 조용히 묻힐 수 있음
- `app/[locale]/...` 라우트 재구성이 `project-menu`, `studio-app`의 레이아웃 경로 가정을 건드림

### 결론
이 계획을 **미리 상세히 써두고**, 영어 UI 수요가 나타나거나 UX/품질 부채를 다 갚은 다음 세션에서 단독 PR로 실행한다.

---

## 2. 선택된 스택: next-intl

### 왜 next-intl인가
| 선택지 | 장점 | 단점 |
|---|---|---|
| **next-intl** (선택) | App Router 1급 지원, 서버 컴포넌트 친화적, `[locale]` 세그먼트 표준 | 의존성 1개 추가 |
| react-i18next | 가장 성숙 | App Router 서버 컴포넌트 통합이 어색 |
| Lingui | i18n 매크로 DX 좋음 | 빌드 설정 복잡, SWC 플러그인 튜닝 필요 |
| 자체 Context | 제로 의존성 | 포맷팅·날짜·pluralization 전부 수동 |

next-intl의 locale routing, `useTranslations()`, `getTranslations()` 조합이 우리 스택(Next.js 15 App Router + static export)에 가장 부드럽게 들어맞는다.

### 의존성
```bash
pnpm add next-intl
```
(추가: `next-intl`. 제거: 없음.)

---

## 3. 구현 전략

### 3.1 라우트 구조
**현재**
```
app/
  layout.tsx
  (default)/page.tsx         # 랜딩
  (auth)/{signin,signup,reset-password}/page.tsx
  studio/page.tsx
  api/**/route.ts
```

**after**
```
app/
  layout.tsx                 # 최상위 레이아웃 (HTML, fonts)
  [locale]/
    layout.tsx               # NextIntlClientProvider, setRequestLocale
    (default)/page.tsx
    (auth)/{signin,signup,reset-password}/page.tsx
    studio/page.tsx
  api/**/route.ts            # API는 로케일 밖 유지
i18n.ts                      # next-intl 설정 (지원 로케일, 기본 로케일)
middleware.ts                # locale 감지/리디렉션
messages/
  ko.json                    # 한국어 (기본)
  en.json                    # 영어 (초기엔 키만, 번역은 후속)
```

### 3.2 Locale 감지
- `middleware.ts`로 경로 기반 감지 + Accept-Language fallback
- 지원 로케일: `["ko", "en"]`
- 기본 로케일: `ko`
- `as-needed` 모드(한국어는 prefix 없음, 영어는 `/en/...`) — 기존 URL 깨뜨리지 않음

### 3.3 문자열 키 네이밍
섹션별 네임스페이스. 예:
```json
{
  "studio": {
    "steps": {
      "input": "입력 & 레퍼런스",
      "guideline": "가이드라인 확인",
      "masterKv": "마스터 KV",
      "variations": "바리에이션 생성"
    },
    "eventInput": {
      "placeholder": "행사 정보를 입력하세요",
      "ciUpload": "CI 이미지 업로드"
    },
    "kvGenerator": {
      "ratio": {
        "16:9": "16:9 가로형",
        "3:4": "3:4 세로형",
        "1:1": "1:1 정사각"
      }
    }
  },
  "common": {
    "generate": "생성",
    "regenerate": "재생성",
    "cancel": "취소",
    "restore": "복원",
    "discard": "폐기"
  }
}
```

### 3.4 사용 패턴
```tsx
// 클라이언트 컴포넌트
"use client";
import { useTranslations } from "next-intl";

export default function StudioApp() {
  const t = useTranslations("studio.steps");
  const labels = [t("input"), t("guideline"), t("masterKv"), t("variations")];
  // ...
}
```

```tsx
// 서버 컴포넌트
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("common");
  return { title: t("appName") };
}
```

### 3.5 로그/디버그 문자열은 번역 안 함
`addLog("Ver.${n} 가이드라인 생성 중...")` 같은 내부 로그는 번역 대상에서 제외. 개발자용이므로 한국어로 유지.

---

## 4. 파일별 추출 대상

| 파일 | 사용자 문자열 수(대략) | 네임스페이스 |
|---|---|---|
| `components/studio/studio-app.tsx` | ~10 (step labels, 에러 메시지, 버튼) | `studio.app`, `studio.steps`, `common` |
| `components/studio/event-input.tsx` | ~12 (placeholder, label, 버튼, 파일 안내) | `studio.eventInput` |
| `components/studio/kv-generator.tsx` | ~15 (ratio 라벨, 엔진 옵션, 내보내기 버튼, 상태 텍스트) | `studio.kvGenerator` |
| `components/studio/guideline-viewer.tsx` | ~10 (section 헤더, 예시 생성 버튼) | `studio.guideline` |
| `components/studio/reference-search.tsx` | ~8 (검색 라벨, 드롭존 안내) | `studio.reference` |
| `components/studio/production-grid.tsx` | ~10 (계획/생성 버튼, 배지, 토스트 제목) | `studio.production` |
| `components/studio/production-card.tsx` | ~8 (버튼, 상태 배지, 툴팁) | `studio.production` |
| `components/studio/chat-panel.tsx` | ~5 (placeholder, send 버튼) | `studio.chat` |
| `components/studio/plan-item-card.tsx` | ~4 (필드 라벨) | `studio.production` |
| `components/studio/project-menu.tsx` | ~10 (메뉴 항목, 대화상자) | `studio.project` |
| `components/studio/tier-selector.tsx` | ~6 (티어 라벨, 설명) | `studio.tier` |
| `components/studio/catalog-selector.tsx` | ~8 (카테고리, 커스텀 추가 UI) | `studio.catalog` |
| `components/studio/guide-image-card.tsx` | ~4 (생성/재생성 버튼) | `studio.guideline` |
| `components/studio/autosave-banner.tsx` | ~4 (라벨, 시간 표현) | `studio.autosave` |
| `components/studio/toast.tsx` | ~2 (닫기 aria-label) | `common` |
| `app/(auth)/signin/page.tsx` | ~6 | `auth.signin` |
| `app/(auth)/signup/page.tsx` | ~6 | `auth.signup` |
| `app/(auth)/reset-password/page.tsx` | ~4 | `auth.reset` |
| `components/hero-home.tsx` | ~4 | `landing.hero` |
| `components/features.tsx` | ~12 | `landing.features` |
| `components/testimonials.tsx` | ~6 | `landing.testimonials` |
| `components/workflows.tsx` | ~6 | `landing.workflows` |
| `components/cta.tsx` | ~3 | `landing.cta` |

**합계**: 약 **~160 사용자 문자열** 추출.

### 복잡 케이스
1. **`MASTER_CATALOG` (54 품목)** — 카탈로그 명 + 카테고리를 한/영 병행 저장.
   - 방법: `constants.ts`에 `name_ko` + `name_en` 또는 `MASTER_CATALOG_I18N: Record<Locale, CatalogItem[]>`.
2. **AI 프롬프트** — Gemini/Recraft 프롬프트는 **절대 번역하지 않음**. 모델이 기대하는 포맷 유지.
3. **에러 메시지** — API 에러는 `ApiError` 던져서 호출부에서 번역 키로 매핑.
4. **동적 포맷** — "`${count}종 생성 완료`" 같은 복수형은 next-intl의 ICU MessageFormat 사용:
   ```json
   { "production.completed": "{count, plural, =0 {완료된 항목 없음} other {#종 생성 완료}}" }
   ```

---

## 5. 실행 순서

1. **설정 레이어** (2~3시간)
   - `pnpm add next-intl`
   - `i18n.ts` + `middleware.ts` 작성
   - `app/layout.tsx` 분리 → `app/[locale]/layout.tsx`에 `NextIntlClientProvider` 래핑
   - 기존 `app/(default)`, `app/(auth)`, `app/studio` → `app/[locale]/` 아래로 이동
   - `messages/ko.json` 빈 껍데기 + `messages/en.json` 빈 껍데기

2. **문자열 추출** (4~6시간)
   - 섹션별(`studio/*`, `landing/*`, `auth/*`) 순차 진행
   - 각 파일마다: 문자열 → `t("key")`로 치환 + `messages/ko.json`에 추가
   - 커밋 단위는 파일 2~3개씩

3. **영어 번역** (후속 작업, 분리)
   - 번역 자체는 별도 세션(또는 번역 담당자)
   - `messages/en.json` 채워넣기; fallback은 ko

4. **검증** (1~2시간)
   - `/` + `/studio` + `/en/studio` 모두 렌더
   - Playwright smoke에 `/en/studio` 시나리오 추가
   - `<html lang="{locale}">` 동적 적용 확인

---

## 6. 리스크 & 완화

| 리스크 | 완화 |
|---|---|
| 라우트 이동으로 기존 URL 깨짐 | `as-needed` 모드 + ko prefix 없이 배포 → 기존 URL 그대로 유지 |
| 문자열 누락 | 각 컴포넌트 변경 후 `/studio` 수동 워크스루 |
| 정적 export 충돌 | `next-intl`은 `output: export`와 호환 (Next.js 15+) — 단 SSG 모드에서 `generateStaticParams` 로 각 로케일 빌드 필요 |
| 번역 품질 (en.json 부실) | 영문 번역을 후속 PR로 분리. fallback 전략(ko로 폴백)으로 부분 번역도 배포 가능 |
| MASTER_CATALOG 한/영 병행 | 54항목 × 2언어 = 108문자열. 처음엔 en = ko와 동일하게 두고 수동 번역 |

---

## 7. 빠른 롤백

문제 생기면 단일 커밋 revert로 원상복구:
- next-intl 제거
- `app/[locale]/` → `app/`로 다시 이동
- `messages/` 삭제
- `middleware.ts` 삭제

라우트 이동 커밋과 문자열 추출 커밋을 분리해두면 부분 롤백도 가능.

---

## 8. 참고 링크

- next-intl App Router 가이드: https://next-intl-docs.vercel.app/docs/getting-started/app-router
- Static export 호환성: https://next-intl-docs.vercel.app/docs/getting-started/app-router/with-i18n-routing#static-rendering
- ICU MessageFormat: https://formatjs.io/docs/core-concepts/icu-syntax/

---

## 9. 지금 할 수 있는 준비 작업 (Optional)

선택 사항으로, 이 i18n PR을 열기 전에 해둘 수 있는 사전 작업:

- [ ] `components/studio/constants.ts`의 `MASTER_CATALOG` 항목명에 `name_en` 필드 추가 (nullable)
- [ ] `addLog`에 넘기는 메시지를 "로그용(번역 X)"으로 명시적 주석 추가
- [ ] ESLint 규칙 `no-restricted-syntax`로 JSX 안에 한글 리터럴이 새로 들어오는 걸 경고 (PR에서 점진 적용)

하지만 이건 "있으면 좋음"이지 필수 아님. 실제 i18n PR 열 때 한 번에 묶어서 해도 충분.
