"use client";

import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface UploadProgressProps {
  /** 0 ~ 100 사이 진행률 (정수). 범위를 벗어나면 clamp 됩니다. */
  progress: number;
  label?: string;
  done?: boolean;
  className?: string;
}

export function UploadProgress({
  progress,
  label = "업로드 중",
  done = false,
  className,
}: UploadProgressProps) {
  // NaN 만 0 으로 강제 변환합니다.
  // ±Infinity 는 Math.round/min/max 가 그대로 0/100 으로 clamp 합니다.
  const safeProgress = Number.isNaN(progress) ? 0 : progress;
  const clamped = Math.max(0, Math.min(100, Math.round(safeProgress)));

  return (
    <div
      className={cn("w-full space-y-2", className)}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          {done ? (
            <CheckCircle2
              className="size-4 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
          ) : null}
          {label}
        </span>
        <span className="tabular-nums text-muted-foreground">{clamped}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-150 ease-out",
            done ? "bg-emerald-500" : "bg-brand-600",
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
