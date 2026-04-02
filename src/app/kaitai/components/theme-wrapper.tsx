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
      className={`${fontClass} min-h-screen`}
      style={{
        background: noSidebar
          ? (dark ? "#070E1A" : "#F0F2F5")
          : (dark ? "#070E1A" : "#EEF0F4"),
        color: dark ? "#F1F5F9" : "#111111",
      }}
    >
      <div
        className={[
          "flex flex-col relative",
          noSidebar
            // サイドバーなし：常に中央480px
            ? "mx-auto max-w-[480px] min-h-svh"
            : [
                // スマホ・タブレット：中央480px
                "mx-auto max-w-[480px] min-h-svh",
                // PC（lg以上）：サイドバー分オフセット・全幅
                "lg:mx-0 lg:ml-64 lg:max-w-none",
                // タブレット（md）：アイコンサイドバー分オフセット
                "md:mx-0 md:ml-16 md:max-w-none",
              ].join(" "),
        ].join(" ")}
        style={{
          background: dark ? "#0F1928" : "#FFFFFF",
          // スマホ中央表示のときだけ影
          boxShadow: noSidebar ? "0 0 40px rgba(0,0,0,0.15)" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
