"use client";

/**
 * 녹음/재녹음/업로드 흐름을 책임지는 도메인 컴포넌트.
 *
 * 상태는 `useRecorder`, `useUpload` 두 훅에서 관리하며,
 * 이 컴포넌트는 그 결과를 바탕으로 UI 만 그립니다.
 * 다음 단계(음색 선택 → 추천 요청)는 Phase 2 후속 섹션에서 연결합니다.
 */

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mic,
  RefreshCw,
  Square,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { UploadProgress } from "@/components/UploadProgress";
import { useRecorder } from "@/hooks/use-recorder";
import { useUpload } from "@/hooks/use-upload";

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RecorderPanel() {
  const recorder = useRecorder();
  const upload = useUpload();

  const isRequesting = recorder.status === "requesting";
  const isRecording = recorder.status === "recording";
  const isRecorded = recorder.status === "recorded";
  const isUploading =
    upload.status === "presigning" || upload.status === "uploading";
  const isUploadDone = upload.status === "done";
  const canUpload = Boolean(recorder.audioBlob && recorder.contentType);

  const handleStart = () => {
    upload.reset();
    void recorder.start();
  };

  const handleStop = () => {
    recorder.stop();
  };

  const handleReRecord = () => {
    upload.reset();
    recorder.reset();
    void recorder.start();
  };

  const handleUpload = async () => {
    if (!recorder.audioBlob || !recorder.contentType) return;
    await upload.upload(recorder.audioBlob, recorder.contentType);
  };

  return (
    <section
      aria-label="음성 녹음 패널"
      className="w-full max-w-xl rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur md:p-8"
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <StatusLine
          isRequesting={isRequesting}
          isRecording={isRecording}
          isRecorded={isRecorded}
          durationMs={recorder.durationMs}
        />

        {!isRecorded ? (
          <RecordButton
            isRecording={isRecording}
            isRequesting={isRequesting}
            disabled={isUploading}
            onStart={handleStart}
            onStop={handleStop}
          />
        ) : (
          <PlaybackControls
            audioUrl={recorder.audioUrl}
            isUploading={isUploading}
            isUploadDone={isUploadDone}
            canUpload={canUpload}
            onReRecord={handleReRecord}
            onUpload={handleUpload}
          />
        )}

        {(isUploading || isUploadDone) && (
          <UploadProgress
            progress={upload.progress}
            done={isUploadDone}
            label={
              upload.status === "presigning"
                ? "업로드 준비 중…"
                : upload.status === "done"
                  ? "업로드 완료"
                  : "S3 업로드 중"
            }
          />
        )}

        {recorder.error ? <ErrorLine message={recorder.error} /> : null}
        {upload.errorMessage ? (
          <ErrorLine
            message={
              upload.errorCode
                ? `업로드 실패 (${upload.errorCode}): ${upload.errorMessage}`
                : `업로드 실패: ${upload.errorMessage}`
            }
          />
        ) : null}

        <p className="text-xs text-muted-foreground">
          포맷: {recorder.contentType ?? "audio/webm (자동 선택)"} · 마이크 권한이 필요합니다.
        </p>
      </div>
    </section>
  );
}

function StatusLine({
  isRequesting,
  isRecording,
  isRecorded,
  durationMs,
}: {
  isRequesting: boolean;
  isRecording: boolean;
  isRecorded: boolean;
  durationMs: number;
}) {
  if (isRecording) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <span className="tabular-nums">녹음 중 · {formatDuration(durationMs)}</span>
      </div>
    );
  }

  if (isRequesting) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        마이크 권한 요청 중…
      </div>
    );
  }

  if (isRecorded) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
        <span className="tabular-nums">
          녹음 완료 · {formatDuration(durationMs)}
        </span>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      아래 버튼을 눌러 녹음을 시작하세요.
    </p>
  );
}

function RecordButton({
  isRecording,
  isRequesting,
  disabled,
  onStart,
  onStop,
}: {
  isRecording: boolean;
  isRequesting: boolean;
  disabled: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <button
      type="button"
      onClick={isRecording ? onStop : onStart}
      disabled={isRequesting || disabled}
      aria-label={isRecording ? "녹음 정지" : "녹음 시작"}
      className={[
        "grid h-20 w-20 place-items-center rounded-full text-white shadow-lg transition-all",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300",
        "disabled:cursor-not-allowed disabled:opacity-60",
        isRecording
          ? "scale-105 bg-red-500 hover:bg-red-600"
          : "bg-brand-600 hover:bg-brand-700",
      ].join(" ")}
    >
      {isRequesting ? (
        <Loader2 className="size-8 animate-spin" />
      ) : isRecording ? (
        <Square className="size-7 fill-current" />
      ) : (
        <Mic className="size-8" />
      )}
    </button>
  );
}

function PlaybackControls({
  audioUrl,
  isUploading,
  isUploadDone,
  canUpload,
  onReRecord,
  onUpload,
}: {
  audioUrl: string | null;
  isUploading: boolean;
  isUploadDone: boolean;
  canUpload: boolean;
  onReRecord: () => void;
  onUpload: () => void;
}) {
  return (
    <div className="w-full space-y-4">
      {audioUrl ? (
        <audio
          controls
          src={audioUrl}
          preload="metadata"
          className="w-full"
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onReRecord}
          disabled={isUploading}
        >
          <RefreshCw className="size-4" />
          다시 녹음
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onUpload}
          disabled={isUploading || isUploadDone || !canUpload}
          className="bg-brand-600 text-white hover:bg-brand-700"
        >
          {isUploading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              업로드 중…
            </>
          ) : isUploadDone ? (
            <>
              <CheckCircle2 className="size-4" />
              업로드 완료
            </>
          ) : (
            <>
              <Upload className="size-4" />
              업로드하기
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400"
    >
      <AlertCircle className="size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
