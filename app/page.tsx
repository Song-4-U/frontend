import { RecorderPanel } from "@/components/RecorderPanel";

export default function Home() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-12 text-center md:py-16">
      <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
        Beta · Phase 2 — 녹음 & 업로드
      </span>

      <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
        당신의 목소리와 닮은
        <br />
        <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
          노래를 찾아드릴게요
        </span>
      </h1>

      <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
        잠시 노래를 흥얼거려 보세요. 음색을 분석해 가장 비슷한 분위기의 곡을
        추천해드립니다.
      </p>

      <div className="mt-10 w-full">
        <RecorderPanel />
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        * 다음 단계(음색 선택 → 추천 요청)는 Phase 2 후속 섹션에서 활성화됩니다.
      </p>
    </section>
  );
}
