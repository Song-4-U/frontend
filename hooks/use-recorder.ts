"use client";

/**
 * MediaRecorder API 래퍼 훅.
 *
 * 책임:
 * - 마이크 권한 요청 및 MediaStream 생명주기 관리
 * - 브라우저가 지원하는 audio MIME 타입 자동 선택 (audio/webm 우선)
 * - 녹음 상태 머신 (idle → requesting → recording → recorded | error)
 * - 결과 Blob/Object URL/duration 노출
 * - zustand store(`useRecommendationStore`)와 동기화 (audioBlob, phase)
 *
 * 사용 예:
 *   const { status, start, stop, reset, audioBlob, audioUrl } = useRecorder();
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { useRecommendationStore } from "@/lib/store/recommendation";

export type RecorderStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "recorded"
  | "error";

/**
 * 백엔드(`docs/API_CONTRACTS.md`)는 `audio/webm` 을 권장하지만,
 * 브라우저별 호환성을 위해 우선순위 목록을 두고 isTypeSupported 로 선택합니다.
 * Safari 는 webm 을 지원하지 않으므로 mp4 폴백을 둡니다.
 */
const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
] as const;

function pickSupportedMimeType(): string | null {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return null;
  }
  for (const mime of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}

/**
 * 활성 recorder의 이벤트 핸들러를 분리하고 stop 시도합니다.
 * reset/언마운트 시 비동기로 fire될 `onstop`이 stale state를 덮어쓰는 것을 막기 위함.
 */
function detachAndStop(recorder: MediaRecorder | null): void {
  if (!recorder) return;
  recorder.ondataavailable = null;
  recorder.onstop = null;
  recorder.onerror = null;
  if (recorder.state !== "inactive") {
    try {
      recorder.stop();
    } catch {
      // 이미 stop된 상태일 수 있음
    }
  }
}

export interface UseRecorderResult {
  status: RecorderStatus;
  error: string | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  /** presigned URL 발급 시 그대로 사용해야 하는 실제 content-type */
  contentType: string | null;
  durationMs: number;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useRecorder(): UseRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  /**
   * start/reset/unmount 시 증가합니다. 비동기 작업(getUserMedia, onstop 등)이
   * resolve 됐을 때 자신의 토큰이 여전히 유효한지 확인해 stale update를 방지합니다.
   */
  const sessionTokenRef = useRef(0);
  const isMountedRef = useRef(true);

  const setPhase = useRecommendationStore((s) => s.setPhase);
  const setStoreAudioBlob = useRecommendationStore((s) => s.setAudioBlob);

  const stopTicker = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const revokeUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // cleanup 시점에 의도적으로 ref 의 최신 값을 사용해 활성 recorder/stream 을 정리합니다.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      sessionTokenRef.current++;
      stopTicker();
      detachAndStop(mediaRecorderRef.current);
      mediaRecorderRef.current = null;
      cleanupStream();
      revokeUrl();
    };
  }, [stopTicker, cleanupStream, revokeUrl]);

  const reset = useCallback(() => {
    sessionTokenRef.current++;
    stopTicker();
    detachAndStop(mediaRecorderRef.current);
    mediaRecorderRef.current = null;
    cleanupStream();
    chunksRef.current = [];
    revokeUrl();
    setAudioUrl(null);
    setAudioBlob(null);
    setContentType(null);
    setDurationMs(0);
    setError(null);
    setStatus("idle");
    setStoreAudioBlob(null);
    setPhase("idle");
  }, [
    cleanupStream,
    revokeUrl,
    setPhase,
    setStoreAudioBlob,
    stopTicker,
  ]);

  const start = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (status === "requesting" || status === "recording") {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setError("이 브라우저에서는 마이크 입력을 지원하지 않습니다.");
      return;
    }

    const mime = pickSupportedMimeType();
    if (!mime) {
      setStatus("error");
      setError("지원되는 오디오 포맷이 없습니다. (webm/ogg/mp4)");
      return;
    }

    const myToken = ++sessionTokenRef.current;

    revokeUrl();
    setAudioUrl(null);
    setAudioBlob(null);
    setStoreAudioBlob(null);
    setError(null);
    setDurationMs(0);
    setStatus("requesting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      if (myToken !== sessionTokenRef.current || !isMountedRef.current) {
        return;
      }
      setStatus("error");
      const name = err instanceof Error ? err.name : "Error";
      setError(`마이크 권한을 허용해주세요. (${name})`);
      return;
    }

    if (myToken !== sessionTokenRef.current || !isMountedRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    mediaStreamRef.current = stream;

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime });
    } catch (err) {
      cleanupStream();
      setStatus("error");
      setError(
        err instanceof Error
          ? `녹음을 시작할 수 없습니다: ${err.message}`
          : "녹음을 시작할 수 없습니다.",
      );
      return;
    }

    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    const effectiveMime = recorder.mimeType || mime;
    setContentType(effectiveMime);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      if (myToken !== sessionTokenRef.current || !isMountedRef.current) {
        return;
      }
      stopTicker();
      const blob = new Blob(chunksRef.current, { type: effectiveMime });
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      setAudioBlob(blob);
      setAudioUrl(url);
      setDurationMs(Date.now() - startTimeRef.current);
      setStoreAudioBlob(blob);
      setStatus("recorded");
      setPhase("recorded");
      cleanupStream();
    };

    recorder.onerror = (ev: Event) => {
      if (myToken !== sessionTokenRef.current || !isMountedRef.current) {
        return;
      }
      stopTicker();
      cleanupStream();
      setStatus("error");
      const inner = (ev as { error?: { name?: string; message?: string } })
        .error;
      const detail = inner?.name
        ? ` (${inner.name}${inner.message ? `: ${inner.message}` : ""})`
        : "";
      setError(`녹음 중 오류가 발생했습니다.${detail}`);
    };

    startTimeRef.current = Date.now();
    recorder.start();
    setStatus("recording");
    setPhase("recording");

    tickIntervalRef.current = setInterval(() => {
      if (myToken !== sessionTokenRef.current || !isMountedRef.current) return;
      setDurationMs(Date.now() - startTimeRef.current);
    }, 100);
  }, [
    cleanupStream,
    revokeUrl,
    setPhase,
    setStoreAudioBlob,
    status,
    stopTicker,
  ]);

  const stop = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
  }, []);

  return {
    status,
    error,
    audioBlob,
    audioUrl,
    contentType,
    durationMs,
    start,
    stop,
    reset,
  };
}
