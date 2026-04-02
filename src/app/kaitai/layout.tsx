import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { AppProvider } from "./lib/app-context";
import { KaitaiSidebar, KaitaiTopBar, KaitaiMobileNav } from "./components/kaitai-nav";
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
        {/* サイドバー（fixed、フロー外） */}
        <KaitaiSidebar />

        {/* PCトップバー（sticky、mainより上に配置） */}
        <KaitaiTopBar />

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-10">
          {/*
            PC 向けコンテナ：
            - 横幅を 1280px で制限（画面端まで広がらないように）
            - 中央寄せ＋左右パディングで余白を確保
            - モバイルはそのまま（各ページが自前でパディングを持つ）
          */}
          <div className="w-full md:max-w-[1280px] md:mx-auto">
            {children}
          </div>
        </main>

        {/* モバイル底辺ナビ（md+では非表示） */}
        <KaitaiMobileNav />
      </ThemeWrapper>
    </AppProvider>
  );
}
