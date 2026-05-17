import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpload } from "@/hooks/use-upload";
import { ApiError } from "@/lib/api";
import { useRecommendationStore } from "@/lib/store/recommendation";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requestPresignedUrl: vi.fn(),
    uploadToS3: vi.fn(),
  };
});

const { requestPresignedUrl, uploadToS3 } = await import("@/lib/api");
const mockRequestPresignedUrl = vi.mocked(requestPresignedUrl);
const mockUploadToS3 = vi.mocked(uploadToS3);

const presignedResponse = {
  upload_url: "https://s3.example.com/up",
  s3_key: "uploads/abc-123",
  expires_in: 600,
};

function makeBlob() {
  return new Blob(["dummy"], { type: "audio/webm" });
}

describe("useUpload", () => {
  beforeEach(() => {
    useRecommendationStore.getState().reset();
    mockRequestPresignedUrl.mockReset();
    mockUploadToS3.mockReset();
  });

  it("starts in idle state with zero progress", () => {
    const { result } = renderHook(() => useUpload());

    expect(result.current.status).toBe("idle");
    expect(result.current.progress).toBe(0);
    expect(result.current.s3Key).toBeNull();
    expect(result.current.errorCode).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it("completes the full upload flow and syncs the store", async () => {
    mockRequestPresignedUrl.mockResolvedValue(presignedResponse);
    mockUploadToS3.mockImplementation(
      async (_url, _file, _ct, onProgress) => {
        onProgress?.(50);
        onProgress?.(100);
      },
    );

    const { result } = renderHook(() => useUpload());
    let returned: { s3Key: string } | null = null;

    await act(async () => {
      returned = await result.current.upload(makeBlob(), "audio/webm");
    });

    expect(mockRequestPresignedUrl).toHaveBeenCalledWith(
      { content_type: "audio/webm" },
      { signal: undefined },
    );
    expect(mockUploadToS3).toHaveBeenCalledWith(
      presignedResponse.upload_url,
      expect.any(Blob),
      "audio/webm",
      expect.any(Function),
      undefined,
    );
    expect(result.current.status).toBe("done");
    expect(result.current.progress).toBe(100);
    expect(result.current.s3Key).toBe(presignedResponse.s3_key);
    expect(returned).toEqual({ s3Key: presignedResponse.s3_key });

    const store = useRecommendationStore.getState();
    expect(store.s3Key).toBe(presignedResponse.s3_key);
    expect(store.uploadProgress).toBe(100);
    expect(store.phase).toBe("uploading");
  });

  it("does not switch store.phase to 'uploading' until presign resolves", async () => {
    let resolvePresign!: (v: typeof presignedResponse) => void;
    mockRequestPresignedUrl.mockImplementation(
      () =>
        new Promise<typeof presignedResponse>((resolve) => {
          resolvePresign = resolve;
        }),
    );
    mockUploadToS3.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpload());

    let uploadPromise!: Promise<{ s3Key: string } | null>;
    act(() => {
      uploadPromise = result.current.upload(makeBlob(), "audio/webm");
    });

    expect(result.current.status).toBe("presigning");
    expect(useRecommendationStore.getState().phase).not.toBe("uploading");

    await act(async () => {
      resolvePresign(presignedResponse);
      await uploadPromise;
    });

    expect(useRecommendationStore.getState().phase).toBe("uploading");
  });

  it("propagates ApiError code/message when presign fails", async () => {
    mockRequestPresignedUrl.mockRejectedValue(
      new ApiError({
        status: 400,
        code: "INVALID_CONTENT_TYPE",
        message: "bad content type",
      }),
    );

    const { result } = renderHook(() => useUpload());
    let returned: { s3Key: string } | null = null;

    await act(async () => {
      returned = await result.current.upload(makeBlob(), "audio/webm");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorCode).toBe("INVALID_CONTENT_TYPE");
    expect(result.current.errorMessage).toBe("bad content type");
    expect(returned).toBeNull();
    expect(mockUploadToS3).not.toHaveBeenCalled();

    const store = useRecommendationStore.getState();
    expect(store.errorCode).toBe("INVALID_CONTENT_TYPE");
    expect(store.errorMessage).toBe("bad content type");
    expect(store.phase).toBe("error");
  });

  it("falls back to UPLOAD_FAILED code for non-ApiError throws", async () => {
    mockRequestPresignedUrl.mockResolvedValue(presignedResponse);
    mockUploadToS3.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useUpload());

    await act(async () => {
      await result.current.upload(makeBlob(), "audio/webm");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorCode).toBe("UPLOAD_FAILED");
    expect(result.current.errorMessage).toBe("network down");
  });

  it("uses a generic message when an unknown non-Error is thrown", async () => {
    mockRequestPresignedUrl.mockResolvedValue(presignedResponse);
    mockUploadToS3.mockRejectedValue("kaboom");

    const { result } = renderHook(() => useUpload());

    await act(async () => {
      await result.current.upload(makeBlob(), "audio/webm");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorMessage).toBe(
      "업로드 중 알 수 없는 오류가 발생했습니다.",
    );
  });

  it("clears store s3Key and uploadProgress when upload fails after a prior success", async () => {
    mockRequestPresignedUrl.mockResolvedValueOnce(presignedResponse);
    mockUploadToS3.mockImplementationOnce(async (_u, _f, _c, onProgress) => {
      onProgress?.(100);
    });

    const { result } = renderHook(() => useUpload());

    await act(async () => {
      await result.current.upload(makeBlob(), "audio/webm");
    });

    expect(useRecommendationStore.getState().s3Key).toBe(
      presignedResponse.s3_key,
    );
    expect(useRecommendationStore.getState().uploadProgress).toBe(100);

    mockRequestPresignedUrl.mockResolvedValueOnce(presignedResponse);
    mockUploadToS3.mockRejectedValueOnce(new Error("S3 down"));

    await act(async () => {
      await result.current.upload(makeBlob(), "audio/webm");
    });

    expect(result.current.status).toBe("error");
    expect(useRecommendationStore.getState().s3Key).toBeNull();
    expect(useRecommendationStore.getState().uploadProgress).toBe(0);
  });

  it("forwards AbortSignal to requestPresignedUrl and uploadToS3", async () => {
    mockRequestPresignedUrl.mockResolvedValue(presignedResponse);
    mockUploadToS3.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpload());
    const controller = new AbortController();

    await act(async () => {
      await result.current.upload(makeBlob(), "audio/webm", {
        signal: controller.signal,
      });
    });

    expect(mockRequestPresignedUrl).toHaveBeenCalledWith(
      { content_type: "audio/webm" },
      { signal: controller.signal },
    );
    expect(mockUploadToS3).toHaveBeenCalledWith(
      presignedResponse.upload_url,
      expect.any(Blob),
      "audio/webm",
      expect.any(Function),
      controller.signal,
    );
  });

  it("reset clears state and the synced store progress", async () => {
    mockRequestPresignedUrl.mockResolvedValue(presignedResponse);
    mockUploadToS3.mockImplementation(async (_u, _f, _c, onProgress) => {
      onProgress?.(100);
    });

    const { result } = renderHook(() => useUpload());

    await act(async () => {
      await result.current.upload(makeBlob(), "audio/webm");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.progress).toBe(0);
    expect(result.current.s3Key).toBeNull();
    expect(result.current.errorCode).toBeNull();
    expect(result.current.errorMessage).toBeNull();

    const store = useRecommendationStore.getState();
    expect(store.s3Key).toBeNull();
    expect(store.uploadProgress).toBe(0);
  });
});
