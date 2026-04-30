import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center md:py-24">
      <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
        Beta · Phase 1 Bootstrap
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

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button size="lg" className="bg-brand-600 hover:bg-brand-700 text-white">
          녹음 시작하기
        </Button>
        <Button size="lg" variant="outline">
          어떻게 작동하나요?
        </Button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        * 마이크 권한이 필요합니다. Phase 2 에서 실제 녹음 기능이 활성화됩니다.
      </p>
    </section>
  );
}
