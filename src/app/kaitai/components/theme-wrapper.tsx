"use client";

import { ReactNode } from "react";
import { T } from "../lib/design-tokens";

export function ThemeWrapper({ children, fontClass }: { children: ReactNode; fontClass: string }) {
  return (
    <div
      className={`${fontClass} min-h-screen flex flex-col`}
      style={{
        background: T.bg,
        color: T.text,
      }}
    >
      {children}
    </div>
  );
}
