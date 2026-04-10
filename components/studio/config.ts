export const API_BASE = "https://epic-studio-api.pd-302.workers.dev";

export const isLocal = () =>
  typeof window !== "undefined" && window.location.hostname === "localhost";

// CHAT_URL: 항상 Next.js 프록시 라우트 사용
// - 이유: prod에서 Worker /api/chat을 직접 호출하면 {system,messages,ciImages} 형식을 못 받아 400
// - Next.js /api/chat/ 라우트가 형식 변환 후 Worker /api/generate로 포워딩함
export const CHAT_URL = () => "/api/chat/";

// IMAGE_URL: prod에서 guideline-generator.ts가 Gemini 형식으로 직접 호출
// isLocal()에 따라 분기 유지
export const IMAGE_URL = () => isLocal() ? "/api/generate-image/" : `${API_BASE}/api/generate`;
export const ANALYZE_REFS_URL = () => isLocal() ? "/api/analyze-refs/" : `${API_BASE}/api/generate`;
export const SEARCH_URL = () => isLocal() ? "/api/search/" : `${API_BASE}/api/search/smart-references`;
