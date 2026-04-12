"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft, Printer, Save,
  CheckSquare, Square, Filter, GripVertical,
  Plus, Trash2, Pencil,
} from "lucide-react";
import { T } from "../../lib/design-tokens";
import { todayStr } from "../../lib/doc-types";
import {
  AttachedPhotoPage,
  paginatePhotos,
  LAYOUT_META,
  tagLabel,
  tagColor,
} from "../components/photo-attachments";
import type {
  PhotoItem,
  AlbumPhoto,
  PhotoLayoutType,
} from "../components/photo-attachments";

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
};

// A4 preview dimensions
const A4_W = 794;
const A4_H = 1122;
const PAGE_PAD_X = 48;
const PAGE_PAD_Y = 40;

type LayoutType = PhotoLayoutType;

interface SiteInfo {
  id: string;
  name: string;
  address: string;
  startDate: string;
  endDate: string;
  status: string;
  clientName?: string;
}

// ─── Draft save key ──────────────────────────────────────────────────────────

function draftKey(siteId: string) {
  return `kaitai_photo_album_draft_${siteId}`;
}

interface DraftData {
  albumPhotos: AlbumPhoto[];
  layout: LayoutType;
  coverTitle: string;
  savedAt: string;
}

// ─── Cover Page Component ────────────────────────────────────────────────────

function CoverPage({
  site,
  coverTitle,
  issueDate,
  totalPages,
}: {
  site: SiteInfo;
  coverTitle: string;
  issueDate: string;
  totalPages: number;
}) {
  return (
    <div className="doc-paper" style={{
      width: A4_W, minHeight: A4_H,
      background: "#fff",
      padding: `${PAGE_PAD_Y}px ${PAGE_PAD_X}px`,
      fontFamily: "'Hiragino Kaku Gothic Pro','Yu Gothic Medium','Meiryo',sans-serif",
      color: "#111",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      pageBreakAfter: "always",
    }}>
      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Title block */}
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <div style={{
          border: "3px solid #111",
          padding: "32px 40px",
          display: "inline-block",
          minWidth: 400,
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: 8,
            margin: 0,
            lineHeight: 1.5,
          }}>
            {coverTitle || "工事写真台帳"}
          </h1>
        </div>
      </div>

      {/* Site info table */}
      <div style={{
        maxWidth: 480,
        margin: "0 auto 40px",
        width: "100%",
      }}>
        {[
          ["工事名称", site.name],
          ["工事場所", site.address],
          ["工　　期", `${(site.startDate ?? "").replace(/-/g, "/")} ～ ${(site.endDate ?? "").replace(/-/g, "/")}`],
          ["発注者名", site.clientName ?? ""],
          ["提 出 日", issueDate],
        ].map(([label, value]) => (
          <div key={label} style={{
            display: "flex",
            borderBottom: "1px solid #D1D5DB",
            fontSize: 13,
            lineHeight: 2.4,
          }}>
            <span style={{
              width: 100,
              fontWeight: 700,
              color: "#444",
              flexShrink: 0,
              paddingLeft: 8,
              background: "#F8FAFC",
              borderRight: "1px solid #D1D5DB",
            }}>
              {label}
            </span>
            <span style={{ flex: 1, paddingLeft: 14, fontWeight: 500 }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Total pages */}
      <div style={{ textAlign: "center", fontSize: 12, color: "#666", marginBottom: 20 }}>
        写真枚数・ページ数：全 {totalPages} ページ
      </div>

      {/* Spacer */}
      <div style={{ flex: 1.5 }} />

      {/* Issuer */}
      <div style={{ textAlign: "right", fontSize: 11, color: "#444", lineHeight: 2 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>株式会社良心</div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 24, paddingTop: 8, borderTop: "1px solid #E5E7EB",
        textAlign: "center", fontSize: 8, color: "#AAA",
      }}>
        本帳票は 解体LINK により作成されています。
      </div>
    </div>
  );
}

// ─── Main Client Component ───────────────────────────────────────────────────

interface Props { siteId: string }

export default function PhotoAlbumClient({ siteId }: Props) {
  const router = useRouter();

  // ─ State ─
  const [allPhotos, setAllPhotos]       = useState<PhotoItem[]>([]);
  const [albumPhotos, setAlbumPhotos]   = useState<AlbumPhoto[]>([]);
  const [site, setSite]                 = useState<SiteInfo | null>(null);
  const [loading, setLoading]           = useState(true);
  const [layout, setLayout]             = useState<LayoutType>("3");
  const [coverTitle, setCoverTitle]     = useState("工事写真台帳");
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [filterTag, setFilterTag]       = useState("all");
  const [filterSort, setFilterSort]     = useState<"newest" | "oldest">("newest");
  const [showFilter, setShowFilter]     = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded]   = useState(false);

  const captionRef = useRef<HTMLTextAreaElement>(null);

  // ─ Load data ─
  useEffect(() => {
    if (!siteId) { setLoading(false); return; }

    Promise.all([
      fetch(`/api/kaitai/upload?siteId=${siteId}`, { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/sites", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/kaitai/clients", { credentials: "include" }).then(r => r.ok ? r.json() : null),
    ]).then(([imgData, sitesData, clientsData]) => {
      if (imgData?.images) {
        setAllPhotos(imgData.images as PhotoItem[]);
      }
      if (sitesData?.sites) {
        const raw = (sitesData.sites as Record<string, unknown>[]).find(s => s.id === siteId);
        if (raw) {
          const clientName = clientsData?.clients
            ? (clientsData.clients as { id: string; name: string }[]).find(c => c.id === (raw.clientId as string))?.name
            : undefined;
          setSite({
            id: raw.id as string,
            name: (raw.name as string) ?? "",
            address: (raw.address as string) ?? "",
            startDate: (raw.startDate as string) ?? "",
            endDate: (raw.endDate as string) ?? "",
            status: (raw.status as string) ?? "",
            clientName,
          });
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [siteId]);

  // ─ Load draft from localStorage ─
  useEffect(() => {
    if (!siteId || draftLoaded) return;
    try {
      const raw = localStorage.getItem(draftKey(siteId));
      if (raw) {
        const draft: DraftData = JSON.parse(raw);
        if (draft.albumPhotos?.length) {
          setAlbumPhotos(draft.albumPhotos);
          setLayout(draft.layout ?? "3");
          setCoverTitle(draft.coverTitle ?? "工事写真台帳");
        }
      }
    } catch { /* ignore */ }
    setDraftLoaded(true);
  }, [siteId, draftLoaded]);

  // ─ Filtered pool photos ─
  const poolPhotos = useMemo(() => {
    const albumIdSet = new Set(albumPhotos.map(p => p.photoId));
    let filtered = allPhotos.filter(p => !albumIdSet.has(p.id));

    if (filterTag !== "all") {
      if (filterTag === "marked") {
        filtered = filtered.filter(p => p.reportType === "marked_photo");
      } else {
        filtered = filtered.filter(p => p.reportType === filterTag);
      }
    }

    filtered.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return filterSort === "newest" ? db - da : da - db;
    });

    return filtered;
  }, [allPhotos, albumPhotos, filterTag, filterSort]);

  // ─ Available tags ─
  const availableTags = useMemo(() => {
    const tags = new Set(allPhotos.map(p => p.reportType ?? "misc"));
    return Array.from(tags);
  }, [allPhotos]);

  // ─ Pagination ─
  const perPage = parseInt(layout) as 3 | 4 | 6;
  const totalPhotoPages = Math.max(1, Math.ceil(albumPhotos.length / perPage));
  const totalPages = totalPhotoPages; // cover page is separate

  // ─ Pages data ─
  const pages = useMemo(() => paginatePhotos(albumPhotos, perPage), [albumPhotos, perPage]);

  // ─ Handlers ─

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === poolPhotos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(poolPhotos.map(p => p.id)));
    }
  }

  function addSelectedToAlbum() {
    const newPhotos: AlbumPhoto[] = [];
    poolPhotos.forEach(p => {
      if (selectedIds.has(p.id)) {
        newPhotos.push({
          id: `ap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          photoId: p.id,
          url: p.url,
          caption: "",
        });
      }
    });
    setAlbumPhotos(prev => [...prev, ...newPhotos]);
    setSelectedIds(new Set());
  }

  function addSinglePhoto(photo: PhotoItem) {
    setAlbumPhotos(prev => [...prev, {
      id: `ap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      photoId: photo.id,
      url: photo.url,
      caption: "",
    }]);
  }

  function removeFromAlbum(albumId: string) {
    setAlbumPhotos(prev => prev.filter(p => p.id !== albumId));
    if (editingCaption === albumId) setEditingCaption(null);
  }

  function updateCaption(albumId: string, caption: string) {
    setAlbumPhotos(prev => prev.map(p => p.id === albumId ? { ...p, caption } : p));
  }

  function movePhoto(fromIdx: number, toIdx: number) {
    setAlbumPhotos(prev => {
      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
  }

  function saveDraft() {
    try {
      const draft: DraftData = {
        albumPhotos,
        layout,
        coverTitle,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey(siteId), JSON.stringify(draft));
      alert("下書きを保存しました");
    } catch {
      alert("保存に失敗しました");
    }
  }

  function handlePrint() {
    const filename = `写真台帳_${site?.name ?? ""}_${new Date().toISOString().slice(0, 10)}`;
    const prev = document.title;
    document.title = filename;
    window.print();
    document.title = prev;
  }

  // ─ Drag & Drop ─
  const dragItem = useRef<number | null>(null);

  function handleDragStart(idx: number) {
    dragItem.current = idx;
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent, toIdx: number) {
    e.preventDefault();
    if (dragItem.current !== null && dragItem.current !== toIdx) {
      movePhoto(dragItem.current, toIdx);
    }
    dragItem.current = null;
  }

  // Pool drag into album
  function handlePoolDragStart(e: React.DragEvent, photo: PhotoItem) {
    e.dataTransfer.setData("pool-photo-id", photo.id);
  }

  function handleAlbumDrop(e: React.DragEvent) {
    e.preventDefault();
    const poolId = e.dataTransfer.getData("pool-photo-id");
    if (poolId) {
      const photo = allPhotos.find(p => p.id === poolId);
      if (photo) addSinglePhoto(photo);
    }
  }

  // ─ Render ─

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: T.sub, fontSize: 14 }}>読み込み中...</div>
      </div>
    );
  }

  if (!site) {
    return (
      <div style={{ minHeight: "100dvh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: T.sub, fontSize: 14 }}>現場データが見つかりません</div>
      </div>
    );
  }

  const issueDate = todayStr();

  return (
    <>
      {/* ── Print styles ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          @page { size: A4 portrait; margin: 0; }
          .doc-paper {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: 100vh !important;
          }
          .print-view { display: block !important; }
          .screen-view { display: none !important; }
        }
        @media screen {
          .print-view { display: none !important; }
        }
      `}} />

      {/* ── Screen view ── */}
      <div className="screen-view" style={{ minHeight: "100dvh", background: T.bg }}>

        {/* Action bar */}
        <div
          className="no-print"
          style={{
            position: "sticky", top: 0, zIndex: 30,
            background: T.text, borderBottom: "1px solid #334155",
            padding: "8px 16px",
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              color: T.muted, fontSize: 13, fontWeight: 600,
              background: "none", border: "none", cursor: "pointer",
              padding: "4px 8px", borderRadius: 8,
            }}
          >
            <ChevronLeft size={16} />
            戻る
          </button>

          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.bg }}>
              📸 写真台帳エディタ
            </span>
            <span style={{ fontSize: 13, color: T.sub, marginLeft: 10 }}>
              {site.name}
            </span>
          </div>

          {/* Layout selector */}
          <select
            value={layout}
            onChange={e => setLayout(e.target.value as LayoutType)}
            style={{
              height: 36, fontSize: 12, padding: "0 10px",
              border: "1px solid #475569", borderRadius: 8,
              background: "#334155", color: T.bg,
              cursor: "pointer",
            }}
          >
            {(Object.entries(LAYOUT_META) as [LayoutType, typeof LAYOUT_META["3"]][]).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <button
            onClick={saveDraft}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "#334155", color: T.bg,
              border: "1px solid #475569", borderRadius: 8,
              padding: "7px 14px", fontSize: 13, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Save size={14} />
            下書き保存
          </button>

          <button
            onClick={handlePrint}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: T.primary, color: "#fff",
              border: "none", borderRadius: 8, padding: "7px 14px",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            <Printer size={14} />
            印刷 / PDF
          </button>
        </div>

        {/* Split view */}
        <div style={{ display: "flex", height: "calc(100dvh - 53px)", overflow: "hidden" }}>

          {/* ── Left: Photo pool ── */}
          <div style={{
            width: 360,
            flexShrink: 0,
            borderRight: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
            background: C.card,
          }}>
            {/* Pool header */}
            <div style={{
              padding: "12px 14px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  📂 現場写真 ({poolPhotos.length}枚)
                </span>
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 12, color: showFilter ? C.amber : C.sub,
                    background: "none", border: "none", cursor: "pointer",
                  }}
                >
                  <Filter size={13} />
                  絞込
                </button>
              </div>

              {/* Filters */}
              {showFilter && (
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={filterTag}
                    onChange={e => setFilterTag(e.target.value)}
                    style={{
                      fontSize: 11, padding: "4px 8px", borderRadius: 6,
                      border: `1px solid ${C.border}`, color: C.text,
                      background: T.bg,
                    }}
                  >
                    <option value="all">すべて</option>
                    <option value="marked">マーキングあり</option>
                    {availableTags.filter(t => t !== "marked_photo").map(t => (
                      <option key={t} value={t}>{tagLabel(t)}</option>
                    ))}
                  </select>
                  <select
                    value={filterSort}
                    onChange={e => setFilterSort(e.target.value as "newest" | "oldest")}
                    style={{
                      fontSize: 11, padding: "4px 8px", borderRadius: 6,
                      border: `1px solid ${C.border}`, color: C.text,
                      background: T.bg,
                    }}
                  >
                    <option value="newest">新しい順</option>
                    <option value="oldest">古い順</option>
                  </select>
                </div>
              )}

              {/* Select all + add */}
              <div className="flex items-center justify-between">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-1.5"
                  style={{
                    fontSize: 12, color: C.sub,
                    background: "none", border: "none", cursor: "pointer",
                  }}
                >
                  {selectedIds.size === poolPhotos.length && poolPhotos.length > 0
                    ? <CheckSquare size={14} color={C.amber} />
                    : <Square size={14} />}
                  全選択
                </button>
                {selectedIds.size > 0 && (
                  <button
                    onClick={addSelectedToAlbum}
                    className="flex items-center gap-1.5"
                    style={{
                      fontSize: 12, fontWeight: 700, color: "#fff",
                      background: C.amber, border: "none", borderRadius: 6,
                      padding: "5px 12px", cursor: "pointer",
                    }}
                  >
                    <Plus size={13} />
                    {selectedIds.size}枚を追加
                  </button>
                )}
              </div>
            </div>

            {/* Photo list — full image display, no cropping */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              {poolPhotos.length === 0 && (
                <div style={{
                  textAlign: "center",
                  padding: 40,
                  color: C.muted,
                  fontSize: 13,
                }}>
                  {allPhotos.length === 0
                    ? "写真がアップロードされていません"
                    : "すべての写真が台帳に追加済みです"}
                </div>
              )}
              {poolPhotos.map(photo => {
                const isSelected = selectedIds.has(photo.id);
                const d = new Date(photo.createdAt);
                const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
                return (
                  <div
                    key={photo.id}
                    draggable
                    onDragStart={e => handlePoolDragStart(e, photo)}
                    onClick={() => toggleSelect(photo.id)}
                    onDoubleClick={() => addSinglePhoto(photo)}
                    style={{
                      position: "relative",
                      borderRadius: 10,
                      overflow: "hidden",
                      border: isSelected ? `3px solid ${C.amber}` : `1.5px solid ${C.border}`,
                      cursor: "pointer",
                      background: "#F8F9FA",
                      boxShadow: isSelected ? `0 0 0 1px ${C.amber}` : "none",
                      transition: "border 0.1s, box-shadow 0.1s",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt=""
                      style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
                      loading="lazy"
                    />
                    {/* Bottom info bar */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "6px 10px",
                      background: isSelected ? T.primaryLt : "#F3F4F6",
                      borderTop: `1px solid ${isSelected ? T.primaryMd : C.border}`,
                    }}>
                      <div className="flex items-center gap-2">
                        {/* Checkbox */}
                        <div style={{
                          width: 22, height: 22, borderRadius: 5,
                          background: isSelected ? C.amber : "#fff",
                          border: isSelected ? "none" : "2px solid #ccc",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {isSelected && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                        </div>
                        {/* Date */}
                        <span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>
                          {dateStr}
                        </span>
                      </div>
                      {/* Tag */}
                      {photo.reportType && (
                        <span style={{
                          fontSize: 10, color: "#fff", fontWeight: 700,
                          background: tagColor(photo.reportType),
                          padding: "2px 8px", borderRadius: 5,
                        }}>
                          {tagLabel(photo.reportType)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right: Preview + editor ── */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 24px",
              background: "#E5E7EB",
            }}
            onDragOver={e => e.preventDefault()}
            onDrop={handleAlbumDrop}
          >
            {/* Cover title edit */}
            <div
              className="no-print"
              style={{
                maxWidth: A4_W,
                margin: "0 auto 16px",
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "12px 16px",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Pencil size={13} color={C.muted} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>表紙タイトル</span>
              </div>
              <input
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  border: `1.5px solid ${C.border}`,
                  background: T.bg,
                  color: C.text,
                  fontSize: 15,
                  fontWeight: 700,
                }}
                value={coverTitle}
                onChange={e => setCoverTitle(e.target.value)}
              />
            </div>

            {/* Album photo count + info */}
            <div
              className="no-print"
              style={{
                maxWidth: A4_W,
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>
                台帳：{albumPhotos.length}枚 · {totalPhotoPages}ページ
              </span>
              <span style={{ fontSize: 11, color: C.muted }}>
                写真をドラッグ＆ドロップまたはダブルクリックで追加
              </span>
            </div>

            {/* Cover page preview */}
            <div style={{ maxWidth: A4_W, margin: "0 auto 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.12)" }}>
              <CoverPage
                site={site}
                coverTitle={coverTitle}
                issueDate={issueDate}
                totalPages={totalPages}
              />
            </div>

            {/* Photo pages */}
            {pages.map((pagePhotos, pageIdx) => (
              <div key={pageIdx} style={{ maxWidth: A4_W, margin: "0 auto 24px" }}>
                {/* Page paper */}
                <div style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.12)" }}>
                  <AttachedPhotoPage
                    photos={pagePhotos}
                    layout={layout}
                    headerLeft="工事写真台帳"
                    headerRight={site.name}
                    footerLeft="株式会社良心"
                    pageNum={pageIdx + 1}
                    totalPages={totalPages}
                    startNo={pageIdx * perPage + 1}
                  />
                </div>

                {/* Caption editor (below each page) */}
                <div
                  className="no-print"
                  style={{
                    maxWidth: A4_W,
                    margin: "8px auto 0",
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8 }}>
                    ページ {pageIdx + 1} の写真 ({pagePhotos.length}枚)
                  </div>
                  {pagePhotos.map((ap, slotIdx) => {
                    const globalIdx = pageIdx * perPage + slotIdx;
                    return (
                      <div
                        key={ap.id}
                        draggable
                        onDragStart={() => handleDragStart(globalIdx)}
                        onDragOver={e => handleDragOver(e, globalIdx)}
                        onDrop={e => handleDrop(e, globalIdx)}
                        className="flex items-start gap-3 mb-2 p-2 rounded-lg"
                        style={{
                          background: editingCaption === ap.id ? T.primaryLt : T.bg,
                          border: `1px solid ${editingCaption === ap.id ? T.primaryMd : "transparent"}`,
                          cursor: "grab",
                          transition: "background 0.15s",
                        }}
                      >
                        <GripVertical size={14} color={C.muted} style={{ marginTop: 4, flexShrink: 0 }} />
                        {/* Thumbnail */}
                        <div style={{
                          width: 48, height: 48, borderRadius: 6,
                          overflow: "hidden", flexShrink: 0,
                          border: `1px solid ${C.border}`,
                        }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ap.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        {/* Caption */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>
                            No.{globalIdx + 1}
                          </div>
                          <textarea
                            ref={editingCaption === ap.id ? captionRef : undefined}
                            className="w-full px-2 py-1 rounded text-sm outline-none"
                            style={{
                              border: `1px solid ${C.border}`,
                              background: "#fff",
                              color: C.text,
                              fontSize: 12,
                              resize: "vertical",
                              minHeight: 32,
                              lineHeight: 1.5,
                            }}
                            placeholder="キャプションを入力..."
                            value={ap.caption}
                            onChange={e => updateCaption(ap.id, e.target.value)}
                            onFocus={() => setEditingCaption(ap.id)}
                            onBlur={() => setEditingCaption(null)}
                            rows={1}
                          />
                        </div>
                        {/* Remove */}
                        <button
                          onClick={() => removeFromAlbum(ap.id)}
                          className="flex items-center justify-center"
                          style={{
                            width: 28, height: 28, borderRadius: 6,
                            background: "none", border: "none", cursor: "pointer",
                            color: C.muted, marginTop: 2, flexShrink: 0,
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                  {pagePhotos.length === 0 && (
                    <div style={{
                      textAlign: "center", padding: 20,
                      color: C.muted, fontSize: 12,
                    }}>
                      左の写真プールからドラッグ＆ドロップで写真を追加
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Print view (hidden on screen, shown on print) ── */}
      <div className="print-view">
        <CoverPage
          site={site}
          coverTitle={coverTitle}
          issueDate={issueDate}
          totalPages={totalPages}
        />
        {pages.map((pagePhotos, pageIdx) => (
          <AttachedPhotoPage
            key={pageIdx}
            photos={pagePhotos}
            layout={layout}
            headerLeft="工事写真台帳"
            headerRight={site.name}
            footerLeft="株式会社良心"
            pageNum={pageIdx + 1}
            totalPages={totalPages}
            startNo={pageIdx * perPage + 1}
          />
        ))}
      </div>
    </>
  );
}
