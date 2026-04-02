import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "解体LINK",
  description: "解体業専用業務管理アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
