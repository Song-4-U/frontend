import { act, renderHook, waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";

import { useRecorder } from "@/hooks/use-recorder";
import { useRecommendationStore } from "@/lib/store/recommendation";

/**
 * jsdom 에는 MediaRecorder 와 mediaDevices 가 없으므로
 * 테스트에서 수동으로 이벤트를 트리거할 수 있는 더미 구현을 주입합니다.
 */

interface FakeRecorder {
  state: "inactive" | "recording" | "paused";
  mimeType: string;
  ondataavailable: ((e: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  start: () => void;
  stop: () => void;
}

const fakeRecorders: FakeRecorder[] = [];

class FakeMediaRecorder {
  state: FakeRecorder["state"] = "inactive";
  mimeType: string;
  ondataavailable: FakeRecorder["ondataavailable"] = null;
  onstop: FakeRecorder["onstop"] = null;
  onerror: FakeRecorder["onerror"] = null;

  constructor(_stream: MediaStream, options?: { mimeType?: string }) {
    this.mimeType = options?.mimeType ?? "audio/webm";
    fakeRecorders.push(this);
  }

  static isTypeSupported() {
    return true;
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    // 실제 MediaRecorder는 stop 시 dataavailable → onstop 순으로 호출
    this.ondataavailable?.({ data: new Blob(["chunk"], { type: this.mimeType }) });
    this.onstop?.();
  }
}

function makeFakeStream(): MediaStream {
  const track = { stop: vi.fn() };
  return {
    getTracks: () => [track],
  } as unknown as MediaStream;
}

const originalMediaRecorder = (globalThis as { MediaRecorder?: unknown })
  .MediaRecorder;
let getUserMediaSpy: MockInstance | null = null;
let createObjectURLSpy: MockInstance;
let revokeObjectURLSpy: MockInstance;

beforeEach(() => {
  fakeRecorders.length = 0;
  useRecommendationStore.getState().reset();

  (globalThis as { MediaRecorder: unknown }).MediaRecorder = FakeMediaRecorder;

  if (!("mediaDevices" in navigator)) {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      writable: true,
      value: { getUserMedia: vi.fn() },
    });
  }

  getUserMediaSpy = vi
    .spyOn(navigator.mediaDevices, "getUserMedia")
    .mockResolvedValue(makeFakeStream());

  createObjectURLSpy = vi
    .spyOn(URL, "createObjectURL")
    .mockReturnValue("blob:fake-url");
  revokeObjectURLSpy = vi
    .spyOn(URL, "revokeObjectURL")
    .mockImplementation(() => undefined);
});

afterEach(() => {
  getUserMediaSpy?.mockRestore();
  createObjectURLSpy.mockRestore();
  revokeObjectURLSpy.mockRestore();
  if (originalMediaRecorder === undefined) {
    delete (globalThis as { MediaRecorder?: unknown }).MediaRecorder;
  } else {
    (globalThis as { MediaRecorder: unknown }).MediaRecorder =
      originalMediaRecorder;
  }
});

describe("useRecorder", () => {
  it("starts in idle state with empty fields", () => {
    const { result } = renderHook(() => useRecorder());

    expect(result.current.status).toBe("idle");
    expect(result.current.audioBlob).toBeNull();
    expect(result.current.audioUrl).toBeNull();
    expect(result.current.contentType).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.durationMs).toBe(0);
  });

  it("transitions idle → recording → recorded on a full cycle", async () => {
    const { result } = renderHook(() => useRecorder());

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe("recording"));
    expect(result.current.contentType).toBe("audio/webm;codecs=opus");
    expect(useRecommendationStore.getState().phase).toBe("recording");

    act(() => {
      result.current.stop();
    });

    await waitFor(() => expect(result.current.status).toBe("recorded"));
    expect(result.current.audioBlob).toBeInstanceOf(Blob);
    expect(result.current.audioUrl).toBe("blob:fake-url");
    expect(useRecommendationStore.getState().phase).toBe("recorded");
    expect(useRecommendationStore.getState().audioBlob).toBeInstanceOf(Blob);
  });

  it("enters error state when getUserMedia is rejected", async () => {
    getUserMediaSpy?.mockRejectedValueOnce(
      Object.assign(new Error("denied"), { name: "NotAllowedError" }),
    );

    const { result } = renderHook(() => useRecorder());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toContain("NotAllowedError");
  });

  it("errors when MediaRecorder API is unavailable", async () => {
    delete (globalThis as { MediaRecorder?: unknown }).MediaRecorder;

    const { result } = renderHook(() => useRecorder());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toMatch(/지원되는 오디오 포맷/);
  });

  it("errors when no MIME type is supported", async () => {
    class FakeNoSupport extends FakeMediaRecorder {
      static isTypeSupported() {
        return false;
      }
    }
    (globalThis as { MediaRecorder: unknown }).MediaRecorder = FakeNoSupport;

    const { result } = renderHook(() => useRecorder());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toMatch(/지원되는 오디오 포맷/);
  });

  it("reset returns to idle and clears the store", async () => {
    const { result } = renderHook(() => useRecorder());

    await act(async () => {
      await result.current.start();
    });
    act(() => {
      result.current.stop();
    });
    await waitFor(() => expect(result.current.status).toBe("recorded"));

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.audioBlob).toBeNull();
    expect(result.current.audioUrl).toBeNull();
    expect(result.current.durationMs).toBe(0);
    expect(useRecommendationStore.getState().phase).toBe("idle");
    expect(useRecommendationStore.getState().audioBlob).toBeNull();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:fake-url");
  });

  it("stop is a no-op when not currently recording", () => {
    const { result } = renderHook(() => useRecorder());

    expect(() => {
      act(() => result.current.stop());
    }).not.toThrow();
    expect(result.current.status).toBe("idle");
  });

  it("reset during recording does not leak state back to 'recorded'", async () => {
    const { result } = renderHook(() => useRecorder());

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe("recording"));

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.audioBlob).toBeNull();
    expect(useRecommendationStore.getState().phase).toBe("idle");
  });

  it("stops a stale stream when reset() runs while permission is pending", async () => {
    let resolveFirst!: (s: MediaStream) => void;
    const firstStream = makeFakeStream();

    getUserMediaSpy
      ?.mockReset()
      .mockImplementationOnce(
        () =>
          new Promise<MediaStream>((resolve) => {
            resolveFirst = resolve;
          }),
      );

    const { result } = renderHook(() => useRecorder());

    let firstStart!: Promise<void>;
    act(() => {
      firstStart = result.current.start();
    });
    expect(result.current.status).toBe("requesting");

    act(() => {
      result.current.reset();
    });

    await act(async () => {
      resolveFirst(firstStream);
      await firstStart;
    });

    expect(result.current.status).toBe("idle");
    expect(firstStream.getTracks()[0].stop).toHaveBeenCalled();
    // recorder가 생성되지 않아야 합니다 (스테일 흐름에서는 MediaRecorder 미할당).
    expect(fakeRecorders).toHaveLength(0);
  });

  it("early-returns when start() is called while already recording", async () => {
    const { result } = renderHook(() => useRecorder());

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe("recording"));

    expect(fakeRecorders).toHaveLength(1);
    const callsBefore = getUserMediaSpy?.mock.calls.length ?? 0;

    await act(async () => {
      await result.current.start();
    });

    expect(getUserMediaSpy?.mock.calls.length ?? 0).toBe(callsBefore);
    expect(fakeRecorders).toHaveLength(1);
    expect(result.current.status).toBe("recording");
  });

  it("surfaces MediaRecorderErrorEvent detail in the error message", async () => {
    const { result } = renderHook(() => useRecorder());

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe("recording"));

    const recorder = fakeRecorders[0];
    act(() => {
      recorder.onerror?.(
        // 실제 MediaRecorderErrorEvent 는 `error: DOMException` 을 들고 옵니다.
        { error: { name: "InvalidStateError", message: "boom" } } as unknown as Event,
      );
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toContain("InvalidStateError");
    expect(result.current.error).toContain("boom");
  });

  it("stops an active recorder when the hook unmounts", async () => {
    const { result, unmount } = renderHook(() => useRecorder());

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe("recording"));

    const recorder = fakeRecorders[0];
    expect(recorder.state).toBe("recording");
    const stopSpy = vi.spyOn(recorder, "stop");

    unmount();

    expect(stopSpy).toHaveBeenCalled();
  });
});
