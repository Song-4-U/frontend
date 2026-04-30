/**
 * core-api / inference-api 의 요청/응답 타입.
 *
 * 단일 진실의 원천:
 * - docs/API_CONTRACTS.md
 *
 * 작성 규칙:
 * - 백엔드 응답 필드명을 그대로 (snake_case) 유지합니다.
 * - 변환은 hook/UI 레이어에서 처리합니다.
 * - 런타임 코드는 작성하지 않습니다 (타입 only).
 */

// =====================================================
// core-api: POST /uploads/presigned-url
// =====================================================

export interface PresignedUrlRequest {
  content_type: string;
}

export interface PresignedUrlResponse {
  upload_url: string;
  s3_key: string;
  expires_in: number;
}

// =====================================================
// core-api: POST /recommendations/by-timbre
// =====================================================

export interface RecommendationsRequest {
  s3_key: string;
  timbre_label: string;
  top_k: number;
}

export interface RecommendationItem {
  id: string;
  title: string;
  artist: string;
  timbre_label: string;
  similarity: number;
}

export interface RecommendationsResponse {
  query: {
    timbre_label: string;
    top_k: number;
  };
  items: RecommendationItem[];
}

// =====================================================
// inference-api: POST /embed (참고용)
// =====================================================

export interface EmbedRequestByS3Key {
  bucket: string;
  key: string;
}

export interface EmbedRequestByPresignedUrl {
  presigned_get_url: string;
}

export type EmbedRequest = EmbedRequestByS3Key | EmbedRequestByPresignedUrl;

export interface EmbedResponse {
  /** 항상 길이 512인 float 배열 */
  embedding: number[];
}

// =====================================================
// 공통 에러 응답
// =====================================================

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    request_id?: string;
  };
}
