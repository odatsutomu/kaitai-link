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
    <div
      className={`${fontClass} min-h-screen flex flex-col`}
      style={{
        background: dark ? "#0F1928" : "#FFFFFF",
        color:      dark ? "#F1F5F9" : "#111111",
      }}
    >
      {children}
    </div>
  );
}
