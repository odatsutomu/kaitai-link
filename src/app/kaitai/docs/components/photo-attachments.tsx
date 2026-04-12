"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  CheckSquare, Square, Filter, GripVertical,
  Plus, Trash2, ChevronDown, ChevronUp, Image as ImageIcon,
} from "lucide-react";
import { T } from "../../lib/design-tokens";

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  text: T.text, sub: T.sub, muted: T.muted,
  border: T.border, card: T.surface,
  amber: T.primary, amberDk: T.primaryDk,
};

const A4_W = 794;
const A4_H = 1122;
const PAGE_PAD_X = 48;
const PAGE_PAD_Y = 40;
const HEADER_H = 36;
const FOOTER_H = 28;
const CONTENT_W = A4_W - PAGE_PAD_X * 2;
const CONTENT_H = A4_H - PAGE_PAD_Y * 2 - HEADER_H - FOOTER_H;

// ─── Exported types ──────────────────────────────────────────────────────────

export type PhotoLayoutType = "3" | "4" | "6";

export interface PhotoItem {
  id: string;
  url: string;
  reportType: string | null;
  uploadedBy: string;
  createdAt: string;
}

export interface AlbumPhoto {
  id: string;
  photoId: string;
  url: string;
  caption: string;
}

export const LAYOUT_META: Record<PhotoLayoutType, { label: string; cols: number; rows: number }> = {
  "3": { label: "1ページ3枚（大）", cols: 1, rows: 3 },
  "4": { label: "1ページ4枚（中）", cols: 1, rows: 4 },
  "6": { label: "1ページ6枚（小）", cols: 2, rows: 3 },
};

// ─── Tag helpers ─────────────────────────────────────────────────────────────

const TAG_MAP: Record<string, { label: string; color: string }> = {
  daily_report:    { label: "日報",       color: "#3B82F6" },
  start_report:    { label: "作業開始",   color: "#10B981" },
  finish_report:   { label: "作業終了",   color: "#F59E0B" },
  marked_photo:    { label: "マーキング", color: "#EF4444" },
  irregular:       { label: "イレギュラー", color: "#8B5CF6" },
  equipment_check: { label: "機材",       color: "#6B7280" },
  misc:            { label: "その他",     color: "#9CA3AF" },
};

export function tagLabel(reportType: string | null): string {
  if (!reportType) return "その他";
  return TAG_MAP[reportType]?.label ?? reportType;
}

export function tagColor(reportType: string | null): string {
  if (!reportType) return "#9CA3AF";
  return TAG_MAP[reportType]?.color ?? "#9CA3AF";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function paginatePhotos(photos: AlbumPhoto[], perPage: number): AlbumPhoto[][] {
  const result: AlbumPhoto[][] = [];
  for (let i = 0; i < photos.length; i += perPage) {
    result.push(photos.slice(i, i + perPage));
  }
  if (result.length === 0) result.push([]);
  return result;
}

function makeAlbumId(): string {
  return `ap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Photo Page (for print) ──────────────────────────────────────────────────

export function AttachedPhotoPage({
  photos,
  layout,
  headerLeft,
  headerRight,
  footerLeft,
  pageNum,
  totalPages,
  startNo = 1,
}: {
  photos: AlbumPhoto[];
  layout: PhotoLayoutType;
  headerLeft: string;
  headerRight: string;
  footerLeft: string;
  pageNum: number;
  totalPages: number;
  startNo?: number;
}) {
  const meta = LAYOUT_META[layout];
  const { cols, rows } = meta;
  const perPage = cols * rows;
  const GAP = 12;

  return (
    <div className="doc-paper" style={{
      width: A4_W, minHeight: A4_H,
      background: "#fff",
      padding: `${PAGE_PAD_Y}px ${PAGE_PAD_X}px`,
      fontFamily: "'Hiragino Kaku Gothic Pro','Yu Gothic Medium','Meiryo',sans-serif",
      color: "#111",
      boxSizing: "border-box",
      display: "flex", flexDirection: "column",
      pageBreakAfter: "always",
    }}>
      {/* Header */}
      <div style={{
        height: HEADER_H,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "2px solid #111", paddingBottom: 6, marginBottom: 10,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#333" }}>{headerLeft}</span>
        <span style={{ fontSize: 10, color: "#666" }}>{headerRight}</span>
      </div>

      {/* Photo grid */}
      <div style={{
        flex: 1,
        display: layout === "6" ? "grid" : "flex",
        flexDirection: layout !== "6" ? "column" : undefined,
        gridTemplateColumns: layout === "6" ? "1fr 1fr" : undefined,
        gap: GAP,
      }}>
        {Array.from({ length: perPage }).map((_, slotIdx) => {
          const photo = photos[slotIdx];
          const photoNo = startNo + slotIdx;

          if (!photo && slotIdx >= photos.length) {
            return <div key={slotIdx} style={{ flex: layout !== "6" ? 1 : undefined }} />;
          }

          if (layout === "3") {
            const imgW = Math.floor(CONTENT_W * 0.55);
            return (
              <div key={photo?.id ?? slotIdx} style={{
                flex: 1, display: "flex", gap: 10,
                border: "1px solid #D1D5DB", borderRadius: 3,
                overflow: "hidden", minHeight: 0,
              }}>
                <div style={{
                  width: imgW, flexShrink: 0, background: "#F3F4F6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }}>
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.url} alt={photo.caption || "写真"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ color: "#CCC", fontSize: 24 }}>📷</div>
                  )}
                </div>
                <div style={{
                  flex: 1, padding: "10px 10px 10px 0",
                  display: "flex", flexDirection: "column",
                  fontSize: 10, lineHeight: 1.7, color: "#333",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 9, color: "#888", marginBottom: 4 }}>
                    No.{photoNo}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {photo?.caption || ""}
                  </div>
                </div>
              </div>
            );
          }

          // Layout 4 or 6
          const captionH = layout === "4" ? 40 : 30;
          return (
            <div key={photo?.id ?? slotIdx} style={{
              flex: layout !== "6" ? 1 : undefined,
              border: "1px solid #D1D5DB", borderRadius: 3,
              overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0,
            }}>
              <div style={{
                flex: 1, background: "#F3F4F6",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", minHeight: 0,
              }}>
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.url} alt={photo.caption || "写真"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ color: "#CCC", fontSize: 24 }}>📷</div>
                )}
              </div>
              <div style={{
                height: captionH, padding: "4px 8px",
                fontSize: layout === "6" ? 8 : 9, lineHeight: 1.5, color: "#333",
                borderTop: "1px solid #E5E7EB", overflow: "hidden",
              }}>
                <span style={{ fontWeight: 700, color: "#888", marginRight: 6, fontSize: 8 }}>
                  No.{photoNo}
                </span>
                {photo?.caption || ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        height: FOOTER_H,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderTop: "1px solid #D1D5DB", paddingTop: 6, marginTop: 10,
        fontSize: 9, color: "#888",
      }}>
        <span>{footerLeft}</span>
        <span>{pageNum} / {totalPages}</span>
      </div>
    </div>
  );
}

// ─── Inline Photo Selector (for embedding in edit panels) ────────────────────

export function PhotoAttachmentPanel({
  siteId,
  attachedPhotos,
  setAttachedPhotos,
  layout,
  setLayout,
}: {
  siteId: string;
  attachedPhotos: AlbumPhoto[];
  setAttachedPhotos: (photos: AlbumPhoto[]) => void;
  layout: PhotoLayoutType;
  setLayout: (l: PhotoLayoutType) => void;
}) {
  const [allPhotos, setAllPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState(attachedPhotos.length > 0);
  const [poolOpen, setPoolOpen]   = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterTag, setFilterTag] = useState("all");
  const [showFilter, setShowFilter] = useState(false);

  // Fetch photos
  useEffect(() => {
    if (!siteId) { setLoading(false); return; }
    fetch(`/api/kaitai/upload?siteId=${siteId}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.images) setAllPhotos(data.images as PhotoItem[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  // Pool photos (exclude already attached)
  const attachedIdSet = useMemo(() => new Set(attachedPhotos.map(p => p.photoId)), [attachedPhotos]);
  const poolPhotos = useMemo(() => {
    let filtered = allPhotos.filter(p => !attachedIdSet.has(p.id));
    if (filterTag !== "all") {
      if (filterTag === "marked") {
        filtered = filtered.filter(p => p.reportType === "marked_photo");
      } else {
        filtered = filtered.filter(p => p.reportType === filterTag);
      }
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return filtered;
  }, [allPhotos, attachedIdSet, filterTag]);

  const availableTags = useMemo(() => {
    const tags = new Set(allPhotos.map(p => p.reportType ?? "misc"));
    return Array.from(tags);
  }, [allPhotos]);

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

  function addSelected() {
    const newPhotos: AlbumPhoto[] = [];
    poolPhotos.forEach(p => {
      if (selectedIds.has(p.id)) {
        newPhotos.push({ id: makeAlbumId(), photoId: p.id, url: p.url, caption: "" });
      }
    });
    setAttachedPhotos([...attachedPhotos, ...newPhotos]);
    setSelectedIds(new Set());
  }

  function addSingle(photo: PhotoItem) {
    setAttachedPhotos([...attachedPhotos, {
      id: makeAlbumId(), photoId: photo.id, url: photo.url, caption: "",
    }]);
  }

  function removePhoto(albumId: string) {
    setAttachedPhotos(attachedPhotos.filter(p => p.id !== albumId));
  }

  function updateCaption(albumId: string, caption: string) {
    setAttachedPhotos(attachedPhotos.map(p => p.id === albumId ? { ...p, caption } : p));
  }

  function movePhoto(fromIdx: number, toIdx: number) {
    const next = [...attachedPhotos];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    setAttachedPhotos(next);
  }

  const dragItem = useRef<number | null>(null);

  return (
    <div
      className="no-print rounded-xl overflow-hidden"
      style={{ background: C.card, border: `1px solid ${C.border}`, marginBottom: 12 }}
    >
      {/* Header toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3"
        style={{
          background: T.bg, border: "none", cursor: "pointer",
          borderBottom: open ? `1px solid ${C.border}` : "none",
        }}
      >
        <span className="flex items-center gap-2 text-sm font-bold" style={{ color: C.text }}>
          📷 写真添付
          {attachedPhotos.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: T.primaryLt, color: C.amberDk,
              padding: "1px 8px", borderRadius: 10,
            }}>
              {attachedPhotos.length}枚
            </span>
          )}
        </span>
        {open ? <ChevronUp size={16} color={C.muted} /> : <ChevronDown size={16} color={C.muted} />}
      </button>

      {open && (
        <div style={{ padding: "12px 16px" }}>
          {/* Layout selector */}
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 12, color: C.sub }}>
              写真レイアウト:
            </span>
            <select
              value={layout}
              onChange={e => setLayout(e.target.value as PhotoLayoutType)}
              style={{
                fontSize: 12, padding: "4px 10px", borderRadius: 8,
                border: `1.5px solid ${C.border}`, color: C.text, background: T.bg,
              }}
            >
              {(Object.entries(LAYOUT_META) as [PhotoLayoutType, typeof LAYOUT_META["3"]][]).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Attached photos list */}
          {attachedPhotos.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6 }}>
                添付済み ({attachedPhotos.length}枚)
              </div>
              {attachedPhotos.map((ap, idx) => (
                <div
                  key={ap.id}
                  draggable
                  onDragStart={() => { dragItem.current = idx; }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (dragItem.current !== null && dragItem.current !== idx) {
                      movePhoto(dragItem.current, idx);
                    }
                    dragItem.current = null;
                  }}
                  className="flex items-start gap-3 mb-2 p-2.5 rounded-xl"
                  style={{ background: T.bg, cursor: "grab", border: `1px solid ${C.border}` }}
                >
                  <GripVertical size={14} color={C.muted} style={{ marginTop: 20, flexShrink: 0 }} />
                  <div style={{
                    width: 72, height: 54, borderRadius: 8,
                    overflow: "hidden", flexShrink: 0,
                    border: `1.5px solid ${C.border}`,
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ap.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 3, fontWeight: 600 }}>No.{idx + 1}</div>
                    <input
                      className="w-full px-2.5 py-1.5 rounded-lg text-sm outline-none"
                      style={{
                        border: `1.5px solid ${C.border}`, background: "#fff",
                        color: C.text, fontSize: 12,
                      }}
                      placeholder="キャプションを入力..."
                      value={ap.caption}
                      onChange={e => updateCaption(ap.id, e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => removePhoto(ap.id)}
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: "none", border: "none", cursor: "pointer",
                      color: C.muted, marginTop: 12, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add photos button / pool toggle */}
          <button
            onClick={() => setPoolOpen(!poolOpen)}
            className="flex items-center gap-2 w-full justify-center py-2 rounded-lg text-sm font-semibold"
            style={{
              background: poolOpen ? T.primaryLt : T.bg,
              color: poolOpen ? C.amberDk : C.sub,
              border: `1px solid ${poolOpen ? T.primaryMd : C.border}`,
              cursor: "pointer",
            }}
          >
            <ImageIcon size={14} />
            {poolOpen ? "写真プールを閉じる" : "現場写真から追加"}
          </button>

          {/* Photo pool */}
          {poolOpen && (
            <div style={{ marginTop: 10, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              {/* Pool toolbar */}
              <div style={{
                padding: "8px 12px",
                background: T.bg,
                borderBottom: `1px solid ${C.border}`,
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>
                    {loading ? "読込中..." : `${poolPhotos.length}枚`}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilter(!showFilter)}
                      style={{
                        fontSize: 11, color: showFilter ? C.amber : C.muted,
                        background: "none", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 3,
                      }}
                    >
                      <Filter size={12} /> 絞込
                    </button>
                  </div>
                </div>

                {showFilter && (
                  <select
                    value={filterTag}
                    onChange={e => setFilterTag(e.target.value)}
                    style={{
                      fontSize: 11, padding: "3px 8px", borderRadius: 6,
                      border: `1px solid ${C.border}`, color: C.text, background: "#fff",
                    }}
                  >
                    <option value="all">すべて</option>
                    <option value="marked">マーキングあり</option>
                    {availableTags.filter(t => t !== "marked_photo").map(t => (
                      <option key={t} value={t}>{tagLabel(t)}</option>
                    ))}
                  </select>
                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={selectAll}
                    className="flex items-center gap-1"
                    style={{ fontSize: 11, color: C.sub, background: "none", border: "none", cursor: "pointer" }}
                  >
                    {selectedIds.size === poolPhotos.length && poolPhotos.length > 0
                      ? <CheckSquare size={13} color={C.amber} />
                      : <Square size={13} />}
                    全選択
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      onClick={addSelected}
                      className="flex items-center gap-1"
                      style={{
                        fontSize: 11, fontWeight: 700, color: "#fff",
                        background: C.amber, border: "none", borderRadius: 6,
                        padding: "4px 10px", cursor: "pointer",
                      }}
                    >
                      <Plus size={12} /> {selectedIds.size}枚を追加
                    </button>
                  )}
                </div>
              </div>

              {/* Photo grid — full image display, no cropping */}
              <div style={{
                padding: 10,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                maxHeight: 520,
                overflowY: "auto",
                alignContent: "start",
              }}>
                {poolPhotos.length === 0 && !loading && (
                  <div style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: 24, color: C.muted, fontSize: 12,
                  }}>
                    {allPhotos.length === 0 ? "写真がありません" : "すべて添付済みです"}
                  </div>
                )}
                {poolPhotos.map(photo => {
                  const isSelected = selectedIds.has(photo.id);
                  const d = new Date(photo.createdAt);
                  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
                  return (
                    <div
                      key={photo.id}
                      onClick={() => toggleSelect(photo.id)}
                      onDoubleClick={() => addSingle(photo)}
                      style={{
                        borderRadius: 8, overflow: "hidden",
                        border: isSelected ? `3px solid ${C.amber}` : `1.5px solid ${C.border}`,
                        cursor: "pointer", background: "#F8F9FA",
                        boxShadow: isSelected ? `0 0 0 1px ${C.amber}` : "none",
                        transition: "border 0.1s, box-shadow 0.1s",
                        display: "flex", flexDirection: "column",
                      }}
                    >
                      {/* Image container — fixed aspect ratio with contain */}
                      <div style={{
                        width: "100%", aspectRatio: "4/3",
                        background: "#E5E7EB",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        overflow: "hidden",
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt="" loading="lazy"
                          style={{
                            maxWidth: "100%", maxHeight: "100%",
                            objectFit: "contain",
                          }} />
                      </div>
                      {/* Bottom info bar */}
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "5px 8px",
                        background: isSelected ? T.primaryLt : "#F3F4F6",
                        borderTop: `1px solid ${isSelected ? T.primaryMd : C.border}`,
                      }}>
                        <div className="flex items-center gap-1.5">
                          {/* Checkbox */}
                          <div style={{
                            width: 18, height: 18, borderRadius: 4,
                            background: isSelected ? C.amber : "#fff",
                            border: isSelected ? "none" : "2px solid #ccc",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            {isSelected && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                          </div>
                          {/* Date */}
                          <span style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}>
                            {dateStr}
                          </span>
                        </div>
                        {/* Tag */}
                        {photo.reportType && (
                          <span style={{
                            fontSize: 9, color: "#fff", fontWeight: 700,
                            background: tagColor(photo.reportType),
                            padding: "1px 6px", borderRadius: 4,
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
          )}
        </div>
      )}
    </div>
  );
}
