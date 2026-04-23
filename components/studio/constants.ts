// KV 전용 (Step 3에서만 사용)
export const KV_RATIOS = [
  { name: "메인 KV (가로)", ratio: "16:9" },
  { name: "메인 KV (세로)", ratio: "3:4" },
  { name: "메인 KV (정사각)", ratio: "1:1" },
] as const;

// 바리에이션 카탈로그 — KV 3종 제외
// 사이즈/비율은 27개 운영계획안(onboard) 실측 기준. 픽셀/mm는 주석으로 남김.
// `group`으로 묶인 항목들은 Step 4 UI에서 하나의 카드 + variant 칩으로 렌더링.
export const MASTER_CATALOG = [
  // === 현장 설치물 ===
  // 무대
  { name: "무대 배경", ratio: "5:3", category: "현장", group: "무대" },  // LED 메인 5000×3000
  { name: "무대 사이드 스크린", ratio: "9:16", category: "현장", group: "무대" },
  { name: "무대 스카시", ratio: "5:3", category: "현장", group: "무대" },  // 1500×900
  { name: "무대 큐브박스", ratio: "1:1", category: "현장", group: "무대" },  // 300×300
  // 백월·포토월
  { name: "포토월", ratio: "3:2", category: "현장", group: "백월·포토월" },  // 3000×2000
  { name: "포토월 (정방형)", ratio: "5:4", category: "현장", group: "백월·포토월" },  // 2500×2000
  { name: "리셉션 백월 배너", ratio: "3:4", category: "현장", group: "백월·포토월" },  // 1500×2000
  { name: "허니콤 백월", ratio: "3:1", category: "현장", group: "백월·포토월" },  // 6800×1900
  { name: "측면 대형 현수막", ratio: "5:3", category: "현장", group: "백월·포토월" },  // 4700×2500
  { name: "듀라테이블 가림막", ratio: "3:4", category: "현장", group: "백월·포토월" },  // 2260×3000
  // 현수막
  { name: "가로 현수막", ratio: "3:1", category: "현장", group: "현수막" },
  { name: "입구 현수막 (세로)", ratio: "1:3", category: "현장", group: "현수막" },
  { name: "대형 현수막", ratio: "5:1", category: "현장", group: "현수막" },
  { name: "드롭 현수막 (계단형)", ratio: "1:3", category: "현장", group: "현수막" },  // 2300×6300
  { name: "기업별 휘장 (족자형)", ratio: "1:3", category: "현장", group: "현수막" },  // 1000×2500
  { name: "윈드배너 (대형)", ratio: "1:3", category: "현장", group: "현수막" },  // 790×3670
  // X배너·에어
  { name: "입구 X배너", ratio: "1:3", category: "현장", group: "X배너·에어" },  // 600×1800
  { name: "행사 안내 X배너", ratio: "1:3", category: "현장", group: "X배너·에어" },  // 600×1800
  { name: "에어간판", ratio: "1:4", category: "현장", group: "X배너·에어" },
  // POP·보드
  { name: "단상 POP", ratio: "3:1", category: "현장", group: "POP·보드" },  // 600×200
  { name: "포디움 배너 (가로)", ratio: "5:3", category: "현장", group: "POP·보드" },  // 650×250
  { name: "포디움 로고 패널", ratio: "4:3", category: "현장", group: "POP·보드" },
  { name: "시상보드", ratio: "3:2", category: "현장", group: "POP·보드" },  // 800×500
  { name: "리셉션 하단 보드", ratio: "5:3", category: "현장", group: "POP·보드" },  // 1500×790
  { name: "안내 POP (A4)", ratio: "1:1.414", category: "현장", group: "POP·보드" },
  { name: "안내 POP (A5)", ratio: "1:1.414", category: "현장", group: "POP·보드" },
  { name: "핸드피켓 / 촬영용 POP", ratio: "1:1.414", category: "현장", group: "POP·보드" },
  // 사이니지
  { name: "공간 안내판", ratio: "16:9", category: "현장", group: "사이니지" },  // 800×450
  { name: "안내 사이니지 (가로)", ratio: "16:9", category: "현장", group: "사이니지" },
  { name: "안내 사이니지 (세로)", ratio: "9:16", category: "현장", group: "사이니지" },
  { name: "층별 안내 사인", ratio: "3:4", category: "현장", group: "사이니지" },
  { name: "화살표 방향 안내", ratio: "2:1", category: "현장", group: "사이니지" },
  { name: "LED 전광판", ratio: "6:1", category: "현장", group: "사이니지" },
  { name: "바닥 사인", ratio: "1:1", category: "현장", group: "사이니지" },
  // 부스·아크릴
  { name: "부스 디자인 (기업)", ratio: "3:5", category: "현장", group: "부스·아크릴" },  // 1000×1800
  { name: "아크릴픽 / 아크릴 POP", ratio: "1:3", category: "현장", group: "부스·아크릴" },  // 50×400
  { name: "마이크택", ratio: "5:3", category: "현장", group: "부스·아크릴" },  // 123×51

  // === 인쇄물 ===
  // 책자·리플릿
  { name: "프로그램 북 표지", ratio: "1:1.414", category: "인쇄", group: "책자·리플릿" },
  { name: "자료집 표지", ratio: "1:1.414", category: "인쇄", group: "책자·리플릿" },
  { name: "리플릿 표지", ratio: "3:4", category: "인쇄", group: "책자·리플릿" },
  { name: "브로셔 (A4 2단 접지)", ratio: "1.414:1", category: "인쇄", group: "책자·리플릿" },
  // 명찰·명패
  { name: "참가자 명찰 (카드형)", ratio: "4:5", category: "인쇄", group: "명찰·명패" },  // 95×122
  { name: "명찰 (가로)", ratio: "5:3", category: "인쇄", group: "명찰·명패" },
  { name: "명찰 (세로)", ratio: "3:5", category: "인쇄", group: "명찰·명패" },
  { name: "좌석 명패", ratio: "5:3", category: "인쇄", group: "명찰·명패" },  // 200×125
  { name: "심사위원 명패", ratio: "5:4", category: "인쇄", group: "명찰·명패" },  // 200×155
  // 카드류
  { name: "초대장", ratio: "5:7", category: "인쇄", group: "카드류" },
  { name: "큐카드 (A5 가로)", ratio: "1.414:1", category: "인쇄", group: "카드류" },  // 210×148
  { name: "엽서", ratio: "3:2", category: "인쇄", group: "카드류" },
  { name: "테이블 텐트카드", ratio: "2:1", category: "인쇄", group: "카드류" },
  { name: "럭키드로우지", ratio: "1.414:1", category: "인쇄", group: "카드류" },  // 80×56
  { name: "스티커", ratio: "1:1", category: "인쇄", group: "카드류" },
  { name: "봉투", ratio: "16:9", category: "인쇄", group: "카드류" },
  // 포스터
  { name: "포스터 (A1)", ratio: "1:1.414", category: "인쇄", group: "포스터" },
  { name: "포스터 (A2)", ratio: "1:1.414", category: "인쇄", group: "포스터" },
  { name: "키비주얼 포스터", ratio: "2:3", category: "인쇄", group: "포스터" },
  // 수료증·상장
  { name: "수료증 / 인증서", ratio: "1.414:1", category: "인쇄", group: "수료증·상장" },
  { name: "상장", ratio: "1.414:1", category: "인쇄", group: "수료증·상장" },

  // === 디지털 제작물 ===
  // 운영 장표
  { name: "운영 장표 템플릿 (PPT)", ratio: "16:9", category: "디지털", group: "운영 장표" },  // 1920×1080
  { name: "빔스크린 운영 장표", ratio: "4:3", category: "디지털", group: "운영 장표" },  // 2540×1904
  // 이벤터스
  { name: "이벤터스 썸네일", ratio: "16:9", category: "디지털", group: "이벤터스" },  // 960×540
  { name: "이벤터스 상단 배너", ratio: "3:1", category: "디지털", group: "이벤터스" },  // 1920×400
  { name: "이벤터스 메인 배너", ratio: "21:9", category: "디지털", group: "이벤터스" },  // 1920×760
  // LED·DID
  { name: "호텔 DID", ratio: "9:16", category: "디지털", group: "LED·DID" },  // 1080×1920
  { name: "LED 정면 좌우 배너", ratio: "1:3", category: "디지털", group: "LED·DID" },  // 437×1280
  // SNS·소셜
  { name: "SNS 카드뉴스 (인스타)", ratio: "4:5", category: "디지털", group: "SNS·소셜" },
  { name: "인스타그램 피드", ratio: "1:1", category: "디지털", group: "SNS·소셜" },
  { name: "인스타그램 스토리", ratio: "9:16", category: "디지털", group: "SNS·소셜" },
  { name: "인스타그램 릴스 커버", ratio: "9:16", category: "디지털", group: "SNS·소셜" },
  { name: "페이스북 이벤트 커버", ratio: "16:9", category: "디지털", group: "SNS·소셜" },
  { name: "트위터/X 헤더", ratio: "3:1", category: "디지털", group: "SNS·소셜" },
  { name: "유튜브 썸네일", ratio: "16:9", category: "디지털", group: "SNS·소셜" },
  { name: "카카오톡 공유 이미지", ratio: "1.91:1", category: "디지털", group: "SNS·소셜" },
  { name: "링크드인 배너", ratio: "4:1", category: "디지털", group: "SNS·소셜" },
  // 웹·이메일
  { name: "EDM 초청장", ratio: "1:1", category: "디지털", group: "웹·이메일" },  // 1080×1080
  { name: "블로그 대표 이미지", ratio: "16:9", category: "디지털", group: "웹·이메일" },
  { name: "이메일 헤더", ratio: "2:1", category: "디지털", group: "웹·이메일" },
  { name: "이메일 풋터 배너", ratio: "3:1", category: "디지털", group: "웹·이메일" },
  { name: "웹사이트 히어로 배너", ratio: "21:9", category: "디지털", group: "웹·이메일" },
  { name: "웹사이트 OG 이미지", ratio: "1.91:1", category: "디지털", group: "웹·이메일" },
  { name: "팝업 배너", ratio: "1:1.2", category: "디지털", group: "웹·이메일" },
  { name: "Zoom 가상 배경", ratio: "16:9", category: "디지털", group: "웹·이메일" },
  { name: "Teams 가상 배경", ratio: "16:9", category: "디지털", group: "웹·이메일" },
  { name: "웨비나 타이틀 슬라이드", ratio: "16:9", category: "디지털", group: "웹·이메일" },

  // === 굿즈 ===
  // 가방·의류
  { name: "에코백 디자인", ratio: "1:1", category: "굿즈", group: "가방·의류" },
  { name: "레디백 디자인", ratio: "1:1", category: "굿즈", group: "가방·의류" },
  { name: "볼캡 자수 / 패치", ratio: "1:1", category: "굿즈", group: "가방·의류" },
  { name: "티셔츠 전면 프린트", ratio: "1:1", category: "굿즈", group: "가방·의류" },
  // 드링크웨어
  { name: "텀블러 랩", ratio: "3:1", category: "굿즈", group: "드링크웨어" },
  { name: "머그컵 디자인", ratio: "2:1", category: "굿즈", group: "드링크웨어" },
  // 기타 굿즈
  { name: "노트 표지", ratio: "3:4", category: "굿즈", group: "기타 굿즈" },
  { name: "USB/카드 디자인", ratio: "1.6:1", category: "굿즈", group: "기타 굿즈" },
  { name: "기프트 박스 라벨", ratio: "2:1", category: "굿즈", group: "기타 굿즈" },
] as const;

export const CATEGORIES = ["전체", "현장", "인쇄", "디지털", "굿즈"] as const;

export const STYLE_CATEGORIES = [
  "다크+네온", "화이트+미니멀", "우드+내추럴", "일러스트+플랫",
  "그라데이션+모던", "모노크롬", "레트로+빈티지", "럭셔리+골드",
  "테크+디지털", "캐주얼+팝",
] as const;

export const EVENT_TYPES = [
  "세미나", "컨퍼런스", "시상식", "전시", "네트워킹", "교육", "축제",
] as const;

export const SERVICE_TIERS = [
  {
    id: "self" as const,
    name: "셀프",
    desc: "파일만 받아서 직접 처리",
    price: "30~50만원",
    features: ["AI 생성", "업스케일", "레퍼런스 검색", "PPT 생성", "ZIP 다운로드"],
  },
  {
    id: "basic" as const,
    name: "기본",
    desc: "인쇄해서 배달까지",
    price: "80~150만원",
    features: ["AI 생성", "업스케일", "레퍼런스 검색", "PPT 생성", "ZIP 다운로드", "인쇄 제작", "행사장 배달"],
  },
  {
    id: "full" as const,
    name: "풀",
    desc: "리터치부터 설치까지 올인원",
    price: "200~500만원",
    features: ["AI 생성", "업스케일", "레퍼런스 검색", "PPT 생성", "ZIP 다운로드", "인쇄 제작", "행사장 배달", "디자이너 리터치", "현장 설치/철거"],
  },
] as const;
