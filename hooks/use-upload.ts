"use client";

/**
 * Presigned URL 발급 + S3 직접 업로드 통합 훅.
 *
 * 흐름:
 *   idle
 *     → presigning  (POST /uploads/presigned-url)
 *     → uploading   (PUT to presigned URL, with progress)
 *     → done
 *     | error       (어느 단계든 실패 시)
 *
 * 책임:
 * - core-api 호출은 항상 `lib/api.ts` 경유 (직접 fetch 금지)
 * - zustand store(`useRecommendationStore`)와 동기화 (phase, s3Key, uploadProgress, error)
 * - presigned URL 발급 시 사용한 content-type 으로만 PUT (서명 일치)
 * - 외부에서 전달한 AbortSignal로 presign/PUT 모두 취소 가능
 *
 * 사용 예:
 *   const { upload, status, progress, s3Key } = useUpload();
 *   await upload(blob, "audio/webm;codecs=opus");
 */

import { useCallback, useState } from "react";

import { ApiError, requestPresignedUrl, uploadToS3 } from "@/lib/api";
import { useRecommendationStore } from "@/lib/store/recommendation";

export type UploadStatus =
  | "idle"
  | "presigning"
  | "uploading"
  | "done"
  | "error";

export interface UseUploadResult {
  status: UploadStatus;
  /** 0~100, S3 PUT 진행률 (presigning 단계에서는 0) */
  progress: number;
  s3Key: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  upload: (
    blob: Blob,
    contentType: string,
    options?: { signal?: AbortSignal },
  ) => Promise<{ s3Key: string } | null>;
  reset: () => void;
}

export function useUpload(): UseUploadResult {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [s3Key, setS3Key] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setPhase = useRecommendationStore((s) => s.setPhase);
  const setStoreS3Key = useRecommendationStore((s) => s.setS3Key);
  const setUploadProgress = useRecommendationStore((s) => s.setUploadProgress);
  const setStoreError = useRecommendationStore((s) => s.setError);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setS3Key(null);
    setErrorCode(null);
    setErrorMessage(null);
    setStoreS3Key(null);
    setUploadProgress(0);
  }, [setStoreS3Key, setUploadProgress]);

  const upload = useCallback(
    async (
      blob: Blob,
      contentType: string,
      options?: { signal?: AbortSignal },
    ) => {
      setErrorCode(null);
      setErrorMessage(null);
      setProgress(0);
      setUploadProgress(0);
      setS3Key(null);
      setStoreS3Key(null);
      setStatus("presigning");

      try {
        const presigned = await requestPresignedUrl(
          { content_type: contentType },
          { signal: options?.signal },
        );

        // 실제 S3 PUT이 시작되는 시점에 phase 를 'uploading'으로 전환합니다.
        // presigning 동안에는 phase가 'recorded'를 유지해 store와 status 의미가 어긋나지 않습니다.
        setStatus("uploading");
        setPhase("uploading");

        await uploadToS3(
          presigned.upload_url,
          blob,
          contentType,
          (p) => {
            setProgress(p);
            setUploadProgress(p);
          },
          options?.signal,
        );

        setS3Key(presigned.s3_key);
        setStoreS3Key(presigned.s3_key);
        setStatus("done");
        return { s3Key: presigned.s3_key };
      } catch (err) {
        const code = err instanceof ApiError ? err.code : "UPLOAD_FAILED";
        const message =
          err instanceof Error
            ? err.message
            : "업로드 중 알 수 없는 오류가 발생했습니다.";
        setStatus("error");
        setErrorCode(code);
        setErrorMessage(message);
        // 실패 시 store가 이전 성공 데이터를 들고 있지 않도록 함께 초기화합니다.
        setStoreS3Key(null);
        setUploadProgress(0);
        setStoreError(code, message);
        return null;
      }
    },
    [setPhase, setStoreError, setStoreS3Key, setUploadProgress],
  );

  return {
    status,
    progress,
    s3Key,
    errorCode,
    errorMessage,
    upload,
    reset,
  };
}
