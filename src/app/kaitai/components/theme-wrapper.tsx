"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAppContext } from "../lib/app-context";

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
        // PCの「余白部分」は落ち着いた色
        background: dark ? "#060E1B" : "#DFE5ED",
        color: dark ? "#E2E8F0" : "#1A202C",
      }}
    >
      {/* サイドバー分のスペーサー */}
      {!noSidebar && (
        <>
          <div className="hidden lg:block w-64 flex-shrink-0" />
          <div className="hidden md:block lg:hidden w-16 flex-shrink-0" />
        </>
      )}

      {/* コンテンツ列 */}
      <div
        className="flex-1 min-w-0 flex flex-col"
        style={{
          minHeight: "100svh",
          // PC：ページ全体背景をわずかにオフホワイト、カードが白で浮き立つ
          background: dark ? "#0D1827" : "#F2F5F8",
        }}
      >
        {children}
      </div>
    </div>
  );
}
