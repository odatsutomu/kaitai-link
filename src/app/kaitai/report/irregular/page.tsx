"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, CheckCircle, AlertTriangle } from "lucide-react";
import PhotoCapture from "../../components/photo-capture";
import { useAppContext } from "../../lib/app-context";
import { T } from "../../lib/design-tokens";

const CATEGORIES = [
  { id: "accident",  label: "事故・怪我",   emoji: "🚑" },
  { id: "damage",    label: "設備破損",     emoji: "🔨" },
  { id: "complaint", label: "クレーム",     emoji: "📞" },
  { id: "weather",   label: "天候・中断",   emoji: "⛈️" },
  { id: "asbestos",  label: "アスベスト",   emoji: "⚗️" },
  { id: "other",     label: "その他",       emoji: "📋" },
];

const URGENCY = [
  { id: "high",   label: "緊急",   color: "#EF5350" },
  { id: "medium", label: "要対応", color: "#FF9800" },
  { id: "low",    label: "報告のみ", color: T.sub },
];

const MEMBERS = [
  { id: "m1", name: "田中 義雄" },
  { id: "m2", name: "鈴木 健太" },
  { id: "m3", name: "山本 大輔" },
  { id: "m4", name: "佐藤 翔" },
  { id: "m5", name: "渡辺 誠" },
  { id: "m6", name: "伊藤 拓也" },
];

function IrregularPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const siteId   = params.get("site") ?? "";
  const siteName = params.get("name") ?? "現場";
  const { addLog, company } = useAppContext();

  const [category, setCategory] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<string>("medium");
  const [reporter, setReporter] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [done, setDone] = useState(false);
  const [photoIds, setPhotoIds] = useState<string[]>([]);

  function confirm() {
    if (!category || !memo.trim()) return;
    const cat = CATEGORIES.find(c => c.id === category)?.label ?? category;
    const urg = URGENCY.find(u => u.id === urgency)?.label ?? urgency;
    const rep = MEMBERS.find(m => m.id === reporter)?.name ?? "不明";
    addLog(
      `irregular[${urg}]: ${siteName} / ${cat} / ${memo.slice(0, 40)} [${company?.stripeCustomerId ?? "—"}]`,
      rep,
      photoIds
    );
    setDone(true);
  }

  const canSubmit = !!category && memo.trim().length > 0;

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ background: "#FFF0F0", borderRadius: 16, padding: "64px 32px" }}>
        <CheckCircle size={96} color="#B71C1C" strokeWidth={1.5} />
        <p style={{ fontSize: 28, fontWeight: 900, color: "#B71C1C", marginTop: 24 }}>報告送信完了</p>
        <p style={{ fontSize: 15, color: "#C62828", marginTop: 8 }}>{siteName}</p>
        <p style={{ fontSize: 14, color: "#888", marginTop: 4 }}>管理者へ通知されました</p>
        <button
          onClick={() => router.push("/kaitai/report")}
          style={{
            marginTop: 32,
            height: 56,
            padding: "0 36px",
            background: "#B45309",
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          ← 画面に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 pb-28 md:pb-8 flex flex-col gap-5">
      <header className="flex flex-col gap-2" style={{ borderBottom: "2px solid #FECACA", paddingBottom: 20 }}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-2xl" style={{ background: "#FEF2F2" }}>
            <ChevronLeft size={20} style={{ color: "#EF4444" }} />
          </button>
          <span style={{ fontSize: 14, color: "#888" }}>{siteName}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle size={24} color="#B71C1C" />
          <p style={{ fontSize: 26, fontWeight: 900, color: "#B71C1C" }}>イレギュラー報告</p>
        </div>
        <p style={{ fontSize: 14, color: "#888", marginTop: 4 }}>発生した問題の詳細を報告してください</p>
      </header>

      <div className="flex flex-col gap-5">

        {/* Category */}
        <section>
          <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: T.muted }}>カテゴリ（必須）</p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(c => {
              const on = category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl py-3 transition-all"
                  style={{
                    background: on ? "#FEF2F2" : "#FAFAFA",
                    border: on ? "2.5px solid #EF4444" : "2px solid #EEEEEE",
                  }}
                >
                  <span style={{ fontSize: 24 }}>{c.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: on ? "#B71C1C" : "#666" }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Urgency */}
        <section>
          <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: T.muted }}>緊急度</p>
          <div className="flex gap-2">
            {URGENCY.map(u => {
              const on = urgency === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setUrgency(u.id)}
                  className="flex-1 py-3 rounded-2xl font-bold transition-all"
                  style={{
                    fontSize: 14,
                    background: on ? u.color : "#FAFAFA",
                    color: on ? "#FFF" : "#888",
                    border: on ? `2px solid ${u.color}` : "2px solid #EEEEEE",
                  }}
                >
                  {u.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Reporter */}
        <section>
          <p className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: T.muted }}>報告者</p>
          <div className="flex flex-wrap gap-2">
            {MEMBERS.map(m => {
              const on = reporter === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setReporter(m.id)}
                  className="px-4 py-2 rounded-2xl font-semibold transition-all"
                  style={{
                    fontSize: 14,
                    background: on ? "#EF4444" : "#F5F5F5",
                    color: on ? "#FFF" : "#555",
                    border: on ? "2px solid #EF4444" : "2px solid #EEEEEE",
                  }}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Memo */}
        <section>
          <p className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: T.muted }}>状況メモ（必須）</p>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="発生状況・場所・対応状況を詳しく記入..."
            className="w-full rounded-2xl px-4 py-3 outline-none resize-none"
            style={{
              minHeight: 110, fontSize: 15,
              background: "#FFF",
              border: memo.trim() ? "2px solid #EEEEEE" : "2px solid #FECACA",
              color: "#111",
            }}
          />
        </section>

        {/* Photo */}
        <section>
          <PhotoCapture
            siteId={siteId}
            reportType="irregular"
            maxPhotos={5}
            accentColor="#EF4444"
            accentBg="#FEF2F2"
            label="現場写真"
            placeholder="タップして現場写真を撮影"
            onPhotosChange={setPhotoIds}
          />
        </section>

      </div>

      <div className="pt-2">
        <button
          onClick={confirm}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 rounded-3xl font-black transition-all active:scale-[0.98]"
          style={{
            height: 68, fontSize: 20,
            background: canSubmit ? "#EF4444" : "#E0E0E0",
            color: canSubmit ? "#FFF" : "#AAA",
          }}
        >
          <AlertTriangle size={20} />
          {canSubmit ? "イレギュラーを報告する" : "カテゴリ・メモを入力"}
        </button>
      </div>
    </div>
  );
}

export default function IrregularPage() {
  return (
    <Suspense fallback={null}>
      <IrregularPageInner />
    </Suspense>
  );
}
