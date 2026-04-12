"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, MapPin, Calendar, Users, Clock,
  Truck, Camera, FileText, ChevronRight, ChevronDown, ChevronUp,
  X, AlertTriangle, Shield, Phone, ExternalLink,
  Zap, Flame, Droplets, Trash2, AlertCircle,
  ParkingSquare, HardHat, Megaphone, Package,
  ClipboardList, Fuel, CircleStop, FolderOpen,
  Image as ImageIcon, ZoomIn, Pencil,
  CheckCircle, DollarSign, Wrench,
} from "lucide-react";
import { T } from "../../lib/design-tokens";

// ─── Types ───────────────────────────────────────────────────────────────────

type TabKey = "basic" | "history" | "docs";

type SiteData = {
  id: string;
  name: string;
  address: string;
  status: string;
  startDate: string;
  endDate: string;
  progressPct: number;
  contractAmount: number;
  paidAmount: number;
  costAmount: number;
  structureType: string;
  notes: string;
  lat: number | null;
  lng: number | null;
  clientId: string | null;
};

type ContractData = {
  clientName: string;
  clientContact: string;
  projectName: string;
  notes: string;
};

type OperationLog = {
  id: string;
  action: string;
  user: string;
  siteId: string | null;
  imageIds?: string[];
  createdAt: string;
};

type SiteImage = {
  id: string;
  url: string;
  reportType: string;
  uploadedBy: string;
  createdAt: string;
};

type ClientData = {
  id: string;
  name: string;
  contactName: string;
  phone: string;
};

// ─── Lifeline / Safety types ─────────────────────────────────────────────────

type LifelineStatus = "removed" | "pending" | "warning" | "unknown";
type AsbestosInfo = { found: boolean; level: string | null };

type SiteNotes = {
  lifelines?: {
    electric?: LifelineStatus;
    gas?: LifelineStatus;
    water?: LifelineStatus;
    septic?: LifelineStatus;
  };
  asbestos?: AsbestosInfo;
  workOverview?: string;
  remainingItems?: { text: string; imageUrl?: string | null }[];
  neighborNotes?: string[];
  parkingInstructions?: string;
  recommendedProcessors?: string;
  salesPerson?: string;
  salesPhone?: string;
  handoverNote?: string;
};

const DOC_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  estimate:    { label: "見積書",         emoji: "📋" },
  invoice:     { label: "請求書",         emoji: "💴" },
  receipt:     { label: "領収書",         emoji: "🧾" },
  completion:  { label: "工事完了報告書", emoji: "✅" },
  report:      { label: "作業報告書",     emoji: "📊" },
  demolition:  { label: "建物滅失証明書", emoji: "🏚" },
  photo_album: { label: "写真台帳",       emoji: "📸" },
};

function parseSiteNotes(raw: string | null | undefined): SiteNotes {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) return parsed as SiteNotes;
  } catch { /* not JSON, return empty */ }
  return {};
}

// ─── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  "調査・見積":     { label: "調査・見積",     bg: "rgba(107,114,128,0.1)", fg: "#6B7280" },
  "契約・申請":     { label: "契約・申請",     bg: "rgba(99,102,241,0.1)",  fg: "#6366F1" },
  "近隣挨拶・養生": { label: "近隣挨拶・養生", bg: "rgba(59,130,246,0.1)",  fg: "#3B82F6" },
  "着工・内装解体": { label: "着工・内装解体", bg: T.primaryLt,             fg: T.primaryDk },
  "上屋解体・基礎": { label: "上屋解体・基礎", bg: "rgba(180,83,9,0.12)",   fg: "#B45309" },
  "完工・更地確認": { label: "完工・更地確認", bg: "rgba(16,185,129,0.1)",  fg: "#10B981" },
  "産廃書類完了":   { label: "産廃書類完了",   bg: "rgba(13,148,136,0.1)",  fg: "#0D9488" },
  "入金確認":       { label: "入金確認",       bg: "rgba(5,150,105,0.1)",   fg: "#059669" },
  // Legacy
  "着工前":   { label: "着工前", bg: "#EFF6FF", fg: "#1D4ED8" },
  "施工中":   { label: "施工中", bg: T.primaryLt, fg: T.primaryDk },
  "解体中":   { label: "解体中", bg: T.primaryLt, fg: T.primaryDk },
  "完工":     { label: "完工",   bg: "#F0FDF4", fg: "#16A34A" },
};

function getStatusCfg(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, bg: T.bg, fg: T.sub };
}

// ─── Lifeline badge config ──────────────────────────────────────────────────

const LIFELINE_CONFIG = {
  electric: { label: "電気", icon: Zap },
  gas:      { label: "ガス", icon: Flame },
  water:    { label: "水道", icon: Droplets },
  septic:   { label: "浄化槽", icon: Trash2 },
} as const;

const LIFELINE_STATUS_STYLE: Record<LifelineStatus, { label: string; bg: string; fg: string; border: string }> = {
  removed: { label: "撤去済", bg: "#F0FDF4", fg: "#059669", border: "#BBF7D0" },
  pending: { label: "手配中", bg: "#FFFBEB", fg: "#B45309", border: "#FDE68A" },
  warning: { label: "要注意", bg: "#FEF2F2", fg: "#DC2626", border: "#FECACA" },
  unknown: { label: "未確認", bg: "#F3F4F6", fg: "#6B7280", border: "#D1D5DB" },
};

// ─── Operation log parsing ──────────────────────────────────────────────────

type ParsedLog = {
  id: string;
  date: string;
  dateLabel: string;
  time: string;
  user: string;
  type: string;
  typeLabel: string;
  typeColor: string;
  typeBg: string;
  detail: string;
  isHandover: boolean;
  imageIds: string[];
};

type ReactionData = {
  id: string;
  logId: string;
  status: string;
  comment: string | null;
  adminName: string;
  createdAt: string;
};

const REACTION_BADGE: Record<string, { label: string; bg: string; fg: string; border: string }> = {
  confirmed:       { label: "確認済",   bg: "#F3F4F6", fg: "#4B5563", border: "#D1D5DB" },
  approved:        { label: "承 認",   bg: "#EFF6FF", fg: "#1D4ED8", border: "#BFDBFE" },
  action_required: { label: "要対応",   bg: "#FEF2F2", fg: "#DC2626", border: "#FECACA" },
  call_required:   { label: "電話連絡", bg: "#1F2937", fg: "#FFFFFF", border: "#374151" },
};

function parseOperationLog(log: OperationLog): ParsedLog {
  const d = new Date(log.createdAt);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const dateLabel = `${d.getMonth() + 1}/${d.getDate()}（${dow}）`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const action = log.action;
  let type: string = "other";
  let typeLabel: string = "操作";
  let typeColor: string = T.sub;
  let typeBg: string = T.bg;
  let detail: string = action;
  let isHandover = false;

  if (action.startsWith("start:")) {
    type = "start";
    typeLabel = "出勤打刻";
    typeColor = "#10B981";
    typeBg = "rgba(16,185,129,0.08)";
    detail = action.replace("start:", "").trim();
  } else if (action.startsWith("clockout:")) {
    type = "clockout";
    typeLabel = "退勤打刻";
    typeColor = "#6366F1";
    typeBg = "rgba(99,102,241,0.08)";
    detail = action.replace("clockout:", "").trim();
  } else if (action.startsWith("break_in:") || action.startsWith("break_out:")) {
    type = "break";
    typeLabel = action.startsWith("break_in") ? "休憩開始" : "休憩終了";
    typeColor = "#8B5CF6";
    typeBg = "rgba(139,92,246,0.08)";
    detail = action.replace(/break_(in|out):/, "").trim();
  } else if (action.startsWith("waste_dispatch:")) {
    type = "waste";
    typeLabel = "廃材搬出";
    typeColor = T.primary;
    typeBg = T.primaryLt;
    detail = action.replace("waste_dispatch:", "").trim();
  } else if (action.startsWith("expense_log:") || action.startsWith("fuel_log:")) {
    type = "expense";
    typeLabel = action.startsWith("fuel") ? "燃料報告" : "経費報告";
    typeColor = "#0EA5E9";
    typeBg = "rgba(14,165,233,0.08)";
    detail = action.replace(/^(expense_log|fuel_log):/, "").trim();
  } else if (action.startsWith("daily_report:")) {
    type = "daily";
    typeLabel = "機材チェック";
    typeColor = "#3B82F6";
    typeBg = "rgba(59,130,246,0.08)";
    detail = action.replace("daily_report:", "").trim();
    isHandover = detail.includes("引き継ぎ") || detail.includes("引継ぎ") || detail.includes("申し送り");
  } else if (action.startsWith("finish:")) {
    type = "finish";
    typeLabel = "作業終了報告";
    typeColor = "#059669";
    typeBg = "rgba(5,150,105,0.08)";
    detail = action.replace("finish:", "").trim();
  } else if (action.startsWith("irregular")) {
    type = "irregular";
    typeLabel = "異常報告";
    typeColor = "#EF4444";
    typeBg = "rgba(239,68,68,0.08)";
    // Handle irregular[要対応]: format
    const irregMatch = action.match(/^irregular\[(.+?)\]:\s*(.+)/);
    if (irregMatch) {
      detail = irregMatch[2];
    } else {
      detail = action.replace(/^irregular[_:]?/, "").trim();
    }
  } else if (action.startsWith("site_create:")) {
    type = "system";
    typeLabel = "現場登録";
    typeColor = "#6B7280";
    typeBg = "rgba(107,114,128,0.08)";
    detail = action.replace("site_create:", "").trim();
  } else if (action.startsWith("image_upload:") || action.startsWith("photo_upload:")) {
    type = "photo";
    typeLabel = "写真UP";
    typeColor = "#8B5CF6";
    typeBg = "rgba(139,92,246,0.08)";
    detail = action.replace(/^(image_upload|photo_upload):/, "").trim();
  } else if (action.startsWith("site_update:") || action.startsWith("site_edit:")) {
    type = "system";
    typeLabel = "現場更新";
    typeColor = "#6B7280";
    typeBg = "rgba(107,114,128,0.08)";
    detail = action.replace(/^(site_update|site_edit):/, "").trim();
  }

  // Strip site name prefix from detail (e.g. "ジョーズ / 機材チェック完了" → "機材チェック完了")
  detail = detail.replace(/^[^\s/]+\s*\/\s*/, "");

  return { id: log.id, date: dateStr, dateLabel, time, user: log.user, type, typeLabel, typeColor, typeBg, detail, isHandover, imageIds: Array.isArray(log.imageIds) ? log.imageIds : [] };
}

// ─── Accordion component ────────────────────────────────────────────────────

function Accordion({
  title, icon: Icon, iconColor, defaultOpen, danger, children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  iconColor: string;
  defaultOpen?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "#fff",
        border: `1px solid ${danger && open ? "#FECACA" : T.border}`,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 text-left"
        style={{
          padding: "16px 20px",
          minHeight: 56,
          background: danger ? "rgba(239,68,68,0.03)" : "transparent",
        }}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-lg"
          style={{ width: 36, height: 36, background: `${iconColor}14` }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: T.text }}>
          {title}
        </span>
        {open
          ? <ChevronUp size={18} style={{ color: T.muted }} />
          : <ChevronDown size={18} style={{ color: T.muted }} />
        }
      </button>
      {open && (
        <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ paddingTop: 16 }}>{children}</div>
        </div>
      )}
    </div>
  );
}

// ─── Fullscreen Image Viewer ────────────────────────────────────────────────

function ImageViewer({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full"
        style={{ width: 44, height: 44, background: "rgba(255,255,255,0.2)" }}
      >
        <X size={22} style={{ color: "#fff" }} />
      </button>
      <img
        src={url}
        alt=""
        className="max-w-full max-h-full object-contain"
        style={{ touchAction: "pinch-zoom" }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Tab 1: Basic & Safety ──────────────────────────────────────────────────

function TabBasic({
  site, contract, client, notes, reactions, logs, docIssues,
}: {
  site: SiteData;
  contract: ContractData | null;
  client: ClientData | null;
  notes: SiteNotes;
  reactions: Map<string, ReactionData>;
  logs: ParsedLog[];
  docIssues: { docType: string; issuedAt: string }[];
}) {
  const cfg = getStatusCfg(site.status);
  const lifelines = notes.lifelines ?? {};
  const asbestos = notes.asbestos ?? { found: false, level: null };

  const googleMapsUrl = site.lat && site.lng
    ? `https://www.google.com/maps?q=${site.lat},${site.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(site.address)}`;

  // Determine if any lifeline is warning
  const hasLifelineWarning = Object.values(lifelines).some(v => v === "warning");
  const hasAsbestosWarning = asbestos.found;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Site header card ── */}
      <div className="rounded-xl" style={{ background: "#fff", border: `1px solid ${T.border}`, padding: "20px" }}>
        {/* Status badge */}
        <span
          className="inline-block font-bold px-3 py-1.5 rounded-full mb-3"
          style={{ fontSize: 14, background: cfg.bg, color: cfg.fg }}
        >
          {cfg.label}
        </span>

        {/* Site name */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: T.heading, lineHeight: 1.3, marginBottom: 10 }}>
          {site.name}
        </h2>

        {/* Address + Map button */}
        <div className="flex items-start gap-2 mb-4">
          <MapPin size={16} style={{ color: T.sub, flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 16, color: T.sub, flex: 1 }}>{site.address}</span>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-2 rounded-lg flex-shrink-0"
            style={{
              fontSize: 13, fontWeight: 700,
              background: "#EFF6FF", color: "#2563EB",
              border: "1px solid #BFDBFE",
              textDecoration: "none",
            }}
          >
            <ExternalLink size={13} /> 地図
          </a>
        </div>

        {/* Dates */}
        {(site.startDate || site.endDate) && (
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={15} style={{ color: T.muted }} />
            <span style={{ fontSize: 16, color: T.sub }}>
              {site.startDate?.replace(/-/g, "/")} 〜 {site.endDate?.replace(/-/g, "/")}
            </span>
          </div>
        )}

        {/* Progress bar */}
        {site.progressPct > 0 && (
          <div>
            <div className="flex justify-between mb-2">
              <span style={{ fontSize: 14, color: T.sub }}>工事進捗</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{site.progressPct}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: T.bg }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${site.progressPct}%`,
                  background: `linear-gradient(90deg, ${T.primary}, ${T.primaryDk})`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 📄 Issued documents ── */}
      {docIssues.length > 0 && (
        <div style={{ padding: "0 20px", marginBottom: 16 }}>
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} style={{ color: T.sub }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>発行済み帳票</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(() => {
              // Group by docType, show latest date for each
              const byType = new Map<string, { count: number; latestAt: string }>();
              for (const iss of docIssues) {
                const existing = byType.get(iss.docType);
                if (!existing || new Date(iss.issuedAt) > new Date(existing.latestAt)) {
                  byType.set(iss.docType, {
                    count: (existing?.count ?? 0) + 1,
                    latestAt: iss.issuedAt,
                  });
                } else {
                  byType.set(iss.docType, { ...existing, count: existing.count + 1 });
                }
              }
              return Array.from(byType.entries()).map(([docType, info]) => {
                const meta = DOC_TYPE_LABELS[docType] ?? { label: docType, emoji: "📄" };
                const d = new Date(info.latestAt);
                const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                return (
                  <div
                    key={docType}
                    style={{
                      fontSize: 12, fontWeight: 600,
                      background: "#F0FDF4",
                      color: "#16A34A",
                      border: "1px solid rgba(22,163,106,0.2)",
                      borderRadius: 10,
                      padding: "6px 10px",
                      lineHeight: 1.5,
                    }}
                  >
                    <span>{meta.emoji} {meta.label}</span>
                    {info.count > 1 && <span style={{ color: "#15803D", marginLeft: 3 }}>×{info.count}</span>}
                    <span style={{ color: "#6B7280", marginLeft: 6, fontSize: 11, fontWeight: 500 }}>{dateStr}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ── 🚨 Alert notices from admin reactions (until next finish report) ── */}
      {(() => {
        // Find the latest finish report timestamp
        const latestFinish = logs
          .filter(l => l.type === "finish")
          .sort((a, b) => new Date(b.date + " " + b.time).getTime() - new Date(a.date + " " + a.time).getTime())[0];
        const finishTime = latestFinish ? new Date(latestFinish.date + "T" + latestFinish.time).getTime() : 0;

        const alertReactions = Array.from(reactions.entries())
          .filter(([logId, r]) => {
            if (r.status !== "action_required" && r.status !== "call_required") return false;
            // Only show if the reacted log was AFTER the latest finish report
            const log = logs.find(l => l.id === logId);
            if (!log) return false;
            const logTime = new Date(log.date + "T" + log.time).getTime();
            return logTime >= finishTime;
          })
          .map(([logId, r]) => {
            const log = logs.find(l => l.id === logId);
            return { ...r, log };
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (alertReactions.length === 0) return null;

        return (
          <div className="flex flex-col gap-3">
            {alertReactions.map((alert) => {
              const isCall = alert.status === "call_required";
              const cfg = REACTION_BADGE[alert.status];
              return (
                <div
                  key={alert.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: isCall ? "#1F2937" : "#FEF2F2",
                    border: `2px solid ${isCall ? "#374151" : "#FECACA"}`,
                  }}
                >
                  <div
                    className="flex items-center gap-3"
                    style={{ padding: "14px 16px" }}
                  >
                    {isCall ? (
                      <Phone size={20} style={{ color: "#FBBF24", flexShrink: 0 }} />
                    ) : (
                      <AlertCircle size={20} style={{ color: "#DC2626", flexShrink: 0 }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2 py-0.5 rounded-md font-bold"
                          style={{
                            fontSize: 12,
                            background: cfg?.bg, color: cfg?.fg,
                            border: `1px solid ${cfg?.border}`,
                          }}
                        >
                          {cfg?.label}
                        </span>
                        <span style={{ fontSize: 12, color: isCall ? "rgba(255,255,255,0.5)" : T.muted }}>
                          管理者: {alert.adminName}
                        </span>
                      </div>
                      {alert.log && (
                        <p style={{
                          fontSize: 14, fontWeight: 700,
                          color: isCall ? "#FFFFFF" : "#991B1B",
                          marginBottom: alert.comment ? 4 : 0,
                        }}>
                          {alert.log.typeLabel} — {alert.log.detail}
                        </p>
                      )}
                      {alert.comment && (
                        <p style={{
                          fontSize: 14, lineHeight: 1.5,
                          color: isCall ? "rgba(255,255,255,0.85)" : "#B91C1C",
                        }}>
                          💬 {alert.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Contacts / stakeholders ── */}
      <Accordion title="関係者情報" icon={Users} iconColor="#3B82F6" defaultOpen>
        <div className="flex flex-col gap-3">
          {/* Client */}
          {(contract?.clientName || client?.name) && (
            <div className="flex items-center justify-between py-3 px-4 rounded-lg" style={{ background: T.bg }}>
              <div>
                <p style={{ fontSize: 13, color: T.muted, marginBottom: 2 }}>施主・元請</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                  {contract?.clientName || client?.name || "—"}
                </p>
                {(contract?.clientContact || client?.contactName) && (
                  <p style={{ fontSize: 14, color: T.sub, marginTop: 2 }}>
                    担当: {contract?.clientContact || client?.contactName}
                  </p>
                )}
              </div>
              {client?.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 48, height: 48,
                    background: "#10B981", color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  <Phone size={20} />
                </a>
              )}
            </div>
          )}

          {/* Sales person */}
          {notes.salesPerson && (
            <div className="flex items-center justify-between py-3 px-4 rounded-lg" style={{ background: T.bg }}>
              <div>
                <p style={{ fontSize: 13, color: T.muted, marginBottom: 2 }}>自社担当営業</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{notes.salesPerson}</p>
              </div>
              {notes.salesPhone && (
                <a
                  href={`tel:${notes.salesPhone}`}
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 48, height: 48,
                    background: "#3B82F6", color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  <Phone size={20} />
                </a>
              )}
            </div>
          )}

          {!contract?.clientName && !client?.name && !notes.salesPerson && (
            <p style={{ fontSize: 15, color: T.muted, textAlign: "center", padding: "12px 0" }}>
              関係者情報は未設定です
            </p>
          )}
        </div>
      </Accordion>

      {/* ── 🚨 Lifeline / Safety badges (CRITICAL) ── */}
      <Accordion
        title="安全・ライフライン確認"
        icon={Shield}
        iconColor={hasLifelineWarning || hasAsbestosWarning ? "#DC2626" : "#10B981"}
        defaultOpen
        danger={hasLifelineWarning || hasAsbestosWarning}
      >
        <div className="flex flex-col gap-4">
          {/* Lifeline badges */}
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LIFELINE_CONFIG) as Array<keyof typeof LIFELINE_CONFIG>).map(key => {
              const cfg = LIFELINE_CONFIG[key];
              const status = lifelines[key] ?? "unknown";
              const style = LIFELINE_STATUS_STYLE[status];
              const Icon = cfg.icon;
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl"
                  style={{
                    padding: "14px 16px",
                    background: style.bg,
                    border: `2px solid ${style.border}`,
                    minHeight: 56,
                  }}
                >
                  <Icon size={20} style={{ color: style.fg, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 700, color: style.fg }}>{cfg.label}</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: style.fg }}>{style.label}</p>
                  </div>
                  {status === "warning" && (
                    <AlertCircle size={20} style={{ color: "#DC2626", flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Asbestos */}
          <div
            className="flex items-center gap-3 rounded-xl"
            style={{
              padding: "16px",
              background: asbestos.found ? "#FEF2F2" : "#F0FDF4",
              border: `2px solid ${asbestos.found ? "#FECACA" : "#BBF7D0"}`,
              minHeight: 56,
            }}
          >
            <AlertTriangle
              size={22}
              style={{ color: asbestos.found ? "#DC2626" : "#059669", flexShrink: 0 }}
            />
            <div className="flex-1">
              <p style={{ fontSize: 14, fontWeight: 700, color: asbestos.found ? "#DC2626" : "#059669" }}>
                アスベスト事前調査
              </p>
              <p style={{
                fontSize: 18, fontWeight: 800,
                color: asbestos.found ? "#DC2626" : "#059669",
              }}>
                {asbestos.found
                  ? `あり${asbestos.level ? `（レベル${asbestos.level}）` : ""}`
                  : "なし"
                }
              </p>
            </div>
            {asbestos.found && (
              <div
                className="px-3 py-1 rounded-full"
                style={{ background: "#DC2626", color: "#fff", fontSize: 12, fontWeight: 800 }}
              >
                危険
              </div>
            )}
          </div>
        </div>
      </Accordion>

      {/* ── Work overview ── */}
      <Accordion title="作業概要・大まかな流れ" icon={ClipboardList} iconColor={T.primary}>
        {notes.workOverview ? (
          <p style={{ fontSize: 16, color: T.text, lineHeight: 1.8 }}>
            {notes.workOverview}
          </p>
        ) : (
          <p style={{ fontSize: 15, color: T.muted, textAlign: "center", padding: "8px 0" }}>
            作業概要は未設定です
          </p>
        )}
      </Accordion>

      {/* ── 🚧 Remaining items (don't destroy) ── */}
      <Accordion title="壊してはいけないもの（残置物）" icon={Package} iconColor="#EF4444" danger>
        {notes.remainingItems && notes.remainingItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            {notes.remainingItems.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg"
                style={{
                  padding: "14px 16px",
                  background: "#FEF2F2",
                  border: "1.5px solid #FECACA",
                }}
              >
                <AlertCircle size={18} style={{ color: "#DC2626", flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1">
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#991B1B", lineHeight: 1.5 }}>
                    {item.text}
                  </p>
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.text}
                      className="mt-2 rounded-lg"
                      style={{ maxWidth: "100%", maxHeight: 200, objectFit: "cover" }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 15, color: T.muted, textAlign: "center", padding: "8px 0" }}>
            残置物の指定はありません
          </p>
        )}
      </Accordion>

      {/* ── ⚠️ Neighbor notes ── */}
      <Accordion title="近隣の注意事項" icon={Megaphone} iconColor="#F59E0B">
        {notes.neighborNotes && notes.neighborNotes.length > 0 ? (
          <div className="flex flex-col gap-2">
            {notes.neighborNotes.map((note, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg"
                style={{
                  padding: "14px 16px",
                  background: "#FFFBEB",
                  border: "1.5px solid #FDE68A",
                }}
              >
                <AlertTriangle size={16} style={{ color: "#B45309", flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 16, color: "#92400E", lineHeight: 1.6, fontWeight: 600 }}>
                  {note}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 15, color: T.muted, textAlign: "center", padding: "8px 0" }}>
            近隣注意事項は未設定です
          </p>
        )}
      </Accordion>

      {/* ── 🅿️ Parking / processor instructions ── */}
      <Accordion title="駐車・処分場指示" icon={ParkingSquare} iconColor="#6366F1">
        {notes.parkingInstructions || notes.recommendedProcessors ? (
          <div className="flex flex-col gap-3">
            {notes.parkingInstructions && (
              <div className="rounded-lg" style={{ padding: "14px 16px", background: T.bg, border: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 13, color: T.muted, fontWeight: 600, marginBottom: 4 }}>
                  🅿️ 駐車・待機位置
                </p>
                <p style={{ fontSize: 16, color: T.text, lineHeight: 1.6 }}>
                  {notes.parkingInstructions}
                </p>
              </div>
            )}
            {notes.recommendedProcessors && (
              <div className="rounded-lg" style={{ padding: "14px 16px", background: T.bg, border: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 13, color: T.muted, fontWeight: 600, marginBottom: 4 }}>
                  🏭 推奨処分場
                </p>
                <p style={{ fontSize: 16, color: T.text, lineHeight: 1.6 }}>
                  {notes.recommendedProcessors}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 15, color: T.muted, textAlign: "center", padding: "8px 0" }}>
            駐車・処分場指示は未設定です
          </p>
        )}
      </Accordion>
    </div>
  );
}

// ─── Report type icon mapping ──────────────────────────────────────────────

const REPORT_ICON_MAP: Record<string, { icon: typeof ClipboardList; color: string; bg: string }> = {
  start:     { icon: Clock,          color: "#10B981", bg: "rgba(16,185,129,0.08)" },
  clockout:  { icon: Clock,          color: "#6366F1", bg: "rgba(99,102,241,0.08)" },
  break:     { icon: Clock,          color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  daily:     { icon: Wrench,         color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  finish:    { icon: CheckCircle,    color: "#059669", bg: "rgba(5,150,105,0.08)" },
  expense:   { icon: DollarSign,     color: "#F97316", bg: "rgba(249,115,22,0.08)" },
  waste:     { icon: Truck,          color: "#14B8A6", bg: "rgba(20,184,166,0.08)" },
  irregular: { icon: AlertTriangle,  color: "#EF4444", bg: "rgba(239,68,68,0.08)" },
  system:    { icon: FileText,       color: "#6B7280", bg: "rgba(107,114,128,0.08)" },
  other:     { icon: FileText,       color: "#6B7280", bg: "rgba(107,114,128,0.08)" },
};

// ─── Tab 2: History & Reports ───────────────────────────────────────────────

function TabHistory({
  logs, siteId, images, reactions, onViewImage,
}: {
  logs: ParsedLog[];
  siteId: string;
  images: SiteImage[];
  reactions: Map<string, ReactionData>;
  onViewImage: (url: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Build image lookup map for fast access
  const imageMap = useMemo(() => {
    const map = new Map<string, SiteImage>();
    for (const img of images) map.set(img.id, img);
    return map;
  }, [images]);

  // Group logs by date
  const grouped: { date: string; dateLabel: string; items: ParsedLog[] }[] = [];
  for (const log of logs) {
    const existing = grouped.find(g => g.date === log.date);
    if (existing) {
      existing.items.push(log);
    } else {
      grouped.push({ date: log.date, dateLabel: log.dateLabel, items: [log] });
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-24">

      {/* Handover note highlight */}
      {logs.length > 0 && (() => {
        const handover = logs.find(l => l.isHandover);
        if (!handover) return null;
        return (
          <div
            className="rounded-xl"
            style={{
              padding: "16px 20px",
              background: "#FFFBEB",
              border: "2px solid #FDE68A",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <HardHat size={16} style={{ color: "#B45309" }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#92400E" }}>
                引き継ぎメモ（{handover.user}より）
              </span>
            </div>
            <p style={{ fontSize: 16, color: "#78350F", lineHeight: 1.7 }}>
              {handover.detail}
            </p>
          </div>
        );
      })()}

      {/* Report list card */}
      {logs.length > 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${T.border}` }}>
          {/* List header */}
          <div className="flex items-center justify-between px-4 py-2.5" style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>
              {logs.length}件の報告
            </span>
          </div>

          {/* Grouped by date */}
          {grouped.map((group) => (
            <div key={group.date}>
              {/* Date header */}
              <div className="px-4 py-2 sticky top-[110px] z-10" style={{ background: "rgba(248,250,252,0.95)", borderBottom: `1px solid ${T.border}`, backdropFilter: "blur(8px)" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.primary }}>
                  {(() => {
                    const d = new Date(group.date + "T00:00:00");
                    const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
                    return `${d.getMonth() + 1}月${d.getDate()}日（${dow}）`;
                  })()}
                </span>
                <span style={{ fontSize: 12, color: T.muted, marginLeft: 8 }}>{group.items.length}件</span>
              </div>

              {/* Report entries */}
              {group.items.map((log) => {
                const isExpanded = expandedId === log.id;
                const iconCfg = REPORT_ICON_MAP[log.type] ?? REPORT_ICON_MAP.other;
                const Icon = iconCfg.icon;
                const reaction = reactions.get(log.id);
                const hasAlert = reaction && (reaction.status === "action_required" || reaction.status === "call_required");

                return (
                  <div key={log.id}>
                    {/* List row */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors active:bg-gray-50"
                      style={{
                        borderBottom: `1px solid #F1F5F9`,
                        background: hasAlert
                          ? reaction.status === "call_required" ? "rgba(31,41,55,0.03)" : "rgba(239,68,68,0.03)"
                          : "transparent",
                      }}
                    >
                      {/* Icon */}
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: iconCfg.bg }}
                      >
                        <Icon size={18} style={{ color: iconCfg.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                            {log.typeLabel}
                          </span>
                          {log.imageIds.length > 0 && (
                            <span className="flex items-center gap-0.5" style={{ color: T.muted }}>
                              <ImageIcon size={12} />
                              <span style={{ fontSize: 11, fontWeight: 600 }}>{log.imageIds.length}</span>
                            </span>
                          )}
                          {reaction && (() => {
                            const cfg = REACTION_BADGE[reaction.status];
                            if (!cfg) return null;
                            const rd = new Date(reaction.createdAt);
                            const rTime = `${rd.getMonth()+1}/${rd.getDate()} ${String(rd.getHours()).padStart(2,"0")}:${String(rd.getMinutes()).padStart(2,"0")}`;
                            return (
                              <>
                                <span
                                  className="px-1.5 py-0.5 rounded"
                                  style={{
                                    fontSize: 11, fontWeight: 800,
                                    background: cfg.bg, color: cfg.fg,
                                    border: `1px solid ${cfg.border}`,
                                  }}
                                >
                                  {cfg.label}
                                </span>
                                <span style={{ fontSize: 10, color: T.muted }}>{rTime}</span>
                              </>
                            );
                          })()}
                        </div>
                        <p className="truncate" style={{ fontSize: 13, color: T.sub, maxWidth: "100%" }}>
                          {log.detail}
                        </p>
                      </div>

                      {/* Right side meta */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{log.user}</span>
                        <span style={{ fontSize: 11, color: T.muted }}>{log.time}</span>
                      </div>

                      <ChevronRight
                        size={16}
                        style={{
                          color: T.muted, flexShrink: 0,
                          transform: isExpanded ? "rotate(90deg)" : "none",
                          transition: "transform 0.15s",
                        }}
                      />
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: "12px 16px 16px",
                          background: "#FAFBFC",
                          borderBottom: `1px solid ${T.border}`,
                        }}
                      >
                        {/* Report detail */}
                        <p style={{ fontSize: 15, color: T.text, lineHeight: 1.7, wordBreak: "break-word", marginBottom: 8 }}>
                          {log.detail}
                        </p>

                        {/* Admin reaction / comment */}
                        {reaction && (
                          <div
                            className="rounded-lg"
                            style={{
                              padding: "10px 14px",
                              marginBottom: 10,
                              background: hasAlert
                                ? reaction.status === "call_required" ? "#1F2937" : "#FEF2F2"
                                : "#F8FAFC",
                              border: `1px solid ${
                                hasAlert
                                  ? reaction.status === "call_required" ? "#374151" : "#FECACA"
                                  : T.border
                              }`,
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {(() => {
                                const cfg = REACTION_BADGE[reaction.status];
                                if (!cfg) return null;
                                return (
                                  <span
                                    className="px-1.5 py-0.5 rounded"
                                    style={{
                                      fontSize: 11, fontWeight: 800,
                                      background: cfg.bg, color: cfg.fg,
                                      border: `1px solid ${cfg.border}`,
                                    }}
                                  >
                                    {cfg.label}
                                  </span>
                                );
                              })()}
                              <span style={{
                                fontSize: 12, fontWeight: 600,
                                color: reaction.status === "call_required" ? "rgba(255,255,255,0.6)" : T.muted,
                              }}>
                                管理者: {reaction.adminName}
                              </span>
                            </div>
                            {reaction.comment && (
                              <p style={{
                                fontSize: 14, lineHeight: 1.5,
                                color: reaction.status === "call_required" ? "rgba(255,255,255,0.9)" : T.text,
                              }}>
                                {reaction.comment}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Photo thumbnails */}
                        {log.imageIds.length > 0 && (() => {
                          const logImages = log.imageIds
                            .map(id => imageMap.get(id))
                            .filter((img): img is SiteImage => !!img);
                          if (logImages.length === 0) return null;
                          return (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {logImages.map(img => (
                                <button
                                  key={img.id}
                                  onClick={() => onViewImage(img.url)}
                                  className="rounded-lg overflow-hidden flex-shrink-0"
                                  style={{
                                    width: 72, height: 72,
                                    border: `1px solid ${T.border}`,
                                    background: T.bg,
                                    cursor: "pointer",
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={img.url}
                                    alt=""
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    loading="lazy"
                                  />
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Clock size={36} style={{ color: T.muted, margin: "0 auto 12px" }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: T.sub }}>作業履歴がありません</p>
          <p style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>報告を提出すると履歴に表示されます</p>
        </div>
      )}

      {/* ── Floating action buttons ── */}
      <div
        className="fixed right-4 z-40 flex flex-col gap-3"
        style={{ bottom: "calc(80px + env(safe-area-inset-bottom, 0px) + 16px)" }}
      >
        <Link
          href={`/kaitai/report/waste?siteId=${siteId}`}
          className="flex items-center gap-2 px-4 py-3 rounded-full"
          style={{
            background: T.primary, color: "#fff",
            fontSize: 14, fontWeight: 700,
            boxShadow: "0 4px 14px rgba(180,83,9,0.35)",
            textDecoration: "none",
            minHeight: 48,
          }}
        >
          <Truck size={18} /> 廃材報告
        </Link>
        <Link
          href={`/kaitai/report/expense?siteId=${siteId}`}
          className="flex items-center gap-2 px-4 py-3 rounded-full"
          style={{
            background: "#3B82F6", color: "#fff",
            fontSize: 14, fontWeight: 700,
            boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
            textDecoration: "none",
            minHeight: 48,
          }}
        >
          <Fuel size={18} /> 経費・燃料
        </Link>
        <Link
          href={`/kaitai/report/photo-mark?siteId=${siteId}`}
          className="flex items-center gap-2 px-4 py-3 rounded-full"
          style={{
            background: "#6366F1", color: "#fff",
            fontSize: 14, fontWeight: 700,
            boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
            textDecoration: "none",
            minHeight: 48,
          }}
        >
          <Pencil size={18} /> 写真マーキング
        </Link>
        <Link
          href={`/kaitai/report/finish?siteId=${siteId}`}
          className="flex items-center gap-2 px-4 py-3 rounded-full"
          style={{
            background: "#059669", color: "#fff",
            fontSize: 14, fontWeight: 700,
            boxShadow: "0 4px 14px rgba(5,150,105,0.35)",
            textDecoration: "none",
            minHeight: 48,
          }}
        >
          <CircleStop size={18} /> 終了報告
        </Link>
      </div>
    </div>
  );
}

// ─── Tab 3: Photos & Documents ──────────────────────────────────────────────

const FOLDER_CONFIG = [
  { key: "before",    label: "着工前写真（Before）",          icon: Camera,    color: "#3B82F6" },
  { key: "asbestos",  label: "アスベスト調査報告書・届出書",    icon: FileText,  color: "#DC2626" },
  { key: "plan",      label: "足場計画・解体手順図面",         icon: ClipboardList, color: "#8B5CF6" },
  { key: "remaining", label: "残置物・不用品リスト",           icon: Package,   color: "#F59E0B" },
  { key: "progress",  label: "施工中写真",                   icon: HardHat,   color: T.primary },
  { key: "other",     label: "その他",                      icon: FolderOpen, color: "#6B7280" },
] as const;

function classifyImage(img: SiteImage): string {
  const rt = (img.reportType || "").toLowerCase();
  const by = (img.uploadedBy || "").toLowerCase();
  if (rt.includes("before") || rt.includes("着工前")) return "before";
  if (rt.includes("asbestos") || rt.includes("アスベスト")) return "asbestos";
  if (rt.includes("plan") || rt.includes("図面") || rt.includes("足場")) return "plan";
  if (rt.includes("残置") || rt.includes("remaining") || rt.includes("不用品")) return "remaining";
  if (rt.includes("progress") || rt.includes("施工") || rt.includes("解体")) return "progress";
  // Default: check upload context
  if (by.includes("start") || by.includes("着工前")) return "before";
  return "other";
}

function TabDocs({
  images,
}: {
  images: SiteImage[];
}) {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  // Group images into folders
  const folders = FOLDER_CONFIG.map(cfg => ({
    ...cfg,
    images: images.filter(img => classifyImage(img) === cfg.key),
  }));

  const hasAnyImages = images.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {folders.map(folder => {
        const isOpen = openFolder === folder.key;
        const Icon = folder.icon;
        const count = folder.images.length;

        return (
          <div
            key={folder.key}
            className="rounded-xl overflow-hidden"
            style={{ background: "#fff", border: `1px solid ${T.border}` }}
          >
            <button
              onClick={() => setOpenFolder(isOpen ? null : folder.key)}
              className="w-full flex items-center gap-3 text-left"
              style={{ padding: "16px 20px", minHeight: 56 }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-lg"
                style={{ width: 40, height: 40, background: `${folder.color}14` }}
              >
                <Icon size={20} style={{ color: folder.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                  {folder.label}
                </p>
                <p style={{ fontSize: 13, color: T.muted }}>
                  {count > 0 ? `${count}件` : "ファイルなし"}
                </p>
              </div>
              {count > 0 && (
                <span
                  className="flex-shrink-0 flex items-center justify-center rounded-full"
                  style={{
                    width: 28, height: 28,
                    background: folder.color, color: "#fff",
                    fontSize: 13, fontWeight: 800,
                  }}
                >
                  {count}
                </span>
              )}
              {isOpen
                ? <ChevronUp size={18} style={{ color: T.muted }} />
                : <ChevronDown size={18} style={{ color: T.muted }} />
              }
            </button>

            {isOpen && count > 0 && (
              <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${T.border}` }}>
                <div className="grid grid-cols-3 gap-2 pt-3">
                  {folder.images.map(img => (
                    <button
                      key={img.id}
                      onClick={() => setViewUrl(img.url)}
                      className="relative rounded-lg overflow-hidden"
                      style={{
                        aspectRatio: "1",
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.3)" }}
                      >
                        <ZoomIn size={24} style={{ color: "#fff" }} />
                      </div>
                      <div
                        className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(0,0,0,0.6)", fontSize: 10, color: "#fff" }}
                      >
                        {new Date(img.createdAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isOpen && count === 0 && (
              <div
                className="text-center py-8"
                style={{ borderTop: `1px solid ${T.border}` }}
              >
                <ImageIcon size={28} style={{ color: T.muted, margin: "0 auto 8px" }} />
                <p style={{ fontSize: 14, color: T.muted }}>まだファイルがありません</p>
              </div>
            )}
          </div>
        );
      })}

      {!hasAnyImages && (
        <div className="py-12 text-center">
          <Camera size={36} style={{ color: T.muted, margin: "0 auto 12px" }} />
          <p style={{ fontSize: 16, color: T.sub }}>写真・資料はまだ登録されていません</p>
          <p style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>
            報告時にアップロードされた写真がここに表示されます
          </p>
        </div>
      )}

      {/* Fullscreen viewer */}
      {viewUrl && <ImageViewer url={viewUrl} onClose={() => setViewUrl(null)} />}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: "basic",   label: "基本・注意", emoji: "📋" },
  { key: "history", label: "履歴・報告", emoji: "🚜" },
  { key: "docs",    label: "写真・資料", emoji: "📂" },
];

export default function SiteDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  // Data
  const [site, setSite] = useState<SiteData | null>(null);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [logs, setLogs] = useState<ParsedLog[]>([]);
  const [images, setImages] = useState<SiteImage[]>([]);
  const [siteNotes, setSiteNotes] = useState<SiteNotes>({});
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Map<string, ReactionData>>(new Map());

  // Doc issue history
  type DocIssueInfo = { docType: string; issuedAt: string };
  const [docIssues, setDocIssues] = useState<DocIssueInfo[]>([]);

  // Swipe handling
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.7) return; // not a horizontal swipe

    const tabIndex = TABS.findIndex(t => t.key === activeTab);
    if (dx < 0 && tabIndex < TABS.length - 1) {
      setActiveTab(TABS[tabIndex + 1].key);
    } else if (dx > 0 && tabIndex > 0) {
      setActiveTab(TABS[tabIndex - 1].key);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!id) { setLoading(false); return; }

    const fetchAll = async () => {
      try {
        // Fetch site
        const sitesRes = await fetch("/api/kaitai/sites", { credentials: "include" });
        const sitesData = sitesRes.ok ? await sitesRes.json() : null;
        const siteRaw = sitesData?.sites?.find((s: Record<string, unknown>) => s.id === id);
        if (!siteRaw) { setLoading(false); return; }

        const siteObj: SiteData = {
          id: siteRaw.id as string,
          name: siteRaw.name as string,
          address: (siteRaw.address as string) ?? "",
          status: (siteRaw.status as string) ?? "着工前",
          startDate: (siteRaw.startDate as string) ?? "",
          endDate: (siteRaw.endDate as string) ?? "",
          progressPct: (siteRaw.progressPct as number) ?? 0,
          contractAmount: (siteRaw.contractAmount as number) ?? 0,
          paidAmount: (siteRaw.paidAmount as number) ?? 0,
          costAmount: (siteRaw.costAmount as number) ?? 0,
          structureType: (siteRaw.structureType as string) ?? "",
          notes: (siteRaw.notes as string) ?? "",
          lat: (siteRaw.lat as number) ?? null,
          lng: (siteRaw.lng as number) ?? null,
          clientId: (siteRaw.clientId as string) ?? null,
        };
        setSite(siteObj);
        setSiteNotes(parseSiteNotes(siteObj.notes));

        // Parallel fetches
        const [contractRes, logsRes, imagesRes, clientsRes] = await Promise.all([
          fetch(`/api/kaitai/sites/contract?siteId=${id}`, { credentials: "include" }),
          fetch(`/api/kaitai/operation-logs?type=reports&limit=500`, { credentials: "include" }),
          fetch(`/api/kaitai/upload?siteId=${id}`, { credentials: "include" }),
          siteObj.clientId
            ? fetch("/api/kaitai/clients", { credentials: "include" })
            : Promise.resolve(null),
        ]);

        // Contract
        if (contractRes.ok) {
          const cd = await contractRes.json();
          if (cd?.data) {
            setContract({
              clientName: cd.data.clientName ?? "",
              clientContact: cd.data.clientContact ?? "",
              projectName: cd.data.projectName ?? "",
              notes: cd.data.notes ?? "",
            });
          }
        }

        // Operation logs — filter by siteId OR site name in action text
        if (logsRes.ok) {
          const ld = await logsRes.json();
          const siteName = siteObj.name;
          const rawLogs = ((ld?.logs ?? []) as OperationLog[]).filter(
            (l) => l.siteId === id || (siteName && l.action.includes(siteName))
          );
          const siteLogs = rawLogs.map(parseOperationLog);
          setLogs(siteLogs);

          // Fetch reactions for these logs
          if (rawLogs.length > 0) {
            const logIds = rawLogs.map((l: OperationLog) => l.id).join(",");
            try {
              const rRes = await fetch(`/api/kaitai/reactions?logIds=${logIds}`, { credentials: "include" });
              if (rRes.ok) {
                const rData = await rRes.json();
                const map = new Map<string, ReactionData>();
                for (const r of (rData.reactions ?? [])) map.set(r.logId, r);
                setReactions(map);
              }
            } catch { /* best effort */ }
          }
        }

        // Images
        if (imagesRes.ok) {
          const imgData = await imagesRes.json();
          setImages(
            (imgData?.images ?? []).map((img: Record<string, unknown>) => ({
              id: img.id as string,
              url: img.url as string,
              reportType: (img.reportType as string) ?? "",
              uploadedBy: (img.uploadedBy as string) ?? "",
              createdAt: (img.createdAt as string) ?? "",
            }))
          );
        }

        // Client
        if (clientsRes && clientsRes.ok) {
          const cData = await clientsRes.json();
          const cl = (cData?.clients ?? []).find(
            (c: Record<string, unknown>) => c.id === siteObj.clientId
          );
          if (cl) {
            setClient({
              id: cl.id as string,
              name: cl.name as string,
              contactName: (cl.contactName as string) ?? "",
              phone: (cl.phone as string) ?? "",
            });
          }
        }
        // Doc issues
        try {
          const issuesRes = await fetch(`/api/kaitai/docs/issues?siteId=${id}`, { credentials: "include" });
          if (issuesRes.ok) {
            const issuesData = await issuesRes.json();
            setDocIssues(
              (issuesData?.issues ?? []).map((i: Record<string, unknown>) => ({
                docType: i.docType as string,
                issuedAt: i.issuedAt as string,
              }))
            );
          }
        } catch { /* best effort */ }
      } catch (e) {
        console.error("Failed to load site detail:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: T.sub, fontSize: 16 }}>
        読み込み中...
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={36} style={{ color: T.muted, marginBottom: 12 }} />
        <p style={{ fontSize: 16, color: T.sub }}>現場が見つかりません</p>
        <Link
          href="/kaitai"
          className="mt-4 px-4 py-2 rounded-lg"
          style={{ fontSize: 14, color: T.primary, background: T.primaryLt, textDecoration: "none", fontWeight: 700 }}
        >
          現場一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "100dvh" }}>

      {/* ── Sticky header: back + site name ── */}
      <div
        className="sticky top-0 z-30"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div className="flex items-center gap-3" style={{ padding: "12px 16px" }}>
          <Link
            href="/kaitai"
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 40, height: 40, background: T.bg, border: `1px solid ${T.border}` }}
          >
            <ArrowLeft size={18} style={{ color: T.sub }} />
          </Link>
          <div className="flex-1 min-w-0">
            <p style={{
              fontSize: 16, fontWeight: 700, color: T.text,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {site.name}
            </p>
          </div>
        </div>

        {/* ── Tab navigation ── */}
        <div className="flex" style={{ borderTop: `1px solid ${T.border}` }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex items-center justify-center gap-1.5"
                style={{
                  padding: "14px 0",
                  minHeight: 52,
                  fontSize: 15,
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? T.primary : T.muted,
                  borderBottom: isActive ? `3px solid ${T.primary}` : "3px solid transparent",
                  background: isActive ? T.primaryLt : "transparent",
                  transition: "all 0.15s",
                }}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1"
        style={{ padding: "16px 0 24px" }}
      >
        <div style={{ padding: "0 4px" }}>
          {activeTab === "basic" && (
            <TabBasic
              site={site}
              contract={contract}
              client={client}
              notes={siteNotes}
              reactions={reactions}
              logs={logs}
              docIssues={docIssues}
            />
          )}
          {activeTab === "history" && (
            <TabHistory
              logs={logs}
              siteId={site.id}
              images={images}
              reactions={reactions}
              onViewImage={setViewImageUrl}
            />
          )}
          {activeTab === "docs" && (
            <TabDocs images={images} />
          )}
        </div>
      </div>

      {/* Page-level fullscreen image viewer */}
      {viewImageUrl && <ImageViewer url={viewImageUrl} onClose={() => setViewImageUrl(null)} />}
    </div>
  );
}
