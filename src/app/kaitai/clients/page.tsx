"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Search, Edit3, Archive,
  ArchiveRestore, Phone, Mail, MapPin, User, X, Check,
  Building2, ChevronDown,
} from "lucide-react";
import { useAppContext, Client, ClientStatus } from "../lib/app-context";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_META: Record<ClientStatus, { label: string; bg: string; color: string }> = {
  active:    { label: "取引中",   bg: "rgba(74,222,128,0.1)",  color: "#4ADE80" },
  past:      { label: "過去取引", bg: "rgba(148,163,184,0.1)", color: "#94A3B8" },
  suspended: { label: "停止",     bg: "rgba(248,113,113,0.1)", color: "#F87171" },
};

const EMPTY_FORM = {
  name: "", contactName: "", phone: "", email: "",
  address: "", memo: "", status: "active" as ClientStatus, archived: false,
};

// ─── Modal ───────────────────────────────────────────────────────────────────

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
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl flex flex-col"
        style={{ background: "#1A2535", border: "1px solid #2D3E54", maxHeight: "90dvh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid #2D3E54" }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#F1F5F9" }}>
            {initial?.id ? "元請け編集" : "元請け新規登録"}
          </p>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ background: "#0F1928" }}>
            <X size={18} color="#64748B" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Name (required) */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 6 }}>
              元請け名 <span style={{ color: "#F87171" }}>*</span>
            </label>
            <input
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="例：株式会社大和建設、田村工務店、山田 太郎"
              className="w-full rounded-xl px-4 outline-none"
              style={{
                height: 48, fontSize: 15, background: "#0F1928",
                border: errors.name ? "1.5px solid #F87171" : "1.5px solid #2D3E54",
                color: "#F1F5F9",
              }}
            />
            {errors.name && <p style={{ fontSize: 11, color: "#F87171", marginTop: 4 }}>{errors.name}</p>}
            <p style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>会社名・屋号・個人名のどれでも登録できます</p>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 6 }}>担当者名</label>
              <input
                value={form.contactName}
                onChange={e => set("contactName", e.target.value)}
                placeholder="例：前田 健二"
                className="w-full rounded-xl px-3 outline-none"
                style={{ height: 44, fontSize: 14, background: "#0F1928", border: "1.5px solid #2D3E54", color: "#F1F5F9" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 6 }}>電話番号</label>
              <input
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="03-0000-0000"
                type="tel"
                className="w-full rounded-xl px-3 outline-none"
                style={{ height: 44, fontSize: 14, background: "#0F1928", border: "1.5px solid #2D3E54", color: "#F1F5F9" }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 6 }}>メールアドレス</label>
            <input
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="example@company.jp"
              type="email"
              className="w-full rounded-xl px-4 outline-none"
              style={{ height: 44, fontSize: 14, background: "#0F1928", border: "1.5px solid #2D3E54", color: "#F1F5F9" }}
            />
          </div>

          {/* Address */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 6 }}>住所</label>
            <input
              value={form.address}
              onChange={e => set("address", e.target.value)}
              placeholder="例：東京都品川区..."
              className="w-full rounded-xl px-4 outline-none"
              style={{ height: 44, fontSize: 14, background: "#0F1928", border: "1.5px solid #2D3E54", color: "#F1F5F9" }}
            />
          </div>

          {/* Status */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 6 }}>ステータス</label>
            <div className="flex gap-2">
              {(["active", "past", "suspended"] as ClientStatus[]).map(s => {
                const m = STATUS_META[s];
                const on = form.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => set("status", s)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: on ? m.bg : "#0F1928",
                      color: on ? m.color : "#475569",
                      border: on ? `1.5px solid ${m.color}40` : "1.5px solid #2D3E54",
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
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 6 }}>備考</label>
            <textarea
              value={form.memo}
              onChange={e => set("memo", e.target.value)}
              placeholder="支払い条件・特記事項など"
              className="w-full rounded-xl px-4 py-3 outline-none resize-none"
              style={{ minHeight: 80, fontSize: 13, background: "#0F1928", border: "1.5px solid #2D3E54", color: "#F1F5F9" }}
            />
          </div>

        </div>

        {/* Actions */}
        <div className="px-5 pb-6 pt-3 flex gap-3" style={{ borderTop: "1px solid #2D3E54" }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl font-bold text-sm" style={{ background: "#0F1928", color: "#64748B" }}>
            キャンセル
          </button>
          <button
            onClick={submit}
            className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: "#F97316", color: "#FFF" }}
          >
            <Check size={16} />
            {initial?.id ? "更新する" : "登録する"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const router = useRouter();
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
    <div className="max-w-md mx-auto flex flex-col pb-8" style={{ minHeight: "100dvh", background: "#080F1A" }}>

      {/* Header */}
      <header className="px-5 pt-10 pb-4" style={{ borderBottom: "1px solid #1E2D3D" }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-2xl" style={{ background: "rgba(255,255,255,0.06)" }}>
            <ChevronLeft size={20} color="#94A3B8" />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "#F1F5F9" }}>元請け管理</h1>
            <p style={{ fontSize: 11, color: "#475569" }}>発注元・元請け会社の一覧</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "登録件数",  value: totalCount },
            { label: "取引中",    value: activeCount },
            { label: "アーカイブ", value: clients.filter(c => c.archived).length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-2 text-center" style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: "#F1F5F9" }}>{value}</p>
              <p style={{ fontSize: 9, color: "#475569" }}>{label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Toolbar */}
      <div className="px-4 pt-4 flex flex-col gap-3">

        {/* Search */}
        <div className="relative">
          <Search size={15} color="#475569" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="会社名・担当者名・電話番号で検索"
            className="w-full rounded-2xl outline-none"
            style={{
              height: 44, paddingLeft: 38, paddingRight: 16, fontSize: 14,
              background: "#1A2535", border: "1px solid #2D3E54", color: "#F1F5F9",
            }}
          />
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="flex items-center gap-1 flex-1 rounded-xl px-3 py-2" style={{ background: "#1A2535", border: "1px solid #2D3E54" }}>
            <ChevronDown size={12} color="#475569" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as "name" | "createdAt")}
              className="flex-1 bg-transparent outline-none text-xs font-bold"
              style={{ color: "#94A3B8" }}
            >
              <option value="createdAt">登録順</option>
              <option value="name">名前順</option>
            </select>
          </div>

          {/* Archive toggle */}
          <button
            onClick={() => setShowArchived(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
            style={showArchived
              ? { background: "rgba(249,115,22,0.15)", color: "#F97316", border: "1px solid rgba(249,115,22,0.3)" }
              : { background: "#1A2535", color: "#475569", border: "1px solid #2D3E54" }}
          >
            <Archive size={13} />
            {showArchived ? "アーカイブ表示中" : "アーカイブ"}
          </button>

          {/* Add */}
          <button
            onClick={() => setModal({ mode: "add" })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: "#F97316", color: "#FFF" }}
          >
            <Plus size={14} />
            追加
          </button>
        </div>
      </div>

      {/* Client list */}
      <div className="px-4 pt-3 flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="py-12 text-center" style={{ color: "#475569", fontSize: 13 }}>
            {search ? "検索結果がありません" : showArchived ? "アーカイブはありません" : "元請けが登録されていません"}
          </div>
        )}

        {filtered.map(c => {
          const sm = STATUS_META[c.status];
          return (
            <div
              key={c.id}
              className="rounded-2xl p-4"
              style={{
                background: c.archived ? "#0F1928" : "#1A2535",
                border: `1px solid ${c.archived ? "#1A2535" : "#2D3E54"}`,
                opacity: c.archived ? 0.6 : 1,
              }}
            >
              {/* Row 1: name + status + actions */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)" }}>
                    <Building2 size={16} color="#F97316" />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9" }} className="truncate">{c.name}</p>
                    {c.contactName && (
                      <p style={{ fontSize: 11, color: "#64748B" }}><User size={9} style={{ display: "inline", marginRight: 3 }} />{c.contactName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sm.bg, color: sm.color }}>
                    {sm.label}
                  </span>
                  <button onClick={() => setModal({ mode: "edit", client: c })} className="w-8 h-8 flex items-center justify-center rounded-xl" style={{ background: "#0F1928" }}>
                    <Edit3 size={13} color="#64748B" />
                  </button>
                  <button onClick={() => handleArchive(c)} className="w-8 h-8 flex items-center justify-center rounded-xl" style={{ background: "#0F1928" }}>
                    {c.archived
                      ? <ArchiveRestore size={13} color="#4ADE80" />
                      : <Archive size={13} color="#64748B" />}
                  </button>
                </div>
              </div>

              {/* Contact info */}
              <div className="flex flex-col gap-1">
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={11} color="#475569" />
                    <span style={{ fontSize: 12, color: "#64748B" }}>{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={11} color="#475569" />
                    <span style={{ fontSize: 12, color: "#64748B" }} className="truncate">{c.email}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={11} color="#475569" />
                    <span style={{ fontSize: 12, color: "#64748B" }} className="truncate">{c.address}</span>
                  </div>
                )}
              </div>

              {/* Memo */}
              {c.memo && (
                <div className="mt-2 rounded-xl px-3 py-2" style={{ background: "#0F1928" }}>
                  <p style={{ fontSize: 11, color: "#475569" }} className="line-clamp-2">{c.memo}</p>
                </div>
              )}

              {/* Footer */}
              <p style={{ fontSize: 10, color: "#334155", marginTop: 8 }}>
                登録: {new Date(c.createdAt).toLocaleDateString("ja-JP")}
                {c.updatedAt !== c.createdAt && ` · 更新: ${new Date(c.updatedAt).toLocaleDateString("ja-JP")}`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Add FAB */}
      <button
        onClick={() => setModal({ mode: "add" })}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: "#F97316", zIndex: 40 }}
      >
        <Plus size={24} color="#FFF" />
      </button>

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
