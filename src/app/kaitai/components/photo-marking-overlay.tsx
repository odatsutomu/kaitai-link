"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Undo2, Trash2, Save, X, Loader2, Check,
} from "lucide-react";
import { T } from "../lib/design-tokens";

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
const MAX_OUTPUT_DIM = 2048;

// ─── Stroke type ────────────────────────────────────────────────────────────

type Stroke = {
  penId: string;
  color: string;
  points: { x: number; y: number }[];
};

// ─── Legend renderer ────────────────────────────────────────────────────────

function drawLegend(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  usedPenIds: Set<string>,
) {
  const usedPens = PENS.filter(p => usedPenIds.has(p.id));
  if (usedPens.length === 0) return;

  const padding = 12;
  const rowHeight = 22;
  const dotSize = 10;
  const fontSize = 14;
  const legendW = 200;
  const legendH = padding * 2 + usedPens.length * rowHeight;

  const x = canvasW - legendW - 16;
  const y = canvasH - legendH - 16;

  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = "#1E293B";
  ctx.beginPath();
  ctx.roundRect(x, y, legendW, legendH, 8);
  ctx.fill();
  ctx.globalAlpha = 1;

  usedPens.forEach((pen, i) => {
    const ry = y + padding + i * rowHeight;

    ctx.fillStyle = pen.legendColor;
    ctx.beginPath();
    ctx.arc(x + padding + dotSize / 2, ry + rowHeight / 2, dotSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(`${pen.shortLabel}`, x + padding + dotSize + 8, ry + rowHeight / 2);

    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = `${fontSize - 2}px sans-serif`;
    const descX = x + padding + dotSize + 8 + ctx.measureText(pen.shortLabel).width + 8;
    if (descX + 20 < x + legendW) {
      let desc = pen.description;
      while (ctx.measureText(desc).width > legendW - (descX - x) - padding && desc.length > 0) {
        desc = desc.slice(0, -1);
      }
      if (desc.length < pen.description.length) desc += "…";
      ctx.fillText(desc, descX, ry + rowHeight / 2);
    }
  });

  ctx.restore();
}

// ─── Export: apply marks to data URL and return new data URL ────────────────

export function applyMarksToDataUrl(
  imageDataUrl: string,
  strokes: Stroke[],
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let outW = img.width;
      let outH = img.height;
      if (outW > MAX_OUTPUT_DIM || outH > MAX_OUTPUT_DIM) {
        if (outW > outH) {
          outH = Math.round(outH * (MAX_OUTPUT_DIM / outW));
          outW = MAX_OUTPUT_DIM;
        } else {
          outW = Math.round(outW * (MAX_OUTPUT_DIM / outH));
          outH = MAX_OUTPUT_DIM;
        }
      }

      const outCanvas = document.createElement("canvas");
      outCanvas.width = outW;
      outCanvas.height = outH;
      const ctx = outCanvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, outW, outH);

      // Scale strokes proportionally
      const scaleX = outW / img.width;
      const scaleY = outH / img.height;
      const scaledBrushWidth = BRUSH_WIDTH * Math.max(scaleX, scaleY) * (img.width / outW > 1 ? 1 : outW / img.width);

      const usedPenIds = new Set<string>();
      for (const stroke of strokes) {
        if (stroke.points.length < 2) continue;
        usedPenIds.add(stroke.penId);
        ctx.save();
        ctx.globalAlpha = BRUSH_OPACITY;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = scaledBrushWidth || BRUSH_WIDTH;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x * scaleX, stroke.points[i].y * scaleY);
        }
        ctx.stroke();
        ctx.restore();
      }

      if (usedPenIds.size > 0) {
        drawLegend(ctx, outW, outH, usedPenIds);
      }

      resolve(outCanvas.toDataURL("image/jpeg", 0.80));
    };
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = imageDataUrl;
  });
}

// ─── Props ──────────────────────────────────────────────────────────────────

type PhotoMarkingOverlayProps = {
  /** data URL of the image to mark */
  imageDataUrl: string;
  /** Called when user saves (with or without marks). Returns the final data URL */
  onComplete: (dataUrl: string) => void;
  /** Called when user cancels (discards the photo entirely) */
  onCancel: () => void;
};

// ─── Main overlay component ─────────────────────────────────────────────────

export default function PhotoMarkingOverlay({
  imageDataUrl,
  onComplete,
  onCancel,
}: PhotoMarkingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePen, setActivePen] = useState<string>("danger");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [saving, setSaving] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const imgDims = useRef({ w: 0, h: 0, displayW: 0, displayH: 0, offsetX: 0, offsetY: 0 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  // Compute layout
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

  // Redraw
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imgRef.current;
    if (!canvas || !ctx || !img) return;

    const { displayW, displayH, offsetX, offsetY } = imgDims.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, offsetX, offsetY, displayW, displayH);

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;
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
  }, [strokes, currentStroke]);

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

  // ── Touch/Mouse handlers ──

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
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
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

  // ── Save ──

  async function handleSave() {
    setSaving(true);
    try {
      if (strokes.length === 0) {
        // No marks — return original image as-is
        onComplete(imageDataUrl);
        return;
      }

      // Convert display-coordinate strokes to image-coordinate strokes
      const { displayW, displayH, offsetX, offsetY } = imgDims.current;
      const img = imgRef.current!;
      const imgStrokes: Stroke[] = strokes.map(s => ({
        ...s,
        points: s.points.map(p => ({
          x: (p.x - offsetX) * (img.width / displayW),
          y: (p.y - offsetY) * (img.height / displayH),
        })),
      }));

      const result = await applyMarksToDataUrl(imageDataUrl, imgStrokes);
      onComplete(result);
    } catch {
      alert("マーキングの適用に失敗しました");
      setSaving(false);
    }
  }

  // ── Skip marking — use original ──

  function handleSkip() {
    onComplete(imageDataUrl);
  }

  const currentPenDef = PENS.find(p => p.id === activePen) ?? PENS[0];
  const hasStrokes = strokes.length > 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: T.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 flex-shrink-0"
        style={{
          padding: "8px 12px",
          background: "#fff",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <button
          onClick={onCancel}
          className="flex items-center justify-center rounded-xl"
          style={{ width: 38, height: 38, background: T.bg, border: `1px solid ${T.border}` }}
        >
          <X size={18} style={{ color: T.sub }} />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 15, fontWeight: 700, color: T.text }}>写真マーキング</p>
          <p style={{ fontSize: 12, color: T.muted }}>マーキング不要ならスキップ</p>
        </div>
        <button
          onClick={handleSkip}
          className="px-3 py-2 rounded-lg"
          style={{
            fontSize: 13, fontWeight: 700,
            background: T.bg, color: T.sub,
            border: `1px solid ${T.border}`,
          }}
        >
          スキップ
        </button>
      </div>

      {/* ── Loading state ── */}
      {!imgLoaded && (
        <div className="flex-1 flex items-center justify-center" style={{ color: T.muted }}>
          <Loader2 size={24} className="animate-spin" style={{ marginRight: 8 }} />
          画像を読み込み中...
        </div>
      )}

      {/* ── Canvas area ── */}
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

            {/* Active pen indicator */}
            <div
              className="absolute top-3 left-3 flex items-center gap-2 px-3 py-2 rounded-full"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            >
              <div className="rounded-full" style={{ width: 12, height: 12, background: currentPenDef.color }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {currentPenDef.label}
              </span>
            </div>

            {/* Undo / Clear */}
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
          </div>

          {/* ── Pen toolbar ── */}
          <div
            style={{
              background: "#fff",
              borderTop: `1px solid ${T.border}`,
              padding: "10px 12px calc(10px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            {/* Pen selection */}
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
                      background: isActive ? `${pen.color}15` : T.bg,
                      border: isActive ? `2.5px solid ${pen.color}` : `1.5px solid ${T.border}`,
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
                      color: isActive ? pen.color : T.sub,
                    }}>
                      {pen.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Description */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="rounded-full" style={{ width: 8, height: 8, background: currentPenDef.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: T.sub }}>{currentPenDef.description}</span>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold"
              style={{
                fontSize: 15,
                background: saving ? T.muted : hasStrokes ? "#059669" : T.primary,
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
