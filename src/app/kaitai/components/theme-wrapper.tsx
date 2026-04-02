"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAppContext } from "../lib/app-context";

const NO_SIDEBAR_ROUTES = [
  "/kaitai/login", "/kaitai/signup", "/kaitai/lp",
  "/kaitai/demo",  "/kaitai/dev",
];

export function ThemeWrapper({ children, fontClass }: { children: ReactNode; fontClass: string }) {
  const { authLevel } = useAppContext();
  const pathname = usePathname();
  const dark = authLevel === "admin" || authLevel === "dev";
  const noSidebar = NO_SIDEBAR_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <div
      className={`${fontClass} min-h-screen flex`}
      style={{
        background: dark ? "#060D1A" : "#CBD5E1",   // 両サイドに見える外枠の色
        color: dark ? "#E2E8F0" : "#334155",
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
          background: dark ? "#0D1827" : "#F8F9FA",
        }}
      >
        {children}
      </div>
    </div>
  );
}
