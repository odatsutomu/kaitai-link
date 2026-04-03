"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HardHat, ClipboardList, BarChart2, Database, Users } from "lucide-react";
import { TDark } from "../lib/design-tokens";

const tabs = [
  { href: "/kaitai",          label: "現場",    icon: HardHat },
  { href: "/kaitai/members",  label: "メンバー", icon: Users },
  { href: "/kaitai/work",     label: "作業報告", icon: ClipboardList },
  { href: "/kaitai/admin",    label: "収支管理", icon: BarChart2 },
  { href: "/kaitai/master",   label: "マスタ",   icon: Database },
] as const;

export function KaitaiBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t flex"
      style={{
        background: "rgba(15,25,40,0.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderColor: "#2D3E54",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/kaitai" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5"
          >
            <div
              className="rounded-xl px-2.5 py-1 transition-all"
              style={active ? { background: TDark.primaryLt } : {}}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.5 : 1.8}
                style={{ color: active ? TDark.primary : "#64748B" }}
              />
            </div>
            <span
              className="text-sm font-bold tracking-wide"
              style={{ color: active ? TDark.primary : "#64748B" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
