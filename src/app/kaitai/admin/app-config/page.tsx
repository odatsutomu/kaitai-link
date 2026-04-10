"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Smartphone, ToggleLeft, ToggleRight } from "lucide-react";
import { TDark } from "../../lib/design-tokens";

type FeatureToggles = {
  clockIn: boolean; break: boolean; clockOut: boolean;
  report: boolean; waste: boolean; finish: boolean;
};

const TOGGLE_ITEMS: { key: keyof FeatureToggles; emoji: string; label: string; desc: string }[] = [
  { key: "clockIn",  emoji: "🏁", label: "出勤",   desc: "出勤打刻ボタン" },
  { key: "break",    emoji: "☕️", label: "休憩",   desc: "休憩の入り・戻りボタン" },
  { key: "clockOut", emoji: "🚪", label: "退勤",   desc: "退勤打刻ボタン" },
  { key: "report",   emoji: "📋", label: "報告",   desc: "日次報告・機材チェックボタン" },
  { key: "waste",    emoji: "🚛", label: "廃材",   desc: "廃材入力・処理場比較ボタン" },
  { key: "finish",   emoji: "✅", label: "終了",   desc: "終了報告（進捗・評価・引き継ぎ）ボタン" },
];

export default function AppConfigPage() {
  const router = useRouter();
  const [toggles, setToggles] = useState<FeatureToggles | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/kaitai/company/toggles")
      .then(r => r.json())
      .then(d => { if (d.ok) setToggles(d.toggles); })
      .catch(() => {});
  }, []);

  async function toggle(key: keyof FeatureToggles) {
    if (!toggles || saving) return;
    const next = { ...toggles, [key]: !toggles[key] };
    setToggles(next);
    setSaving(true);
    setSaved(false);

    try {
      await fetch("/api/kaitai/company/toggles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next[key] }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  }

  const D = TDark;

  return (
    <div className="py-6 pb-28 md:pb-8 min-h-full" style={{ background: D.bg, margin: "0 -32px", padding: "24px 32px 112px" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl"
          style={{ background: D.surface }}>
          <ChevronLeft size={20} style={{ color: D.sub }} />
        </button>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, color: D.text }}>現場アプリの機能カスタマイズ</p>
          <p style={{ fontSize: 14, color: D.sub, marginTop: 2 }}>スタッフのスマホに表示する機能を制御</p>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-2xl px-5 py-4 mb-6"
        style={{ background: "rgba(255,255,255,0.05)", border: `1px solid rgba(255,255,255,0.1)` }}>
        <div className="flex items-center gap-2 mb-3">
          <Smartphone size={16} style={{ color: D.primary }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: D.primary }}>プレビュー — スタッフのアクション画面</p>
        </div>
        {toggles && (
          <div className="flex flex-wrap gap-2">
            {TOGGLE_ITEMS.filter(t => toggles[t.key]).map(t => (
              <span key={t.key} style={{
                fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.08)", color: D.text,
              }}>
                {t.emoji} {t.label}
              </span>
            ))}
            {TOGGLE_ITEMS.every(t => !toggles[t.key]) && (
              <span style={{ fontSize: 13, color: D.muted }}>すべてのボタンが非表示です</span>
            )}
          </div>
        )}
      </div>

      {/* Toggle list */}
      {!toggles ? (
        <div className="flex items-center justify-center py-16">
          <p style={{ fontSize: 14, color: D.muted }}>読み込み中...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {TOGGLE_ITEMS.map(item => {
            const isOn = toggles[item.key];
            return (
              <button
                key={item.key}
                onClick={() => toggle(item.key)}
                className="w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all"
                style={{
                  background: isOn ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                  border: isOn ? `1.5px solid ${D.primary}40` : `1.5px solid rgba(255,255,255,0.06)`,
                }}
              >
                <span style={{ fontSize: 28 }}>{item.emoji}</span>
                <div className="flex-1">
                  <p style={{ fontSize: 16, fontWeight: 700, color: isOn ? D.text : D.muted }}>{item.label}</p>
                  <p style={{ fontSize: 13, color: D.sub }}>{item.desc}</p>
                </div>
                {isOn ? (
                  <ToggleRight size={36} style={{ color: D.primary }} />
                ) : (
                  <ToggleLeft size={36} style={{ color: "rgba(255,255,255,0.2)" }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Save indicator */}
      {saved && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl z-50"
          style={{ background: "#10B981", color: "#FFF", fontSize: 14, fontWeight: 700 }}>
          ✓ 保存しました
        </div>
      )}

      {/* Note */}
      <p style={{ fontSize: 12, color: D.muted, marginTop: 24, textAlign: "center" }}>
        変更はリアルタイムでスタッフのアプリに反映されます
      </p>
    </div>
  );
}
