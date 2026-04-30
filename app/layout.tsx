import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Song 4 U — 음색 기반 노래 추천",
  description:
    "당신의 목소리를 분석해 음색이 비슷한 노래를 찾아주는 서비스입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
