"use client";

import { useState, useMemo } from "react";
import {
  Plus, Search, Edit3, Archive,
  ArchiveRestore, Phone, Mail, MapPin, User, X, Check,
  Building2, ChevronDown,
} from "lucide-react";
import { useAppContext, Client, ClientStatus } from "../lib/app-context";
import { T } from "../lib/design-tokens";

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface, bg: T.bg,
  amber: T.primary, amberDk: T.primaryDk,
  red: "#EF4444", green: "#10B981",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<ClientStatus, { label: string; bg: string; color: string }> = {
  active:    { label: "取引中",   bg: "#F0FDF4", color: "#16A34A" },
  past:      { label: "過去取引", bg: T.bg, color: T.sub },
  suspended: { label: "停止",     bg: "#FEF2F2", color: "#EF4444" },
};

const EMPTY_FORM = {
  name: "", contactName: "", phone: "", email: "",
  address: "", memo: "", status: "active" as ClientStatus, archived: false,
};

// ─── Modal ────────────────────────────────────────────────────────────────────

function ClientModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Client>;
  onSave: (data: Omit<Client, "id" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: "" }));
  }

  function submit() {
    if (!form.name.trim()) {
      setErrors({ name: "元請け名は必須です" });
      return;
    }
    onSave(form);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl flex flex-col"
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          maxWidth: 640,
          maxHeight: "90dvh",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-4"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <p style={{ fontSize: 18, fontWeight: 900, color: C.text }}>
            {initial?.id ? "元請け編集" : "元請け新規登録"}
          </p>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: C.bg }}
          >
            <X size={18} color={C.sub} />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Name (required) */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>
              元請け名 <span style={{ color: C.red }}>*</span>
            </label>
            <input
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="例：株式会社大和建設、田村工務店、山田 太郎"
              className="w-full rounded-xl px-4 outline-none"
              style={{
                height: 48, fontSize: 15,
                background: C.card,
                border: errors.name ? `1.5px solid ${C.red}` : `1.5px solid ${C.border}`,
                color: C.text,
              }}
            />
            {errors.name && <p style={{ fontSize: 14, color: C.red, marginTop: 4 }}>{errors.name}</p>}
            <p style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>会社名・屋号・個人名のどれでも登録できます</p>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 14, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>担当者名</label>
              <input
                value={form.contactName}
                onChange={e => set("contactName", e.target.value)}
                placeholder="例：前田 健二"
                className="w-full rounded-xl px-3 outline-none"
                style={{ height: 44, fontSize: 14, background: C.card, border: `1.5px solid ${C.border}`, color: C.text }}
              />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>電話番号</label>
              <input
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="03-0000-0000"
                type="tel"
                className="w-full rounded-xl px-3 outline-none"
                style={{ height: 44, fontSize: 14, background: C.card, border: `1.5px solid ${C.border}`, color: C.text }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>メールアドレス</label>
            <input
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="example@company.jp"
              type="email"
              className="w-full rounded-xl px-4 outline-none"
              style={{ height: 44, fontSize: 14, background: C.card, border: `1.5px solid ${C.border}`, color: C.text }}
            />
          </div>

          {/* Address */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>住所</label>
            <input
              value={form.address}
              onChange={e => set("address", e.target.value)}
              placeholder="例：東京都品川区..."
              className="w-full rounded-xl px-4 outline-none"
              style={{ height: 44, fontSize: 14, background: C.card, border: `1.5px solid ${C.border}`, color: C.text }}
            />
          </div>

          {/* Status */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>ステータス</label>
            <div className="flex gap-2">
              {(["active", "past", "suspended"] as ClientStatus[]).map(s => {
                const m = STATUS_META[s];
                const on = form.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => set("status", s)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: on ? m.bg : C.bg,
                      color: on ? m.color : C.sub,
                      border: on ? `1.5px solid ${m.color}40` : `1.5px solid ${C.border}`,
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Memo */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>備考</label>
            <textarea
              value={form.memo}
              onChange={e => set("memo", e.target.value)}
              placeholder="支払い条件・特記事項など"
              className="w-full rounded-xl px-4 py-3 outline-none resize-none"
              style={{ minHeight: 80, fontSize: 14, background: C.card, border: `1.5px solid ${C.border}`, color: C.text }}
            />
          </div>

        </div>

        {/* Actions */}
        <div
          className="px-5 pb-6 pt-3 flex gap-3"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl font-bold text-sm"
            style={{ background: C.bg, color: C.sub }}
          >
            キャンセル
          </button>
          <button
            onClick={submit}
            className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: C.amber, color: "#FFF" }}
          >
            <Check size={16} />
            {initial?.id ? "更新する" : "登録する"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { clients, addClient, updateClient, addLog, company } = useAppContext();

  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "createdAt">("createdAt");
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; client: Client } | null>(null);

  const filtered = useMemo(() => {
    return clients
      .filter(c => showArchived ? c.archived : !c.archived)
      .filter(c => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) ||
          (c.contactName ?? "").toLowerCase().includes(q) ||
          (c.phone ?? "").includes(q);
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name, "ja");
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [clients, search, showArchived, sortBy]);

  const activeCount = clients.filter(c => !c.archived && c.status === "active").length;
  const totalCount  = clients.filter(c => !c.archived).length;

  function handleSave(data: Omit<Client, "id" | "createdAt" | "updatedAt">) {
    if (modal?.mode === "edit") {
      updateClient(modal.client.id, data);
      addLog(`client_update: ${data.name}`, company?.adminName ?? "管理者");
    } else {
      addClient(data);
      addLog(`client_add: ${data.name}`, company?.adminName ?? "管理者");
    }
    setModal(null);
  }

  function handleArchive(client: Client) {
    updateClient(client.id, { archived: !client.archived });
    addLog(`client_${client.archived ? "unarchive" : "archive"}: ${client.name}`, company?.adminName ?? "管理者");
  }

  return (
    <div className="py-6 pb-28 md:pb-8">

      {/* Header */}
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text }}>元請け管理</h1>
            <p style={{ fontSize: 14, color: C.sub, marginTop: 2 }}>発注元・元請け会社の一覧</p>
          </div>
          <button
            onClick={() => setModal({ mode: "add" })}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 hover:opacity-90 flex-shrink-0"
            style={{ background: T.primary,
 }}
          >
            <Plus size={16} />
            元請けを追加
          </button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "登録件数",   value: totalCount },
            { label: "取引中",     value: activeCount },
            { label: "アーカイブ", value: clients.filter(c => c.archived).length },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl p-3 text-center"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <p style={{ fontSize: 28, fontWeight: 900, color: C.text }}>{value}</p>
              <p style={{ fontSize: 14, color: C.sub, marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-4">

        {/* Search */}
        <div className="relative">
          <Search
            size={15}
            color={C.muted}
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="会社名・担当者名・電話番号で検索"
            className="w-full rounded-2xl outline-none"
            style={{
              height: 44, paddingLeft: 38, paddingRight: 16, fontSize: 14,
              background: C.card, border: `1px solid ${C.border}`, color: C.text,
            }}
          />
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2">
          {/* Sort */}
          <div
            className="flex items-center gap-1 rounded-xl px-3 py-2"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <ChevronDown size={12} color={C.muted} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as "name" | "createdAt")}
              className="bg-transparent outline-none text-sm font-bold"
              style={{ color: C.sub }}
            >
              <option value="createdAt">登録順</option>
              <option value="name">名前順</option>
            </select>
          </div>

          {/* Archive toggle */}
          <button
            onClick={() => setShowArchived(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold"
            style={showArchived
              ? { background: T.primaryLt, color: C.amberDk, border: `1px solid ${C.amber}40` }
              : { background: C.card, color: C.sub, border: `1px solid ${C.border}` }}
          >
            <Archive size={13} />
            {showArchived ? "アーカイブ表示中" : "アーカイブ"}
          </button>
        </div>
      </div>

      {/* Client list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="py-12 text-center" style={{ color: C.sub, fontSize: 15 }}>
            {search ? "検索結果がありません" : showArchived ? "アーカイブはありません" : "元請けが登録されていません"}
          </div>
        )}

        {filtered.map(c => {
          const sm = STATUS_META[c.status];
          return (
            <div
              key={c.id}
              className="rounded-2xl p-5"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                opacity: c.archived ? 0.6 : 1,
              }}
            >
              {/* Row 1: name + status + actions */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: T.primaryLt }}
                  >
                    <Building2 size={16} color={C.amber} />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: 15, fontWeight: 800, color: C.text }} className="truncate">{c.name}</p>
                    {c.contactName && (
                      <p style={{ fontSize: 14, color: C.sub }}>
                        <User size={12} style={{ display: "inline", marginRight: 3 }} />
                        {c.contactName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    style={{ fontSize: 14, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: sm.bg, color: sm.color }}
                  >
                    {sm.label}
                  </span>
                  <button
                    onClick={() => setModal({ mode: "edit", client: c })}
                    className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
                    style={{ background: T.surface, border: "1.5px solid #E2E8F0", color: T.text,
 }}
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleArchive(c)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
                    style={{ background: T.surface, border: "1.5px solid #E2E8F0", color: T.text,
 }}
                  >
                    {c.archived
                      ? <ArchiveRestore size={13} color={C.green} />
                      : <Archive size={13} color={C.sub} />}
                  </button>
                </div>
              </div>

              {/* Contact info */}
              <div className="flex flex-col gap-1">
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={11} color={C.muted} />
                    <span style={{ fontSize: 14, color: C.sub }}>{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={11} color={C.muted} />
                    <span style={{ fontSize: 14, color: C.sub }} className="truncate">{c.email}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={11} color={C.muted} />
                    <span style={{ fontSize: 14, color: C.sub }} className="truncate">{c.address}</span>
                  </div>
                )}
              </div>

              {/* Memo */}
              {c.memo && (
                <div className="mt-2 rounded-xl px-3 py-2" style={{ background: C.bg }}>
                  <p style={{ fontSize: 14, color: C.sub }} className="line-clamp-2">{c.memo}</p>
                </div>
              )}

              {/* Footer */}
              <p style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>
                登録: {new Date(c.createdAt).toLocaleDateString("ja-JP")}
                {c.updatedAt !== c.createdAt && ` · 更新: ${new Date(c.updatedAt).toLocaleDateString("ja-JP")}`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <ClientModal
          initial={modal.mode === "edit" ? modal.client : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
