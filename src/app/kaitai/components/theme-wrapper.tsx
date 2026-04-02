"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAppContext } from "../lib/app-context";

const NO_SIDEBAR_ROUTES = [
  "/kaitai/login", "/kaitai/signup", "/kaitai/lp",
  "/kaitai/demo",  "/kaitai/dev",
];

export function ThemeWrapper({ children, fontClass }: { children: ReactNode; fontClass: string }) {
  const pathname = usePathname();
  const noSidebar = NO_SIDEBAR_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <div
      className={`${fontClass} min-h-screen flex`}
      style={{
        background: "#E2E8F0",   // サイドバー両サイドに見える外枠の色
        color: "#334155",
      }}
    >
      {/* サイドバーのスペーサー */}
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
          background: "#F8F9FA",
        }}
      >
        {children}
      </div>
    </div>
  );
}
