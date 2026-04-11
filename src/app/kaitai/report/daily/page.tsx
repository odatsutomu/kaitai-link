"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, CheckCircle, Camera } from "lucide-react";
import PhotoCapture from "../../components/photo-capture";
import { useAppContext } from "../../lib/app-context";
import { T } from "../../lib/design-tokens";

// ─── 機材チェック項目 ─────────────────────────────────────────────────────────
const CHECK_ITEMS = [
  { id: "backhoe",  label: "バックホー",      emoji: "🏗", category: "" },
  { id: "dump",     label: "ダンプ",          emoji: "🚛", category: "" },
  { id: "sprinkler",label: "散水車",          emoji: "💧", category: "" },
  { id: "crane",    label: "クレーン",         emoji: "🏗", category: "" },
  { id: "breaker",  label: "ブレーカー",       emoji: "🔨", category: "" },
  { id: "other",    label: "その他",          emoji: "🔧", category: "" },
];

function DailyReportInner() {
  const router = useRouter();
  const params = useSearchParams();
  const siteId   = params.get("site") ?? "";
  const siteName = params.get("name") ?? "現場";
  const { company, addLog } = useAppContext();

  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);
  const [allPhotoIds, setAllPhotoIds] = useState<Record<string, string[]>>({});

  // 使用中の機材を自動取得
  const [siteEquipment, setSiteEquipment] = useState<{ id: string; name: string; category: string }[]>([]);
  useEffect(() => {
    fetch("/api/kaitai/equipment")
      .then(r => r.json())
      .then(d => {
        if (d.ok && Array.isArray(d.equipment)) {
          // この現場に割り当てられている、または全機材を表示
          setSiteEquipment(d.equipment.map((e: { id: string; name: string; category: string }) => ({
            id: e.id, name: e.name, category: e.category,
          })));
        }
      })
      .catch(() => {});
  }, []);

  function confirm() {
    const photoIds = Object.values(allPhotoIds).flat();
    addLog(
      `daily_report: ${siteName} / 機材チェック完了`,
      company?.adminName ?? "作業員",
      photoIds
    );
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16"
        style={{ background: "#F5F5F5", borderRadius: 16, padding: "64px 32px" }}>
        <CheckCircle size={96} color="#212121" strokeWidth={1.5} />
        <p style={{ fontSize: 28, fontWeight: 900, color: "#212121", marginTop: 24 }}>報告 送信完了</p>
        <p style={{ fontSize: 15, color: "#616161", marginTop: 8 }}>{siteName}</p>
        <button
          onClick={() => router.push("/kaitai/report")}
          style={{
            marginTop: 32, height: 56, padding: "0 36px",
            background: T.primary, color: "#FFFFFF",
            fontSize: 16, fontWeight: 700, borderRadius: 16,
            border: "none", cursor: "pointer",
          }}
        >
          ← 報告画面に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 pb-28 md:pb-8 flex flex-col gap-6">
      <header className="flex flex-col gap-2" style={{ borderBottom: "2px solid #EEEEEE", paddingBottom: 20 }}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-2xl"
            style={{ background: "#F5F5F5" }}>
            <ChevronLeft size={20} style={{ color: "#444" }} />
          </button>
          <span style={{ fontSize: 14, color: "#888" }}>{siteName}</span>
        </div>
        <p style={{ fontSize: 26, fontWeight: 900, color: "#212121" }}>📋 本日の報告</p>
        <p style={{ fontSize: 14, color: "#666", marginTop: 4 }}>機材チェックおよび報告事項を入力してください</p>
      </header>

      {/* ── 本日の機材チェック（画像アップロード） ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Camera size={18} style={{ color: T.primary }} />
          <p style={{ fontSize: 16, fontWeight: 800, color: T.text }}>本日の機材チェック</p>
        </div>
        <p style={{ fontSize: 13, color: T.sub, marginBottom: 12 }}>
          使用する重機・車両の写真を撮影してください。異常があれば備考に記入してください。
        </p>

        <div className="flex flex-col gap-4">
          {(siteEquipment.length > 0
          ? siteEquipment.map(e => ({ id: e.id, label: e.name, emoji: "🔧", category: e.category }))
          : CHECK_ITEMS
        ).map(eq => (
            <div key={eq.id} className="rounded-2xl overflow-hidden"
              style={{ border: `1.5px solid ${T.border}`, background: T.surface }}>
              <div className="px-4 py-3 flex items-center gap-3"
                style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
                <span style={{ fontSize: 20 }}>{eq.emoji}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
                  {eq.label}
                </span>
                {eq.category && (
                  <span style={{ fontSize: 12, color: T.sub, marginLeft: "auto" }}>{eq.category}</span>
                )}
              </div>
              <div className="p-3">
                <PhotoCapture
                  siteId={siteId}
                  reportType={`equipment_${eq.id}`}
                  maxPhotos={3}
                  label=""
                  placeholder="タップして撮影"
                  onPhotosChange={(ids) => setAllPhotoIds(prev => ({ ...prev, [eq.id]: ids }))}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 備考 ── */}
      <section>
        <p className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: T.muted }}>備考・異常報告</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="機材の異常、油圧漏れ、ベルト摩耗、タイヤの状態など..."
          className="w-full rounded-2xl px-4 py-3 outline-none resize-none"
          style={{ minHeight: 100, fontSize: 14, background: "#FFF", border: "2px solid #EEEEEE", color: "#111" }}
        />
      </section>

      {/* ── 送信ボタン ── */}
      <div className="pt-2">
        <button
          onClick={confirm}
          className="w-full flex items-center justify-center gap-2 rounded-3xl font-black transition-all active:scale-[0.98]"
          style={{ height: 68, fontSize: 20, background: "#212121", color: "#FFF" }}
        >
          報告を送信
        </button>
      </div>
    </div>
  );
}

export default function DailyReportPage() {
  return (
    <Suspense fallback={null}>
      <DailyReportInner />
    </Suspense>
  );
}
