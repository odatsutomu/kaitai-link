"use client";

import { ReactNode } from "react";

export function ThemeWrapper({ children, fontClass }: { children: ReactNode; fontClass: string }) {
  return (
    <div
      className={`${fontClass} min-h-screen flex flex-col`}
      style={{
        background: "#F8F9FA",
        color: "#334155",
      }}
    >
      {children}
    </div>
  );
}
