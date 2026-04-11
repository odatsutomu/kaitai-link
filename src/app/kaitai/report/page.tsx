"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Delete, MapPin, Loader2 } from "lucide-react";
import { useAppContext, countActiveStaff } from "../lib/app-context";
import { T } from "../lib/design-tokens";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: T.text, sub: T.sub, muted: T.sub,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
};

// ─── Feature toggles ─────────────────────────────────────────────────────────
type FeatureToggles = {
  clockIn: boolean; break: boolean; clockOut: boolean;
  report: boolean; waste: boolean; finish: boolean;
};
const ALL_ON: FeatureToggles = { clockIn: true, break: true, clockOut: true, report: true, waste: true, finish: true };

// ─── 完工済みステータス（これらは報告対象外） ─────────────────────────────────
const DONE_STATUSES = ["完工", "完工・更地確認", "産廃書類完了", "入金確認"];

// ─── Site type from API ──────────────────────────────────────────────────────
type Site = {
  id: string;
  name: string;
  address: string;
  status: string;
};

// ─── Site color palette ──────────────────────────────────────────────────────
const SITE_COLORS = [T.primary, "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#0EA5E9", "#EC4899"];

type Step = "site" | "pin" | "action";

const PAD_KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"] as const;

// ─── Action tile ──────────────────────────────────────────────────────────────

function ActionTile({
  emoji, label, sub, bg, border, textColor, onClick, wide = false, disabled = false, onDisabledTap,
}: {
  emoji: string; label: string; sub: string; bg: string; border: string; textColor: string;
  onClick: () => void; wide?: boolean; disabled?: boolean; onDisabledTap?: () => void;
}) {
  const handleClick = () => {
    if (disabled) { onDisabledTap?.(); return; }
    onClick();
  };
  return (
    <button
      onClick={handleClick}
      className={`${wide ? "col-span-2" : ""} flex ${wide ? "flex-row items-center gap-5 px-6" : "flex-col items-center justify-center gap-2 py-6"} rounded-2xl transition-transform`}
      style={{
        background: disabled ? T.bg : bg,
        border: disabled ? "1.5px solid #E2E8F0" : border,
        borderRadius: 16,
        minHeight: wide ? 80 : 120,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span style={{ fontSize: wide ? 32 : 40, filter: disabled ? "grayscale(1)" : "none" }}>{emoji}</span>
      <div className={wide ? "text-left flex-1" : "text-center"}>
        <p style={{ fontSize: 18, fontWeight: 700, color: disabled ? T.muted : textColor }}>{label}</p>
        <p style={{ fontSize: 14, color: disabled ? T.muted : textColor, opacity: 0.75, marginTop: 3 }}>{sub}</p>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();
  const { setAuthSiteId, authSiteId, attendanceLogs } = useAppContext();

  const [step, setStep] = useState<Step>("site");
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [selectedSite, setSelectedSite] = useState<{ id: string; name: string; address: string; color: string } | null>(null);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [toggles, setToggles] = useState<FeatureToggles>(ALL_ON);

  const today = new Date().toISOString().slice(0, 10);
  const activeCount = selectedSite
    ? countActiveStaff(attendanceLogs, selectedSite.id, today)
    : 0;

  // 現場データ読み込み（完工していないもののみ）
  const loadSites = useCallback(() => {
    setLoadingSites(true);
    fetch("/api/kaitai/sites", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          const activeSites = (d.sites as Site[]).filter(
            s => !DONE_STATUSES.includes(s.status)
          );
          setSites(activeSites);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSites(false));
  }, []);

  useEffect(() => { loadSites(); }, [loadSites]);

  // Feature toggles の読み込み
  useEffect(() => {
    fetch("/api/kaitai/company/toggles")
      .then(r => r.json())
      .then(d => { if (d.ok) setToggles(d.toggles); })
      .catch(() => {});
  }, []);

  // 前回の認証が有効なら PIN をスキップして直接アクション画面へ
  useEffect(() => {
    if (authSiteId && sites.length > 0) {
      const site = sites.find(s => s.id === authSiteId);
      if (site) {
        const idx = sites.indexOf(site);
        setSelectedSite({ ...site, color: SITE_COLORS[idx % SITE_COLORS.length] });
        setStep("action");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites]);

  function showSnackbar(msg: string) {
    setSnackbar(msg);
    setTimeout(() => setSnackbar(""), 2500);
  }

  // PIN認証（APIで検証）
  useEffect(() => {
    if (pin.length < 4) return;
    fetch("/api/kaitai/auth/verify-pin", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    })
      .then(r => {
        if (r.ok) {
          setAuthSiteId(selectedSite?.id ?? null);
          setTimeout(() => setStep("action"), 150);
        } else {
          setShake(true);
          setErrorMsg("パスワードが違います");
          setTimeout(() => { setShake(false); setPin(""); setErrorMsg(""); }, 700);
        }
      })
      .catch(() => {
        setShake(true);
        setErrorMsg("通信エラー");
        setTimeout(() => { setShake(false); setPin(""); setErrorMsg(""); }, 700);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function handleKey(key: string) {
    if (key === "⌫") {
      setPin(p => p.slice(0, -1));
      setErrorMsg("");
    } else if (pin.length < 4) {
      setPin(p => p + key);
    }
  }

  const siteQs = `site=${selectedSite?.id}&name=${encodeURIComponent(selectedSite?.name ?? "")}`;

  // ── Step: site selection ─────────────────────────────────────────────────
  if (step === "site") {
    return (
      <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">

        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>報告</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: C.sub }}>報告する現場を選択してください</p>
        </div>

        {loadingSites ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 size={20} className="animate-spin" style={{ color: T.muted }} />
            <span style={{ fontSize: 14, color: T.muted }}>現場を読み込み中...</span>
          </div>
        ) : sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3"
            style={{ background: T.bg, borderRadius: 16, border: `1.5px dashed ${T.border}` }}>
            <span style={{ fontSize: 36 }}>🏗</span>
            <p style={{ fontSize: 15, fontWeight: 700, color: T.sub }}>報告可能な現場がありません</p>
            <p style={{ fontSize: 13, color: T.muted, textAlign: "center", lineHeight: 1.6 }}>
              管理者画面の「現場管理」で<br />現場を登録してください
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
            {sites.map((site, idx) => {
              const color = SITE_COLORS[idx % SITE_COLORS.length];
              return (
                <button
                  key={site.id}
                  onClick={() => {
                    setSelectedSite({ ...site, color });
                    setStep("pin");
                  }}
                  className="flex items-center gap-4 text-left active:scale-[0.98] transition-all cursor-pointer"
                  style={{
                    background: C.card,
                    border: `1.5px solid ${color}40`,
                    borderRadius: 16,
                    boxShadow: `0 2px 12px ${color}12`,
                    padding: "20px",
                    minHeight: 120,
                  }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0 rounded-xl"
                    style={{ width: 48, height: 48, background: `${color}12` }}
                  >
                    <MapPin size={22} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{site.name}</p>
                    <p style={{ fontSize: 14, marginTop: 4, color: C.sub }}>{site.address}</p>
                    {site.status && (
                      <span style={{
                        display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 600,
                        padding: "3px 10px", borderRadius: 20,
                        background: `${color}12`, color, border: `1px solid ${color}30`,
                      }}>
                        {site.status}
                      </span>
                    )}
                  </div>
                  <div className="rounded-full flex-shrink-0" style={{ width: 10, height: 10, background: color }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Step: PIN entry ──────────────────────────────────────────────────────
  if (step === "pin") {
    return (
      <div
        className="max-w-sm mx-auto flex flex-col"
        style={{ minHeight: "100dvh", background: "#111111" }}
      >
        {/* Back */}
        <div className="px-5 pt-10 pb-2 flex items-center gap-3">
          <button
            onClick={() => { setStep("site"); setPin(""); setErrorMsg(""); }}
            className="flex items-center justify-center rounded-2xl"
            style={{ width: 44, height: 44, background: "rgba(255,255,255,0.1)" }}
          >
            <ChevronLeft size={22} color={T.surface} />
          </button>
          <div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>報告先</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: T.surface }}>{selectedSite?.name}</p>
          </div>
        </div>

        {/* Title + dots */}
        <div className="flex flex-col items-center pt-8 pb-4">
          <p style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 32 }}>
            パスワードを入力
          </p>

          <div
            className="flex gap-5"
            style={{ animation: shake ? "shake 0.45s ease" : "none" }}
          >
            {[0,1,2,3].map(i => (
              <div
                key={i}
                style={{
                  width: 20, height: 20, borderRadius: 10,
                  background: i < pin.length
                    ? (errorMsg ? "#EF4444" : C.amber)
                    : "rgba(255,255,255,0.2)",
                  border: i < pin.length ? "none" : "2px solid rgba(255,255,255,0.35)",
                  transition: "background 0.15s",
                }}
              />
            ))}
          </div>

          <p style={{
            fontSize: 14, fontWeight: 700,
            color: "#EF4444",
            marginTop: 20,
            minHeight: 20,
            opacity: errorMsg ? 1 : 0,
            transition: "opacity 0.2s",
          }}>
            {errorMsg || "\u3000"}
          </p>
        </div>

        {/* Numpad */}
        <div
          className="flex-1 grid grid-cols-3 px-6 pb-8"
          style={{ gap: 12, alignContent: "center" }}
        >
          {PAD_KEYS.map((key, idx) => {
            if (key === "") return <div key={idx} />;
            const isBack = key === "⌫";
            return (
              <button
                key={idx}
                onClick={() => handleKey(key)}
                className="flex items-center justify-center rounded-3xl active:scale-95 transition-transform select-none"
                style={{
                  height: 76,
                  background: isBack ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.12)",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  fontSize: isBack ? 22 : 32,
                  fontWeight: 700,
                  color: T.surface,
                }}
              >
                {isBack ? <Delete size={26} color={T.surface} /> : key}
              </button>
            );
          })}
        </div>

        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            15%{transform:translateX(-12px)}
            30%{transform:translateX(12px)}
            45%{transform:translateX(-10px)}
            60%{transform:translateX(10px)}
            75%{transform:translateX(-6px)}
            90%{transform:translateX(6px)}
          }
        `}</style>
      </div>
    );
  }

  // ── Step: action selection ────────────────────────────────────────────────
  return (
    <div className="py-6 flex flex-col gap-6 pb-28 md:pb-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setStep("site"); setPin(""); }}
          className="flex items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
          style={{ width: 44, height: 44, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}
        >
          <ChevronLeft size={20} style={{ color: C.sub }} />
        </button>
        <div>
          <p style={{ fontSize: 14, color: C.muted }}>認証済み</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{selectedSite?.name}</p>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>何を報告しますか？</h2>
        <p style={{ fontSize: 14, marginTop: 4, color: C.sub }}>作業内容を選択してください</p>
      </div>

      {/* Active staff indicator */}
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: activeCount > 0 ? "#10B981" : T.muted }}
        />
        <span style={{ fontSize: 14, color: activeCount > 0 ? "#166534" : T.muted, fontWeight: 600 }}>
          現在 出勤中: {activeCount}名
        </span>
      </div>

      {/* ── 出退勤セクション ── */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 10 }}>
          出退勤
        </p>
        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          {toggles.clockIn && (
            <ActionTile
              emoji="🏁"
              label="出勤"
              sub="出勤を記録"
              bg="#F0FDF4"
              border="1.5px solid #BBF7D0"
              textColor="#166534"
              onClick={() => router.push(`/kaitai/report/start?${siteQs}`)}
            />
          )}
          {toggles.break && (
            <ActionTile
              emoji="☕️"
              label="休憩"
              sub="入り・戻り"
              bg="#EFF6FF"
              border="1.5px solid #BFDBFE"
              textColor="#1E40AF"
              disabled={activeCount === 0}
              onDisabledTap={() => showSnackbar("現在、出勤中のスタッフがいません")}
              onClick={() => router.push(`/kaitai/report/break?${siteQs}`)}
            />
          )}
          {toggles.clockOut && (
            <ActionTile
              emoji="🚪"
              label="退勤"
              sub="退勤を記録"
              bg={T.primaryLt}
              border="1.5px solid #E5E7EB"
              textColor={T.primaryDk}
              disabled={activeCount === 0}
              onDisabledTap={() => showSnackbar("現在、出勤中のスタッフがいません")}
              onClick={() => router.push(`/kaitai/report/clockout?${siteQs}`)}
            />
          )}
        </div>
      </div>

      {/* ── 現場報告セクション ── */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 10 }}>
          現場報告
        </p>
        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          {toggles.report && (
            <ActionTile
              emoji="📋"
              label="報告"
              sub="機材チェック等"
              bg="#FFF7ED"
              border={`1.5px solid ${T.primaryMd}`}
              textColor={T.primaryDk}
              onClick={() => router.push(`/kaitai/report/daily?${siteQs}`)}
            />
          )}
          {toggles.waste && (
            <ActionTile
              emoji="🚛"
              label="廃材"
              sub="処理場比較"
              bg="#FEF3C7"
              border="1.5px solid #FDE68A"
              textColor="#92400E"
              onClick={() => router.push(`/kaitai/report/waste?${siteQs}`)}
            />
          )}
          {toggles.finish && (
            <ActionTile
              emoji="✅"
              label="終了"
              sub="終了報告"
              bg={T.bg}
              border={`1.5px solid ${C.border}`}
              textColor={C.text}
              onClick={() => router.push(`/kaitai/report/finish?${siteQs}`)}
            />
          )}
        </div>
      </div>

      {/* ── その他 ── */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 10 }}>
          その他
        </p>
        <div className="grid grid-cols-1 gap-4 max-w-2xl">
          <ActionTile
            emoji="⚠️"
            label="イレギュラー報告"
            sub="事故・設備破損・クレームなど"
            bg="#FEF2F2"
            border="1.5px solid #FECACA"
            textColor="#991B1B"
            onClick={() => router.push(`/kaitai/report/irregular?${siteQs}`)}
            wide
          />
          <ActionTile
            emoji="💴"
            label="経費報告"
            sub="燃料・工具・資材・交通費などを報告"
            bg="#F0FDF4"
            border="1.5px solid #BBF7D0"
            textColor="#166534"
            onClick={() => router.push(`/kaitai/report/expense?${siteQs}`)}
            wide
          />
          <ActionTile
            emoji="🖊️"
            label="写真マーキング"
            sub="写真に危険・残置物などを意味付きペンで記録"
            bg="#EFF6FF"
            border="1.5px solid #BFDBFE"
            textColor="#1E40AF"
            onClick={() => router.push(`/kaitai/report/photo-mark?${siteQs}`)}
            wide
          />
        </div>
      </div>

      {/* Snackbar */}
      {snackbar && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl z-50 pointer-events-none"
          style={{
            background: T.text,
            color: T.surface,
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          ⚠️ {snackbar}
        </div>
      )}
    </div>
  );
}
