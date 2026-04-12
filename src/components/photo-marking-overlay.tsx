"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Undo2, Trash2, Save, X, Loader2, Check,
} from "lucide-react";

// ─── Default colors (can be overridden via props) ─────────────────────────

const DEFAULTS = {
  bg: "#F9FAFB",
  text: "#1E293B",
  sub: "#6B7280",
  muted: "#9CA3AF",
  border: "#E5E7EB",
  primary: "#B45309",
} as const;

// ─── Semantic pen definitions ───────────────────────────────────────────────

type PenDef = {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  legendColor: string;
  description: string;
};

const PENS: PenDef[] = [
  {
    id: "danger",
    label: "危険・キズ",
    shortLabel: "危険",
    color: "#EF4444",
    legendColor: "#EF4444",
    description: "既存クラック、活線、地中障害物、アスベスト",
  },
  {
    id: "keep",
    label: "残す・保護",
    shortLabel: "残す",
    color: "#22C55E",
    legendColor: "#22C55E",
    description: "残置物、境界ブロック、庭木",
  },
  {
    id: "demolish",
    label: "解体範囲",
    shortLabel: "解体",
    color: "#3B82F6",
    legendColor: "#3B82F6",
    description: "ここから壊す、縁切りライン",
  },
  {
    id: "caution",
    label: "注意・確認",
    shortLabel: "注意",
    color: "#EAB308",
    legendColor: "#EAB308",
    description: "確認事項、後工程への申し送り",
  },
];

const BRUSH_WIDTH = 8;
const BRUSH_OPACITY = 0.55;

// ─── Stroke type ────────────────────────────────────────────────────────────

type Stroke = {
  penId: string;
  color: string;
  points: { x: number; y: number }[];
  comment?: string;
};

// ─── Legend renderer ────────────────────────────────────────────────────────

function drawLegend(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  usedPenIds: Set<string>,
  cautionComments: string[],
) {
  const usedPens = PENS.filter(p => usedPenIds.has(p.id));
  if (usedPens.length === 0) return;

  const padding = 14;
  const rowHeight = 24;
  const dotSize = 10;
  const fontSize = 14;
  const descFontSize = 12;
  const margin = 16;

  ctx.save();

  ctx.font = `bold ${fontSize}px sans-serif`;
  let maxW = 0;
  const rows: { pen: PenDef; desc: string }[] = [];
  for (const pen of usedPens) {
    let desc = pen.description;
    if (pen.id === "caution" && cautionComments.length > 0) {
      desc = cautionComments.join("、");
    }
    rows.push({ pen, desc });
    const labelW = ctx.measureText(pen.shortLabel).width;
    ctx.font = `${descFontSize}px sans-serif`;
    const descW = ctx.measureText(desc).width;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const totalW = padding + dotSize + 8 + labelW + 10 + descW + padding;
    if (totalW > maxW) maxW = totalW;
  }

  const legendW = Math.min(Math.max(maxW, 180), canvasW - margin * 2);
  const legendH = padding * 2 + rows.length * rowHeight;

  const x = margin;
  const y = canvasH - legendH - margin;

  ctx.globalAlpha = 0.85;
  ctx.fillStyle = "#1E293B";
  ctx.beginPath();
  ctx.roundRect(x, y, legendW, legendH, 8);
  ctx.fill();
  ctx.globalAlpha = 1;

  rows.forEach((row, i) => {
    const ry = y + padding + i * rowHeight;

    ctx.fillStyle = row.pen.legendColor;
    ctx.beginPath();
    ctx.arc(x + padding + dotSize / 2, ry + rowHeight / 2, dotSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = "middle";
    const labelX = x + padding + dotSize + 8;
    ctx.fillText(row.pen.shortLabel, labelX, ry + rowHeight / 2);

    const descX = labelX + ctx.measureText(row.pen.shortLabel).width + 10;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `${descFontSize}px sans-serif`;
    const availW = legendW - (descX - x) - padding;
    let desc = row.desc;
    if (ctx.measureText(desc).width > availW && availW > 30) {
      while (ctx.measureText(desc + "…").width > availW && desc.length > 0) {
        desc = desc.slice(0, -1);
      }
      desc += "…";
    }
    ctx.fillText(desc, descX, ry + rowHeight / 2);
  });

  ctx.restore();
}

// ─── Canvas → Blob ──────────────────────────────────────────────────────────

function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.6): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          try {
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            const b64 = dataUrl.split(",")[1];
            const bytes = atob(b64);
            const arr = new Uint8Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
            resolve(new Blob([arr], { type: "image/jpeg" }));
          } catch {
            reject(new Error("Blob 変換に失敗しました"));
          }
        }
      },
      "image/jpeg",
      quality,
    );
  });
}

// ─── Props ──────────────────────────────────────────────────────────────────

type ColorOverrides = {
  bg?: string;
  text?: string;
  sub?: string;
  muted?: string;
  border?: string;
  primary?: string;
};

type PhotoMarkingOverlayProps = {
  imageBlob: Blob;
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
  /** Override default colors */
  colors?: ColorOverrides;
};

// ─── Main overlay component ─────────────────────────────────────────────────

export default function PhotoMarkingOverlay({
  imageBlob,
  onComplete,
  onCancel,
  colors,
}: PhotoMarkingOverlayProps) {
  const C = { ...DEFAULTS, ...colors };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePen, setActivePen] = useState<string>("danger");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [saving, setSaving] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [cautionComment, setCautionComment] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [pendingCautionStroke, setPendingCautionStroke] = useState<Stroke | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const imgDims = useRef({ w: 0, h: 0, displayW: 0, displayH: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(imageBlob);
    blobUrlRef.current = url;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = url;
    return () => {
      URL.revokeObjectURL(url);
      blobUrlRef.current = null;
    };
  }, [imageBlob]);

  const computeLayout = useCallback(() => {
    if (!imgRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    const img = imgRef.current;

    const scale = Math.min(containerW / img.width, containerH / img.height);
    const displayW = Math.round(img.width * scale);
    const displayH = Math.round(img.height * scale);
    const offsetX = Math.round((containerW - displayW) / 2);
    const offsetY = Math.round((containerH - displayH) / 2);

    imgDims.current = { w: img.width, h: img.height, displayW, displayH, offsetX, offsetY };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = containerW;
      canvas.height = containerH;
    }
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imgRef.current;
    if (!canvas || !ctx || !img) return;

    const { displayW, displayH, offsetX, offsetY } = imgDims.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, offsetX, offsetY, displayW, displayH);

    const allStrokes = [
      ...strokes,
      ...(pendingCautionStroke ? [pendingCautionStroke] : []),
      ...(currentStroke ? [currentStroke] : []),
    ];
    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.save();
      ctx.globalAlpha = BRUSH_OPACITY;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = BRUSH_WIDTH;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [strokes, currentStroke, pendingCautionStroke]);

  useEffect(() => {
    if (imgLoaded) {
      computeLayout();
      redraw();
    }
  }, [imgLoaded, computeLayout, redraw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      computeLayout();
      redraw();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [computeLayout, redraw]);

  useEffect(() => { redraw(); }, [redraw]);

  function getCanvasPos(e: React.TouchEvent | React.MouseEvent): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function handleDrawStart(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    const pos = getCanvasPos(e);
    if (!pos) return;
    const pen = PENS.find(p => p.id === activePen) ?? PENS[0];
    setCurrentStroke({ penId: pen.id, color: pen.color, points: [pos] });
  }

  function handleDrawMove(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    if (!currentStroke) return;
    const pos = getCanvasPos(e);
    if (!pos) return;
    setCurrentStroke(prev => prev ? { ...prev, points: [...prev.points, pos] } : null);
  }

  function handleDrawEnd(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    if (currentStroke && currentStroke.points.length >= 2) {
      if (currentStroke.penId === "caution") {
        setPendingCautionStroke(currentStroke);
        setCautionComment("");
        setShowCommentInput(true);
      } else {
        setStrokes(prev => [...prev, currentStroke]);
      }
    }
    setCurrentStroke(null);
  }

  function handleConfirmCaution() {
    if (pendingCautionStroke) {
      setStrokes(prev => [...prev, { ...pendingCautionStroke, comment: cautionComment || undefined }]);
    }
    setPendingCautionStroke(null);
    setShowCommentInput(false);
    setCautionComment("");
  }

  function handleCancelCaution() {
    setPendingCautionStroke(null);
    setShowCommentInput(false);
    setCautionComment("");
  }

  function handleUndo() {
    setStrokes(prev => prev.slice(0, -1));
  }

  function handleClear() {
    if (strokes.length === 0) return;
    if (confirm("すべてのマーキングを消去しますか？")) {
      setStrokes([]);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (strokes.length === 0) {
        onComplete(imageBlob);
        return;
      }

      const img = imgRef.current!;
      const { displayW, displayH, offsetX, offsetY } = imgDims.current;

      const outCanvas = document.createElement("canvas");
      outCanvas.width = img.width;
      outCanvas.height = img.height;
      const ctx = outCanvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const scaleX = img.width / displayW;
      const scaleY = img.height / displayH;
      const scaledBrushWidth = BRUSH_WIDTH * Math.max(scaleX, scaleY);

      const usedPenIds = new Set<string>();
      for (const stroke of strokes) {
        if (stroke.points.length < 2) continue;
        usedPenIds.add(stroke.penId);
        ctx.save();
        ctx.globalAlpha = BRUSH_OPACITY;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = scaledBrushWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        const p0 = stroke.points[0];
        ctx.moveTo((p0.x - offsetX) * scaleX, (p0.y - offsetY) * scaleY);
        for (let i = 1; i < stroke.points.length; i++) {
          const p = stroke.points[i];
          ctx.lineTo((p.x - offsetX) * scaleX, (p.y - offsetY) * scaleY);
        }
        ctx.stroke();
        ctx.restore();
      }

      if (usedPenIds.size > 0) {
        const cautionComments = strokes
          .filter(s => s.penId === "caution" && s.comment)
          .map(s => s.comment!);
        drawLegend(ctx, img.width, img.height, usedPenIds, cautionComments);
      }

      const blob = await canvasToBlob(outCanvas, 0.6);
      onComplete(blob);
    } catch {
      alert("マーキングの適用に失敗しました");
      setSaving(false);
    }
  }

  function handleSkip() {
    onComplete(imageBlob);
  }

  const currentPenDef = PENS.find(p => p.id === activePen) ?? PENS[0];
  const hasStrokes = strokes.length > 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 flex-shrink-0"
        style={{
          padding: "8px 12px",
          background: "#fff",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <button
          onClick={onCancel}
          className="flex items-center justify-center rounded-xl"
          style={{ width: 38, height: 38, background: C.bg, border: `1px solid ${C.border}` }}
        >
          <X size={18} style={{ color: C.sub }} />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>写真マーキング</p>
          <p style={{ fontSize: 12, color: C.muted }}>マーキング不要ならスキップ</p>
        </div>
        <button
          onClick={handleSkip}
          className="px-3 py-2 rounded-lg"
          style={{
            fontSize: 13, fontWeight: 700,
            background: C.bg, color: C.sub,
            border: `1px solid ${C.border}`,
          }}
        >
          スキップ
        </button>
      </div>

      {!imgLoaded && (
        <div className="flex-1 flex items-center justify-center" style={{ color: C.muted }}>
          <Loader2 size={24} className="animate-spin" style={{ marginRight: 8 }} />
          画像を読み込み中...
        </div>
      )}

      {imgLoaded && (
        <>
          <div
            ref={containerRef}
            className="flex-1 relative"
            style={{
              background: "#1E293B",
              touchAction: "none",
              userSelect: "none",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <canvas
              ref={canvasRef}
              onTouchStart={handleDrawStart}
              onTouchMove={handleDrawMove}
              onTouchEnd={handleDrawEnd}
              onMouseDown={handleDrawStart}
              onMouseMove={(e) => { if (e.buttons === 1) handleDrawMove(e); }}
              onMouseUp={handleDrawEnd}
              onMouseLeave={handleDrawEnd}
              style={{ width: "100%", height: "100%", cursor: "crosshair" }}
            />

            <div
              className="absolute top-3 left-3 flex items-center gap-2 px-3 py-2 rounded-full"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            >
              <div className="rounded-full" style={{ width: 12, height: 12, background: currentPenDef.color }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {currentPenDef.label}
              </span>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={!hasStrokes}
                className="flex items-center gap-1 px-3 py-2 rounded-full"
                style={{
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(8px)",
                  color: hasStrokes ? "#fff" : "rgba(255,255,255,0.3)",
                  fontSize: 13, fontWeight: 600,
                }}
              >
                <Undo2 size={15} /> 戻す
              </button>
              <button
                onClick={handleClear}
                disabled={!hasStrokes}
                className="flex items-center gap-1 px-3 py-2 rounded-full"
                style={{
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(8px)",
                  color: hasStrokes ? "#fff" : "rgba(255,255,255,0.3)",
                  fontSize: 13, fontWeight: 600,
                }}
              >
                <Trash2 size={15} /> 全消去
              </button>
            </div>

            {showCommentInput && (
              <div
                className="absolute inset-0 flex items-end justify-center"
                style={{ background: "rgba(0,0,0,0.5)", zIndex: 10 }}
              >
                <div
                  className="w-full rounded-t-2xl"
                  style={{
                    background: "#fff",
                    padding: "20px 16px calc(16px + env(safe-area-inset-bottom, 0px))",
                    maxWidth: 480,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="rounded-full" style={{ width: 12, height: 12, background: "#EAB308" }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                      注意コメントを入力
                    </span>
                    <span style={{ fontSize: 12, color: C.muted }}>（任意）</span>
                  </div>
                  <input
                    type="text"
                    value={cautionComment}
                    onChange={(e) => setCautionComment(e.target.value)}
                    placeholder="例: 隣家の壁に近い、養生必要"
                    autoFocus
                    className="w-full rounded-xl outline-none mb-3"
                    style={{
                      height: 48,
                      fontSize: 15,
                      padding: "0 14px",
                      border: `2px solid #EAB308`,
                      color: C.text,
                      background: "#FEFCE8",
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleConfirmCaution(); }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelCaution}
                      className="flex-1 py-3 rounded-xl font-bold"
                      style={{ fontSize: 14, background: C.bg, color: C.sub, border: `1px solid ${C.border}` }}
                    >
                      取消
                    </button>
                    <button
                      onClick={handleConfirmCaution}
                      className="flex-1 py-3 rounded-xl font-bold"
                      style={{ fontSize: 14, background: "#EAB308", color: "#fff", minHeight: 48 }}
                    >
                      {cautionComment ? "コメント付きで確定" : "コメントなしで確定"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pen toolbar */}
          <div
            style={{
              background: "#fff",
              borderTop: `1px solid ${C.border}`,
              padding: "10px 12px calc(10px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            <div className="flex gap-2 mb-2">
              {PENS.map(pen => {
                const isActive = activePen === pen.id;
                return (
                  <button
                    key={pen.id}
                    onClick={() => setActivePen(pen.id)}
                    className="flex-1 flex flex-col items-center gap-1 rounded-xl"
                    style={{
                      padding: "8px 4px",
                      minHeight: 52,
                      background: isActive ? `${pen.color}15` : C.bg,
                      border: isActive ? `2.5px solid ${pen.color}` : `1.5px solid ${C.border}`,
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: 18, height: 18,
                        background: pen.color,
                        boxShadow: isActive ? `0 0 0 3px ${pen.color}40` : "none",
                      }}
                    />
                    <span style={{
                      fontSize: 11, fontWeight: 800,
                      color: isActive ? pen.color : C.sub,
                    }}>
                      {pen.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="rounded-full" style={{ width: 8, height: 8, background: currentPenDef.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: C.sub }}>{currentPenDef.description}</span>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold"
              style={{
                fontSize: 15,
                background: saving ? C.muted : hasStrokes ? "#059669" : C.primary,
                color: "#fff",
                opacity: saving ? 0.6 : 1,
                minHeight: 48,
              }}
            >
              {saving ? (
                <><Loader2 size={18} className="animate-spin" /> 保存中...</>
              ) : hasStrokes ? (
                <><Save size={18} /> マーキングして保存</>
              ) : (
                <><Check size={18} /> そのまま保存</>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
