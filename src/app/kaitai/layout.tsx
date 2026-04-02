import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { AppProvider } from "./lib/app-context";
import { KaitaiPCHeader, KaitaiMobileNav } from "./components/kaitai-nav";
import { ThemeWrapper } from "./components/theme-wrapper";

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "解体LINK",
  description: "解体業専用業務管理アプリ — 現場報告・機材管理・収支分析をスマホ1台で",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "解体LINK",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function KaitaiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <ThemeWrapper fontClass={noto.className}>
        {/* PC トップヘッダー（lg以上・sticky） */}
        <KaitaiPCHeader />

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-y-auto pb-36 lg:pb-12">
          {/*
            PC 向けコンテナ：
            - 最大幅 1280px で中央寄せ
            - 左右 40px (px-10) のパディング
            - モバイルはそのまま（各ページが自前でパディングを持つ）
          */}
          <div className="w-full lg:max-w-[1280px] lg:mx-auto lg:px-10">
            {children}
          </div>
        </main>

        {/* モバイル底辺ナビ（lg未満で表示） */}
        <KaitaiMobileNav />
      </ThemeWrapper>
    </AppProvider>
  );
}
