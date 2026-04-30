/**
 * Mock fixture 데이터.
 *
 * `NEXT_PUBLIC_USE_MOCK_API=true` 일 때 lib/api.ts 가 사용합니다.
 * 백엔드 미완성 단계에서 프론트엔드 흐름을 단독 검증하기 위한 용도입니다.
 */

import type {
  PresignedUrlResponse,
  RecommendationsResponse,
  RecommendationItem,
} from "@/types/api";

const NOW = () => new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

export function createMockPresignedUrlResponse(
  contentType: string,
): PresignedUrlResponse {
  const ext = contentType.includes("webm") ? "webm" : "bin";
  return {
    upload_url: `https://mock-bucket.s3.ap-northeast-2.amazonaws.com/uploads/mock-${NOW()}.${ext}?mock=1`,
    s3_key: `uploads/mock/${NOW()}.${ext}`,
    expires_in: 900,
  };
}

const MOCK_TRACKS: Omit<RecommendationItem, "similarity">[] = [
  { id: "11111111-1111-4111-8111-111111111111", title: "Velvet Sky", artist: "Aria Moon", timbre_label: "warm" },
  { id: "22222222-2222-4222-8222-222222222222", title: "Ocean Drift", artist: "Lull", timbre_label: "warm" },
  { id: "33333333-3333-4333-8333-333333333333", title: "Soft Light", artist: "Coda Park", timbre_label: "airy" },
  { id: "44444444-4444-4444-8444-444444444444", title: "Crystal Tide", artist: "Nova", timbre_label: "bright" },
  { id: "55555555-5555-4555-8555-555555555555", title: "Amber Smoke", artist: "Lowfield", timbre_label: "warm" },
  { id: "66666666-6666-4666-8666-666666666666", title: "Paper Plane", artist: "Yujin", timbre_label: "airy" },
  { id: "77777777-7777-4777-8777-777777777777", title: "Neon Bloom", artist: "Daze", timbre_label: "bright" },
  { id: "88888888-8888-4888-8888-888888888888", title: "Quiet Shore", artist: "Ren", timbre_label: "warm" },
  { id: "99999999-9999-4999-8999-999999999999", title: "Glass Window", artist: "Mirae", timbre_label: "airy" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", title: "Fade In", artist: "Sora", timbre_label: "warm" },
];

export function createMockRecommendationsResponse(
  timbreLabel: string,
  topK: number,
): RecommendationsResponse {
  const filtered = MOCK_TRACKS.filter((t) => t.timbre_label === timbreLabel);
  const pool = filtered.length > 0 ? filtered : MOCK_TRACKS;

  const items: RecommendationItem[] = pool
    .slice(0, topK)
    .map((track, idx) => ({
      ...track,
      similarity: Number((0.97 - idx * 0.03 - Math.random() * 0.02).toFixed(4)),
    }));

  return {
    query: { timbre_label: timbreLabel, top_k: topK },
    items,
  };
}
