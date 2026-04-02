import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { AppProvider } from "./lib/app-context";
import { KaitaiNav } from "./components/kaitai-nav";
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
        <main className="flex-1 overflow-y-auto pb-24">{children}</main>
        <KaitaiNav />
      </ThemeWrapper>
    </AppProvider>
  );
}
