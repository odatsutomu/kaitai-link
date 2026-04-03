import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { AppProvider } from "./lib/app-context";
import { KaitaiPCHeader, KaitaiMobileNav } from "./components/kaitai-nav";
import { ThemeWrapper } from "./components/theme-wrapper";
import { T } from "./lib/design-tokens";

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
  themeColor: T.surface,
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
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 0 }}>
          {/*
            コンテナ：
            - 最大幅 1280px で中央寄せ（mx-auto）
            - モバイル: px-4, md: px-8, lg: px-10 でパディングを統一
            - 各ページは水平パディング不要（縦方向のみ設定）
          */}
          <div
            className="px-4 md:px-8 lg:px-10 box-border"
            style={{ maxWidth: 1280, marginLeft: "auto", marginRight: "auto" }}
          >
            {children}
            {/*
              モバイル固定ナビの高さ分スペーサー。
              Tailwind の padding ユーティリティが globals.css の unlayered * {padding:0} で
              無効化されているため inline style で確実に確保する。
              lg 以上では display:none（PC ヘッダーがあるため不要）
            */}
            <div
              aria-hidden="true"
              className="lg:hidden"
              style={{ height: "calc(76px + env(safe-area-inset-bottom, 0px) + 8px)" }}
            />
          </div>
          {/* PC 用の下余白（lg 以上） */}
          <div className="hidden lg:block" style={{ height: 48 }} />
        </main>

        {/* モバイル底辺ナビ（lg未満で表示） */}
        <KaitaiMobileNav />
      </ThemeWrapper>
    </AppProvider>
  );
}
