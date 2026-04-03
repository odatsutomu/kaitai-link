"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, CheckCircle, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import PhotoCapture from "../../components/photo-capture";
import { useAppContext, getSiteStatusMap } from "../../lib/app-context";
import { T } from "../../lib/design-tokens";
import { EVAL_CATEGORIES, SCORE_META, type EvalScore } from "../../lib/evaluation-data";

// ─── 廃材品目（品目ごとのステップ値付き） ────────────────────────────────────
const WASTE_ITEMS = [
  { id: "w1", label: "コンクリートガラ", unit: "㎥", step: 1.0 },
  { id: "w2", label: "木材廃材",         unit: "㎥", step: 0.5 },
  { id: "w3", label: "金属スクラップ",   unit: "kg", step: 10.0 },
  { id: "w4", label: "アスベスト含有",   unit: "袋", step: 1.0 },
  { id: "w5", label: "その他混合廃棄",   unit: "㎥", step: 0.5 },
];

// メンバーマスター（start ページと共有）
const ALL_MEMBERS = [
  { id: "m1", name: "田中 義雄", role: "職長" },
  { id: "m2", name: "鈴木 健太", role: "作業員" },
  { id: "m3", name: "山本 大輔", role: "作業員" },
  { id: "m4", name: "佐藤 翔",   role: "作業員" },
  { id: "m5", name: "渡辺 誠",   role: "作業員" },
  { id: "m6", name: "伊藤 拓也", role: "補助" },
];

function FinishPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const siteId   = params.get("site") ?? "";
  const siteName = params.get("name") ?? "現場";
  const { addLog, company, addEvaluation, addHandoverMemo, attendanceLogs } = useAppContext();

  const today = new Date().toISOString().slice(0, 10);

  // ── 廃材：文字列として保持して input と +/- を同期 ───────────────────────
  const [waste, setWaste] = useState<Record<string, string>>(
    Object.fromEntries(WASTE_ITEMS.map(w => [w.id, "0"]))
  );

  function changeWaste(id: string, direction: 1 | -1) {
    const item = WASTE_ITEMS.find(w => w.id === id)!;
    const current = parseFloat(waste[id] || "0");
    const next = Math.max(0, Math.round((current + direction * item.step) * 100) / 100);
    setWaste(prev => ({ ...prev, [id]: String(next) }));
  }

  function handleWasteInput(id: string, value: string) {
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setWaste(prev => ({ ...prev, [id]: value }));
    }
  }

  // ── 経費・メモ ──────────────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState("");
  const [memo, setMemo]         = useState("");

  // ── 引き継ぎメモ ─────────────────────────────────────────────────────────────
  const [handoverMemo, setHandoverMemo] = useState("");

  // ── 評価 ─────────────────────────────────────────────────────────────────────
  // 本日この現場に出勤したスタッフ
  const siteStaffIds = Array.from(getSiteStatusMap(attendanceLogs, siteId, today).keys());

  // 評価者（職長）: 本日のスタッフから職長を自動選択、なければ最初のスタッフ
  const defaultEvaluatorId = (() => {
    const lead = ALL_MEMBERS.find(m => m.role === "職長" && siteStaffIds.includes(m.id));
    return lead?.id ?? siteStaffIds[0] ?? "";
  })();
  const [evaluatorId, setEvaluatorId] = useState(defaultEvaluatorId);

  // 評価対象：本日出勤 かつ 評価者自身を除く
  const evalTargets = ALL_MEMBERS.filter(
    m => siteStaffIds.includes(m.id) && m.id !== evaluatorId
  );

  type ScoreMap = Partial<Record<keyof typeof EVAL_CATEGORIES[0]["key"] extends string ? keyof typeof EVAL_CATEGORIES[0] : never, EvalScore>>;
  const [evalScores, setEvalScores] = useState<Record<string, Record<string, EvalScore>>>({});
  const [evalMemos,  setEvalMemos]  = useState<Record<string, string>>({});
  const [evalOpen,   setEvalOpen]   = useState<Record<string, boolean>>({});

  function setScore(targetId: string, cat: string, score: EvalScore) {
    setEvalScores(prev => ({
      ...prev,
      [targetId]: { ...(prev[targetId] ?? {}), [cat]: score },
    }));
  }

  // ── 送信 ────────────────────────────────────────────────────────────────────
  const [done, setDone] = useState(false);

  function confirm() {
    const wasteStr = WASTE_ITEMS
      .filter(w => parseFloat(waste[w.id] || "0") > 0)
      .map(w => `${w.label}:${parseFloat(waste[w.id])}${w.unit}`)
      .join("、") || "廃材なし";

    addLog(
      `finish: ${siteName} / 廃材[${wasteStr}] 経費¥${expenses || 0}`,
      company?.adminName ?? "作業員"
    );

    // 評価を保存（全カテゴリ入力済みの対象のみ）
    const evaluator = ALL_MEMBERS.find(m => m.id === evaluatorId);
    evalTargets.forEach(target => {
      const scores = evalScores[target.id];
      const cats = EVAL_CATEGORIES.map(c => c.key);
      const allFilled = cats.every(k => scores?.[k] != null);
      if (!allFilled) return;
      addEvaluation({
        id: `ev${Date.now().toString(36)}_${target.id}`,
        evaluatorId,
        evaluatorName: evaluator?.name ?? "",
        targetWorkerId: target.id,
        targetWorkerName: target.name,
        projectId: siteId,
        projectName: siteName,
        date: today,
        timestamp: new Date().toISOString(),
        attendance:   scores.attendance   ?? 2,
        safety:       scores.safety       ?? 2,
        speed:        scores.speed        ?? 2,
        equipment:    scores.equipment    ?? 2,
        neighborhood: scores.neighborhood ?? 2,
        memo: evalMemos[target.id] ?? "",
      });
    });

    // 引き継ぎメモを保存
    if (handoverMemo.trim()) {
      addHandoverMemo({ siteId, date: today, memo: handoverMemo.trim(), evaluatorId });
    }

    setDone(true);
  }

  // ── 完了画面 ──────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16"
        style={{ background: "#F5F5F5", borderRadius: 16, padding: "64px 32px" }}>
        <CheckCircle size={96} color="#212121" strokeWidth={1.5} />
        <p style={{ fontSize: 28, fontWeight: 900, color: "#212121", marginTop: 24 }}>終了報告 送信完了</p>
        <p style={{ fontSize: 15, color: "#616161", marginTop: 8 }}>{siteName}</p>
        <button
          onClick={() => router.push("/kaitai/report")}
          style={{
            marginTop: 32, height: 56, padding: "0 36px",
            background: T.primary, color: "#FFFFFF",
            fontSize: 16, fontWeight: 700, borderRadius: 16,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          ← 画面に戻る
        </button>
      </div>
    );
  }

  const evaluator = ALL_MEMBERS.find(m => m.id === evaluatorId);

  return (
    <div className="py-6 pb-28 md:pb-8 flex flex-col gap-6">

      {/* ─ ヘッダー ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-2" style={{ borderBottom: "2px solid #EEEEEE", paddingBottom: 20 }}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-2xl"
            style={{ background: "#F5F5F5" }}>
            <ChevronLeft size={20} style={{ color: "#444" }} />
          </button>
          <span style={{ fontSize: 14, color: "#888" }}>{siteName}</span>
        </div>
        <p style={{ fontSize: 26, fontWeight: 900, color: "#212121" }}>🚚 終了報告</p>
        <p style={{ fontSize: 14, color: "#666", marginTop: 4 }}>廃材数量・評価・引き継ぎメモを入力してください</p>
      </header>

      {/* ─ 廃材数量（ハイブリッド入力） ─────────────────────────────────────── */}
      <section>
        <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: T.muted }}>
          廃材数量
        </p>
        <div className="flex flex-col gap-2">
          {WASTE_ITEMS.map(w => (
            <div
              key={w.id}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: T.surface, border: "1.5px solid #EEEEEE" }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ fontSize: 14, color: "#222" }}>{w.label}</p>
                <p style={{ fontSize: 11, color: T.muted }}>ステップ: {w.step}{w.unit}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => changeWaste(w.id, -1)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#F5F5F5" }}
                >
                  <Minus size={16} color="#666" />
                </button>
                <div className="flex items-center gap-1" style={{ minWidth: 80 }}>
                  <input
                    type="number"
                    min="0"
                    step={w.step}
                    value={waste[w.id]}
                    onChange={e => handleWasteInput(w.id, e.target.value)}
                    className="rounded-lg text-center outline-none"
                    style={{
                      width: 60, height: 36,
                      fontSize: 18, fontWeight: 800, color: "#111",
                      background: "#F9FAFB", border: "1.5px solid #E5E7EB",
                    }}
                  />
                  <span style={{ fontSize: 12, color: "#999" }}>{w.unit}</span>
                </div>
                <button
                  onClick={() => changeWaste(w.id, 1)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#212121" }}
                >
                  <Plus size={16} color="#FFF" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─ 経費 ─────────────────────────────────────────────────────────────── */}
      <section>
        <p className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: T.muted }}>経費（円）</p>
        <input
          type="number"
          inputMode="numeric"
          value={expenses}
          onChange={e => setExpenses(e.target.value)}
          placeholder="0"
          className="w-full rounded-2xl px-5 outline-none"
          style={{ height: 60, fontSize: 22, fontWeight: 700, background: "#FFF", border: "2px solid #EEEEEE", color: "#111" }}
        />
      </section>

      {/* ─ 現場写真 ─────────────────────────────────────────────────────────── */}
      <section>
        <PhotoCapture
          siteId={siteId}
          reportType="finish"
          maxPhotos={5}
          label="現場写真"
          placeholder="タップして完了写真を撮影"
        />
      </section>

      {/* ─ 作業員評価 ────────────────────────────────────────────────────────── */}
      <section>
        <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: T.muted }}>作業員評価</p>

        {/* 評価者（職長）ピッカー */}
        <div className="flex items-center gap-3 mb-4 p-4 rounded-2xl"
          style={{ background: T.primaryLt, border: `1.5px solid ${T.border}` }}>
          <div>
            <p style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>評価者（現場責任者）</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: T.text }}>
              {evaluator?.name ?? "未選択"}
              <span style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginLeft: 6 }}>
                {evaluator?.role}
              </span>
            </p>
          </div>
          <select
            value={evaluatorId}
            onChange={e => setEvaluatorId(e.target.value)}
            className="ml-auto rounded-xl px-3 outline-none"
            style={{ height: 40, fontSize: 13, fontWeight: 700, background: T.surface, border: `1.5px solid ${T.border}`, color: T.text }}
          >
            {ALL_MEMBERS
              .filter(m => siteStaffIds.includes(m.id) || m.role === "職長")
              .map(m => (
                <option key={m.id} value={m.id}>{m.name}（{m.role}）</option>
              ))
            }
          </select>
        </div>

        {evalTargets.length === 0 ? (
          <div className="flex items-center justify-center py-8 rounded-2xl"
            style={{ background: T.bg, border: `1.5px solid ${T.border}` }}>
            <p style={{ fontSize: 14, color: T.muted }}>本日の出勤者が評価者のみか、出勤記録がありません</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {evalTargets.map(target => {
              const scores = evalScores[target.id] ?? {};
              const isOpen = evalOpen[target.id] ?? false;
              const filledCount = EVAL_CATEGORIES.filter(c => scores[c.key] != null).length;

              return (
                <div key={target.id}
                  style={{ border: `1.5px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>

                  {/* 対象者ヘッダー */}
                  <button
                    onClick={() => setEvalOpen(prev => ({ ...prev, [target.id]: !isOpen }))}
                    className="w-full flex items-center gap-3 px-4 py-3"
                    style={{ background: T.surface }}
                  >
                    <div className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
                      style={{ width: 36, height: 36, fontSize: 14, background: T.primaryLt, color: T.primary }}>
                      {target.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-left">
                      <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{target.name}</p>
                      <p style={{ fontSize: 12, color: T.sub }}>{target.role}</p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-lg font-bold"
                      style={{
                        fontSize: 12,
                        background: filledCount === EVAL_CATEGORIES.length ? "#F0FDF4" : T.bg,
                        color: filledCount === EVAL_CATEGORIES.length ? "#166534" : T.muted,
                      }}
                    >
                      {filledCount}/{EVAL_CATEGORIES.length}
                    </span>
                    {isOpen
                      ? <ChevronUp size={16} style={{ color: T.sub }} />
                      : <ChevronDown size={16} style={{ color: T.sub }} />
                    }
                  </button>

                  {/* 評価フォーム */}
                  {isOpen && (
                    <div className="px-4 py-4 flex flex-col gap-4"
                      style={{ background: "#FAFAFA", borderTop: `1px solid ${T.border}` }}>
                      {EVAL_CATEGORIES.map(cat => (
                        <div key={cat.key}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                            {cat.emoji} {cat.label}
                          </p>
                          <div className="flex gap-2">
                            {([3, 2, 1] as EvalScore[]).map(score => {
                              const meta = SCORE_META[score];
                              const active = scores[cat.key] === score;
                              return (
                                <button
                                  key={score}
                                  onClick={() => setScore(target.id, cat.key, score)}
                                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all"
                                  style={{
                                    height: 44, fontSize: 14,
                                    background: active ? meta.bg : T.bg,
                                    border: active ? `2px solid ${meta.color}` : `1.5px solid ${T.border}`,
                                    color: active ? meta.color : T.muted,
                                  }}
                                >
                                  <span>{meta.icon}</span>
                                  {meta.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* 評価メモ */}
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 6 }}>📝 コメント（任意）</p>
                        <textarea
                          value={evalMemos[target.id] ?? ""}
                          onChange={e => setEvalMemos(prev => ({ ...prev, [target.id]: e.target.value }))}
                          placeholder="特記事項があれば..."
                          className="w-full rounded-xl px-3 py-2 outline-none resize-none"
                          style={{ minHeight: 64, fontSize: 13, background: "#FFF", border: `1.5px solid ${T.border}`, color: T.text }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─ 引き継ぎメモ ─────────────────────────────────────────────────────── */}
      <section>
        <p className="text-sm font-bold tracking-widest uppercase mb-1" style={{ color: T.muted }}>
          引き継ぎメモ
        </p>
        <p style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>
          翌日の勤務開始時にスタッフへ自動表示されます
        </p>
        <textarea
          value={handoverMemo}
          onChange={e => setHandoverMemo(e.target.value)}
          placeholder="明日の注意事項・続き作業・搬入予定など..."
          className="w-full rounded-2xl px-4 py-3 outline-none resize-none"
          style={{
            minHeight: 100, fontSize: 14,
            background: handoverMemo ? "#FFFBEB" : "#FFF",
            border: handoverMemo ? `2px solid #FCD34D` : "2px solid #EEEEEE",
            color: "#111",
          }}
        />
        {handoverMemo && (
          <p style={{ fontSize: 12, color: "#92400E", marginTop: 4, fontWeight: 600 }}>
            ✓ 翌日の勤務開始時に表示されます
          </p>
        )}
      </section>

      {/* ─ 備考 ─────────────────────────────────────────────────────────────── */}
      <section>
        <p className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: T.muted }}>備考</p>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="特記事項があれば入力..."
          className="w-full rounded-2xl px-4 py-3 outline-none resize-none"
          style={{ minHeight: 80, fontSize: 14, background: "#FFF", border: "2px solid #EEEEEE", color: "#111" }}
        />
      </section>

      {/* ─ 送信ボタン ────────────────────────────────────────────────────────── */}
      <div className="pt-2">
        <button
          onClick={confirm}
          className="w-full flex items-center justify-center gap-2 rounded-3xl font-black transition-all active:scale-[0.98]"
          style={{ height: 68, fontSize: 20, background: "#212121", color: "#FFF" }}
        >
          終了報告を送信
        </button>
      </div>

    </div>
  );
}

export default function FinishPage() {
  return (
    <Suspense fallback={null}>
      <FinishPageInner />
    </Suspense>
  );
}
