"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAppContext } from "../lib/app-context";

// サイドバーを表示しないルート
const NO_SIDEBAR_ROUTES = [
  "/kaitai/login",
  "/kaitai/signup",
  "/kaitai/lp",
  "/kaitai/demo",
  "/kaitai/dev",
];

export function ThemeWrapper({
  children,
  fontClass,
}: {
  children: ReactNode;
  fontClass: string;
}) {
  const { authLevel } = useAppContext();
  const pathname = usePathname();
  const dark = authLevel === "admin" || authLevel === "dev";
  const noSidebar = NO_SIDEBAR_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <div
      className={`${fontClass} min-h-screen flex`}
      style={{
        background: dark ? "#070E1A" : "#EEF0F4",
        color: dark ? "#F1F5F9" : "#111111",
      }}
    >
      {/*
        ── サイドバーが存在するページでは「スペーサー」を挿入 ──
        固定(fixed)サイドバーはドキュメントフローの外なので
        同幅の透明スペーサーでコンテンツを右にズラす。
        モバイル(<768px)：hidden → スペーサーなし＝全幅
        タブレット(768-1024px)：w-16 (64px)
        PC(1024px+)：w-64 (256px)
      */}
      {!noSidebar && (
        <>
          <div className="hidden lg:block w-64 flex-shrink-0" />
          <div className="hidden md:block lg:hidden w-16 flex-shrink-0" />
        </>
      )}

      {/* コンテンツ列：スペーサーの残りを埋める */}
      <div
        className="flex-1 min-w-0 flex flex-col"
        style={{
          minHeight: "100svh",
          background: dark ? "#0F1928" : "#FFFFFF",
        }}
      >
        {children}
      </div>
    </div>
  );
}
