// ============================================================
//  ⭐ 여기만 고치면 사이트 전체가 바뀝니다 (초보용 중앙 설정 파일)
//  크루명·슬로건·일정·링크 등 실제 정보로 교체하세요.
//  ⚠️ 아래 값은 전부 "예시(placeholder)"입니다.
// ============================================================

export const site = {
  // ── 기본 정체성 ──────────────────────────────
  crewName: "○○ 러닝크루",           // ← 실제 크루명으로 교체
  crewNameEn: "OUR RUNNING CREW",     // ← 영문 표기 (로고/헤더용)
  tagline: "느려도 괜찮아, 같이 완주",   // ← 슬로건 (목적 한 문장)
  heroWord: "함께",                    // 히어로에서 강조될 한 단어
  founded: "2026",                    // 창립연도
  region: "서울 ○○ 일대",             // 활동 지역

  // ── 정기런 (홈 상단 고정 블록에 노출) ──────────
  regularRun: {
    day: "매주 수요일",                // 고정 요일
    time: "저녁 7:30",                 // 고정 시간
    place: "○○역 2번 출구 앞",         // 집합 장소
    distance: "5km",                   // 거리
    pace: "7:00~8:00/km · 초보 환영",   // 페이스
    note: "No Drop — 아무도 뒤에 혼자 두지 않아요",
  },

  // ── 페이스 그룹 (About 페이지) ────────────────
  paceGroups: [
    { name: "A그룹", pace: "~5:30/km", who: "기록 향상" },
    { name: "B그룹", pace: "5:30~6:30/km", who: "꾸준한 운동" },
    { name: "C그룹", pace: "6:30/km~", who: "입문·초보" },
  ],

  // ── 운영진 (About 페이지) ─────────────────────
  crew: [
    { name: "○○○", role: "크루장 · 코스", emoji: "🏃" },
    { name: "○○○", role: "사진 · 기록", emoji: "📸" },
    { name: "○○○", role: "SNS · 홍보", emoji: "📱" },
    { name: "○○○", role: "총무 · 살림", emoji: "💰" },
  ],

  // ── 링크 (실시간 소통은 여기로 유도) ────────────
  links: {
    instagram: "https://instagram.com/",   // ← 인스타 핸들
    openchat: "https://open.kakao.com/",    // ← 카카오 오픈채팅
    strava: "",                             // ← 스트라바 클럽(정착기부터)
    email: "hello@yourcrew.com",
  },

  // ── 임베드 (구글 무료 도구) ────────────────────
  // 사용법: 구글 폼/캘린더 만들고 "퍼가기(embed)" HTML의 src 주소를 붙여넣으세요.
  embeds: {
    joinFormSrc: "",       // 가입/게스트런 신청 구글폼 embed src
    calendarSrc: "",       // 구글 캘린더 공개 embed src
  },

  // ── 굿즈/회비 안내 (텍스트) ────────────────────
  fee: "정기런 무료 · 굿즈/행사 시 실비",
};

// 상단 내비게이션 (사이트맵)
export const nav = [
  { label: "홈", href: "/" },
  { label: "크루 소개", href: "/about" },
  { label: "함께하기", href: "/join" },
  { label: "일정", href: "/schedule" },
  { label: "기록·갤러리", href: "/gallery" },
  { label: "커뮤니티", href: "/community" },
];
