"use client";

import { useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Play, MapPin, Clock, Camera, Star, CheckCircle2, Crown } from "lucide-react";
import { MEMBERS, experienceYears, experienceLevel } from "../../lib/members";

// ─── Mock ──────────────────────────────────────────────────────────────────────

const siteNames: Record<string, string> = {
  s1: "山田邸解体工事",
  s2: "旧田中倉庫解体",
};

const workItems = [
  { id: "interior",   label: "内装解体",     icon: "🏠" },
  { id: "structure",  label: "構造体解体",   icon: "🏗️" },
  { id: "foundation", label: "基礎解体",     icon: "⛏️" },
  { id: "exterior",   label: "外構解体",     icon: "🧱" },
  { id: "electric",   label: "電気設備撤去", icon: "⚡" },
  { id: "plumbing",   label: "設備撤去",     icon: "🔧" },
  { id: "asbestos",   label: "アスベスト除去", icon: "⚠️" },
  { id: "sorting",    label: "分別・積込み", icon: "🚛" },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-1 rounded-full"
          style={{
            background: i < step
              ? "linear-gradient(90deg, #F97316, #FBBF24)"
              : i === step
              ? "#F97316"
              : "#2D3E54",
          }}
        />
      ))}
      <span className="text-xs font-bold ml-1" style={{ color: "#64748B" }}>
        {step + 1}/{total}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkStartPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  const { site } = use(searchParams);
  const siteId   = site ?? "s1";
  const siteName = siteNames[siteId] ?? "現場";

  // Step 0: work items, Step 1: member selection, Step 2: responsible person + photo, Step 3: done
  const [step, setStep]               = useState(0);
  const [selectedWork, setSelectedWork] = useState<Set<string>>(new Set());
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [responsible, setResponsible] = useState<string | null>(null);
  const [photoCount, setPhotoCount]   = useState(0);

  const now     = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  function toggleWork(id: string) {
    setSelectedWork((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleMember(id: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (responsible === id) setResponsible(null);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ── Step 3: Completion screen ──
  if (step === 3) {
    const leader = MEMBERS.find((m) => m.id === responsible);
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #4ADE80" }}
        >
          <Play size={32} color="#4ADE80" fill="#4ADE80" />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#F1F5F9" }}>作業開始しました</h2>
        <p className="text-sm mb-1" style={{ color: "#94A3B8" }}>{siteName}</p>
        <p className="text-3xl font-bold mb-4" style={{ color: "#4ADE80" }}>{timeStr}</p>

        {leader && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-2xl mb-3"
            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}
          >
            <Crown size={14} style={{ color: "#FBBF24" }} />
            <span className="text-sm font-bold" style={{ color: "#FBBF24" }}>
              責任者: {leader.name}
            </span>
          </div>
        )}

        <p className="text-xs mb-2" style={{ color: "#64748B" }}>
          出勤 {selectedMembers.size}名・写真 {photoCount}枚
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {Array.from(selectedWork).map((id) => {
            const item = workItems.find((w) => w.id === id);
            return item ? (
              <span
                key={id}
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: "rgba(249,115,22,0.15)", color: "#FB923C" }}
              >
                {item.label}
              </span>
            ) : null;
          })}
        </div>

        <Link href="/kaitai">
          <button
            className="rounded-2xl px-8 py-4 font-bold text-base"
            style={{ background: "#1A2535", border: "1px solid #2D3E54", color: "#F1F5F9" }}
          >
            現場一覧へ戻る
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 pb-28 md:pb-8 flex flex-col gap-5">

      {/* ── Header ── */}
      <section className="flex flex-col gap-3" style={{ borderBottom: "1px solid #2D3E54", paddingBottom: 20 }}>
        <Link href="/kaitai/work" className="inline-flex items-center gap-1.5 mb-4 text-sm" style={{ color: "#64748B" }}>
          <ArrowLeft size={15} /> 作業報告
        </Link>
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)" }}
          >
            <Play size={20} style={{ color: "#F97316" }} fill="#F97316" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#F1F5F9" }}>作業開始</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={11} style={{ color: "#64748B" }} />
              <p className="text-sm" style={{ color: "#94A3B8" }}>{siteName}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
            <Clock size={14} style={{ color: "#F97316" }} />
            <span className="text-lg font-bold" style={{ color: "#F97316" }}>{timeStr}</span>
          </div>
        </div>
        <StepIndicator step={step} total={3} />
      </section>

      <div className="px-4 flex flex-col gap-5">

        {/* ══ STEP 0: 作業項目選択 ══ */}
        {step === 0 && (
          <>
            <section>
              <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: "#F97316" }}>
                STEP 1｜本日の作業項目
              </p>
              <div className="grid grid-cols-2 gap-2">
                {workItems.map((item) => {
                  const active = selectedWork.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleWork(item.id)}
                      className="rounded-2xl px-4 py-4 flex items-center gap-3 text-left active:scale-[0.97] transition-all"
                      style={{
                        background: active ? "rgba(249,115,22,0.12)" : "#1A2535",
                        border: active ? "1.5px solid #F97316" : "1px solid #2D3E54",
                      }}
                    >
                      <span className="text-xl leading-none">{item.icon}</span>
                      <span className="text-sm font-semibold leading-snug" style={{ color: active ? "#F97316" : "#94A3B8" }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
            <button
              onClick={() => selectedWork.size > 0 && setStep(1)}
              className="w-full rounded-2xl py-5 font-bold text-lg active:scale-[0.98] transition-transform"
              style={
                selectedWork.size > 0
                  ? { background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", color: "#fff", boxShadow: "0 6px 28px rgba(249,115,22,0.35)" }
                  : { background: "#1A2535", border: "1px solid #2D3E54", color: "#475569" }
              }
            >
              次へ：メンバー選択 →
            </button>
          </>
        )}

        {/* ══ STEP 1: メンバー選択 ══ */}
        {step === 1 && (
          <>
            <section>
              <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: "#F97316" }}>
                STEP 2｜本日の作業員を選択（複数可）
              </p>
              <div className="flex flex-col gap-2">
                {MEMBERS.map((m) => {
                  const yrs = experienceYears(m);
                  const lvl = experienceLevel(yrs);
                  const sel = selectedMembers.has(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleMember(m.id)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left active:scale-[0.98] transition-all"
                      style={{
                        background: sel ? "rgba(249,115,22,0.08)" : "#1A2535",
                        border: sel ? "1.5px solid rgba(249,115,22,0.5)" : "1px solid #2D3E54",
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center"
                        style={{
                          background: sel ? "#F97316" : "#0F1928",
                          border: sel ? "none" : "1.5px solid #475569",
                        }}
                      >
                        {sel && <CheckCircle2 size={14} color="#fff" />}
                      </div>

                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-base font-bold"
                        style={{ background: lvl.bg, color: lvl.color }}
                      >
                        {m.avatar}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold" style={{ color: sel ? "#F1F5F9" : "#94A3B8" }}>
                            {m.name}
                          </span>
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: lvl.bg, color: lvl.color }}
                          >
                            {lvl.label}
                          </span>
                          {m.type === "外注" && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full"
                              style={{ background: "rgba(99,102,241,0.1)", color: "#818CF8" }}
                            >
                              外注
                            </span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: "#64748B" }}>{m.role}</p>
                      </div>

                      {/* Stars */}
                      <span className="flex flex-shrink-0 gap-0.5">
                        {Array.from({ length: lvl.stars }).map((_, i) => (
                          <Star key={i} size={9} fill={lvl.color} style={{ color: lvl.color }} />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStep(0)}
                className="rounded-2xl py-4 font-bold"
                style={{ background: "#1A2535", border: "1px solid #2D3E54", color: "#94A3B8" }}
              >
                ← 戻る
              </button>
              <button
                onClick={() => selectedMembers.size > 0 && setStep(2)}
                className="rounded-2xl py-4 font-bold active:scale-[0.98] transition-transform"
                style={
                  selectedMembers.size > 0
                    ? { background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", color: "#fff", boxShadow: "0 4px 20px rgba(249,115,22,0.3)" }
                    : { background: "#1A2535", border: "1px solid #2D3E54", color: "#475569" }
                }
              >
                次へ →（{selectedMembers.size}名）
              </button>
            </div>
          </>
        )}

        {/* ══ STEP 2: 責任者指定 + 着工前写真 ══ */}
        {step === 2 && (
          <>
            {/* 責任者選択 */}
            <section>
              <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: "#F97316" }}>
                STEP 3｜責任者を1名指定
              </p>
              <div className="flex flex-col gap-2">
                {Array.from(selectedMembers).map((mid) => {
                  const m = MEMBERS.find((x) => x.id === mid);
                  if (!m) return null;
                  const yrs = experienceYears(m);
                  const lvl = experienceLevel(yrs);
                  const isLeader = responsible === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setResponsible(isLeader ? null : m.id)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left active:scale-[0.98] transition-all"
                      style={{
                        background: isLeader ? "rgba(251,191,36,0.1)" : "#1A2535",
                        border: isLeader ? "2px solid #FBBF24" : "1px solid #2D3E54",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-base font-bold"
                        style={{ background: lvl.bg, color: lvl.color }}
                      >
                        {m.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold" style={{ color: isLeader ? "#FBBF24" : "#F1F5F9" }}>
                          {m.name}
                        </p>
                        <p className="text-xs" style={{ color: "#64748B" }}>{m.role}</p>
                      </div>
                      {isLeader ? (
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                          style={{ background: "rgba(251,191,36,0.15)" }}
                        >
                          <Crown size={13} style={{ color: "#FBBF24" }} />
                          <span className="text-xs font-bold" style={{ color: "#FBBF24" }}>責任者</span>
                        </div>
                      ) : (
                        <div
                          className="w-7 h-7 rounded-lg border-2 flex-shrink-0"
                          style={{ borderColor: "#2D3E54" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 着工前写真（必須） */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#F97316" }}>
                  着工前写真（必須）
                </p>
                {photoCount === 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.1)", color: "#F87171" }}>
                    未撮影
                  </span>
                )}
              </div>
              <button
                onClick={() => setPhotoCount((n) => n + 1)}
                className="w-full rounded-2xl py-5 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
                style={{
                  background: "#1A2535",
                  border: `2px dashed ${photoCount > 0 ? "rgba(249,115,22,0.5)" : "#F87171"}`,
                }}
              >
                <Camera size={28} style={{ color: photoCount > 0 ? "#F97316" : "#F87171" }} />
                <span className="text-sm font-bold" style={{ color: photoCount > 0 ? "#F97316" : "#F87171" }}>
                  {photoCount > 0 ? `${photoCount}枚 撮影済み ✓` : "現場状況を撮影する（必須）"}
                </span>
                <span className="text-xs" style={{ color: "#475569" }}>
                  着工前の現場全景・各部位を記録
                </span>
              </button>
            </section>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-2xl py-4 font-bold"
                style={{ background: "#1A2535", border: "1px solid #2D3E54", color: "#94A3B8" }}
              >
                ← 戻る
              </button>
              <button
                onClick={() => responsible && photoCount > 0 && setStep(3)}
                className="rounded-2xl py-4 flex items-center justify-center gap-2 font-bold active:scale-[0.98] transition-transform"
                style={
                  responsible && photoCount > 0
                    ? { background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", color: "#fff", boxShadow: "0 4px 20px rgba(249,115,22,0.3)" }
                    : { background: "#1A2535", border: "1px solid #2D3E54", color: "#475569" }
                }
              >
                <Play size={16} fill={responsible && photoCount > 0 ? "#fff" : "#475569"} />
                作業開始を記録
              </button>
            </div>
            {(!responsible || photoCount === 0) && (
              <p className="text-center text-xs -mt-2" style={{ color: "#64748B" }}>
                {!responsible ? "責任者を指定" : ""}
                {!responsible && photoCount === 0 ? "・" : ""}
                {photoCount === 0 ? "着工前写真を撮影" : ""}
                　してから送信できます
              </p>
            )}
          </>
        )}

      </div>
    </div>
  );
}
