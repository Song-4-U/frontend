import Link from "next/link";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-md bg-brand-600 text-white text-sm font-bold shadow-sm"
          >
            S
          </span>
          <span className="text-base font-semibold tracking-tight">
            Song 4 U
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              음색 기반 추천
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {USE_MOCK ? (
            <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
              MOCK
            </span>
          ) : null}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
