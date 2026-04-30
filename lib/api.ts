/**
 * core-api 클라이언트 레이어.
 *
 * 책임:
 * - base URL 주입 (`NEXT_PUBLIC_CORE_API_BASE_URL`)
 * - 표준 에러 shape (`{ error: { code, message, request_id } }`) 파싱 → ApiError throw
 * - 타임아웃/취소 (AbortController) 지원
 * - 타입 안전한 엔드포인트 함수 export
 *
 * 참고: docs/API_CONTRACTS.md
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_CORE_API_BASE_URL ?? "http://localhost:8080";

const DEFAULT_TIMEOUT_MS = 15_000;

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

/** Mock 모드에서 실제 네트워크 처럼 보이도록 약간의 지연을 줍니다. */
const MOCK_DELAY_MS = {
  presign: 200,
  upload: 1500,
  recommend: 1800,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// =====================================================
// Types
// =====================================================
// 단일 진실의 원천은 `@/types/api` 입니다.
// 호출부 편의를 위해 동일 타입을 여기서도 re-export 합니다.

import type {
  ApiErrorBody,
  PresignedUrlRequest,
  PresignedUrlResponse,
  RecommendationsRequest,
  RecommendationsResponse,
} from "@/types/api";

export type {
  ApiErrorBody,
  PresignedUrlRequest,
  PresignedUrlResponse,
  RecommendationItem,
  RecommendationsRequest,
  RecommendationsResponse,
} from "@/types/api";

// =====================================================
// Errors
// =====================================================

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;

  constructor(opts: {
    status: number;
    code: string;
    message: string;
    requestId?: string;
  }) {
    super(opts.message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.requestId = opts.requestId;
  }
}

export class TimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

// =====================================================
// Core fetcher
// =====================================================

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
}

async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...init } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorBody: Partial<ApiErrorBody> | null = null;
      try {
        errorBody = (await response.json()) as ApiErrorBody;
      } catch {
        // 응답이 JSON이 아닐 수 있음
      }

      throw new ApiError({
        status: response.status,
        code: errorBody?.error?.code ?? `HTTP_${response.status}`,
        message:
          errorBody?.error?.message ??
          response.statusText ??
          "Unknown error occurred",
        requestId: errorBody?.error?.request_id,
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new TimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// =====================================================
// Endpoints (core-api)
// =====================================================

/**
 * S3 업로드용 Presigned URL 발급.
 *
 * @see docs/API_CONTRACTS.md - POST /uploads/presigned-url
 */
export async function requestPresignedUrl(
  payload: PresignedUrlRequest,
  options?: { signal?: AbortSignal },
): Promise<PresignedUrlResponse> {
  if (USE_MOCK) {
    const { createMockPresignedUrlResponse } = await import("./mock-data");
    await sleep(MOCK_DELAY_MS.presign);
    return createMockPresignedUrlResponse(payload.content_type);
  }

  return apiFetch<PresignedUrlResponse>("/uploads/presigned-url", {
    method: "POST",
    body: payload,
    signal: options?.signal,
  });
}

/**
 * 음색 기반 추천 조회.
 *
 * @see docs/API_CONTRACTS.md - POST /recommendations/by-timbre
 */
export async function getRecommendationsByTimbre(
  payload: RecommendationsRequest,
  options?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<RecommendationsResponse> {
  if (USE_MOCK) {
    const { createMockRecommendationsResponse } = await import("./mock-data");
    await sleep(MOCK_DELAY_MS.recommend);
    return createMockRecommendationsResponse(payload.timbre_label, payload.top_k);
  }

  return apiFetch<RecommendationsResponse>("/recommendations/by-timbre", {
    method: "POST",
    body: payload,
    signal: options?.signal,
    // 추론 latency를 고려해 기본 timeout 보다 길게 (P99 기준 여유)
    timeoutMs: options?.timeoutMs ?? 30_000,
  });
}

// =====================================================
// S3 Direct Upload (core-api 외부 호출)
// =====================================================

/**
 * Presigned URL을 사용해 S3에 직접 PUT.
 *
 * @param uploadUrl 발급받은 presigned URL
 * @param file 업로드할 Blob/File
 * @param contentType presigned URL 발급 시 사용한 content_type 과 동일해야 함
 * @param onProgress 0~100 사이 진행률 콜백 (옵션)
 */
export function uploadToS3(
  uploadUrl: string,
  file: Blob,
  contentType: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  if (USE_MOCK) {
    return mockUploadToS3(file, onProgress);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new ApiError({
            status: xhr.status,
            code: "S3_UPLOAD_FAILED",
            message: `S3 upload failed with status ${xhr.status}`,
          }),
        );
      }
    };

    xhr.onerror = () =>
      reject(
        new ApiError({
          status: 0,
          code: "S3_UPLOAD_NETWORK_ERROR",
          message: "Network error while uploading to S3",
        }),
      );

    xhr.ontimeout = () => reject(new TimeoutError("S3 upload timed out"));

    xhr.send(file);
  });
}

/** Mock 모드 전용: progress 이벤트를 시뮬레이션하면서 업로드 성공을 반환합니다. */
async function mockUploadToS3(
  _file: Blob,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const steps = 10;
  const stepDelay = MOCK_DELAY_MS.upload / steps;
  for (let i = 1; i <= steps; i++) {
    await sleep(stepDelay);
    onProgress?.(Math.round((i / steps) * 100));
  }
}
