"use client";

import { ReactNode } from "react";
import { useAppContext } from "../lib/app-context";

/**
 * Switches the root background/text between:
 *   Worker mode → pure white #FFFFFF / near-black #111111
 *   Admin mode  → dark navy  #0F1928 / slate  #F1F5F9
 */
export function ThemeWrapper({
  children,
  fontClass,
}: {
  children: ReactNode;
  fontClass: string;
}) {
  const { authLevel } = useAppContext();
  const dark = authLevel === "admin" || authLevel === "dev";

  return (
    /* 画面全体の背景（PC では両サイドに薄いパネルを出す） */
    <div
      className={`${fontClass} min-h-screen flex justify-center`}
      style={{
        background: dark ? "#070E1A" : "#F0F0F0",
        color:      dark ? "#F1F5F9" : "#111111",
      }}
    >
      {/* コンテンツ列：スマホは全幅、PC は最大 480px で中央寄せ */}
      <div
        className="flex flex-col w-full relative"
        style={{
          maxWidth: 480,
          minHeight: "100svh",
          background: dark ? "#0F1928" : "#FFFFFF",
          boxShadow: "0 0 40px rgba(0,0,0,0.15)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
