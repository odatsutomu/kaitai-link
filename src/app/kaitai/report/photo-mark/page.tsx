"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Undo2, Trash2, Save, Camera,
  ImagePlus, Check, Loader2, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { T } from "../../lib/design-tokens";

// ─── Semantic pen definitions ───────────────────────────────────────────────

type PenDef = {
  id: string;
  label: string;
  shortLabel: string;
  color: string;       // hex for canvas
  legendColor: string;  // same for legend
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
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function fileToDataUrl(file: File, maxDim = 1920): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * (maxDim / w)); w = maxDim; }
          else { w = Math.round(w * (maxDim / h)); h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

  // Background
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = "#1E293B";
  ctx.beginPath();
  ctx.roundRect(x, y, legendW, legendH, 8);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Title
  // Rows
  usedPens.forEach((pen, i) => {
    const ry = y + padding + i * rowHeight;

    // Color dot
    ctx.fillStyle = pen.legendColor;
    ctx.beginPath();
    ctx.arc(x + padding + dotSize / 2, ry + rowHeight / 2, dotSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(`${pen.shortLabel}`, x + padding + dotSize + 8, ry + rowHeight / 2);

    // Description (smaller)
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = `${fontSize - 2}px sans-serif`;
    const descX = x + padding + dotSize + 8 + ctx.measureText(pen.shortLabel).width + 8;
    // Only if fits
    if (descX + 20 < x + legendW) {
      // Truncate
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

// ─── Main drawing canvas component ──────────────────────────────────────────

function MarkingCanvas({
  imageUrl,
  siteId,
  reportType,
  onSaved,
}: {
  imageUrl: string;
  siteId: string;
  reportType: string;
  onSaved: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePen, setActivePen] = useState<string>("danger");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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
    img.src = imageUrl;
  }, [imageUrl]);

  // Compute display dimensions for the image within canvas
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

    // Draw image
    ctx.drawImage(img, offsetX, offsetY, displayW, displayH);

    // Draw strokes (highlighter style)
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

  // Resize observer
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

  // Redraw on stroke change
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
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
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

  // ── Undo / Clear ──

  function handleUndo() {
    setStrokes(prev => prev.slice(0, -1));
  }

  function handleClear() {
    if (strokes.length === 0) return;
    if (confirm("すべてのマーキングを消去しますか？")) {
      setStrokes([]);
    }
  }

  // ── Save with legend ──

  async function handleSave() {
    const img = imgRef.current;
    if (!img) return;
    setSaving(true);

    try {
      // Create output canvas at original image resolution
      const outCanvas = document.createElement("canvas");
      outCanvas.width = img.width;
      outCanvas.height = img.height;
      const ctx = outCanvas.getContext("2d")!;

      // Draw original image
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Scale strokes from display coords to original coords
      const { displayW, displayH, offsetX, offsetY } = imgDims.current;
      const scaleX = img.width / displayW;
      const scaleY = img.height / displayH;

      // Compute scaled brush width
      const scaledBrushWidth = BRUSH_WIDTH * Math.max(scaleX, scaleY);

      // Draw strokes
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

      // Draw legend watermark
      if (usedPenIds.size > 0) {
        drawLegend(ctx, img.width, img.height, usedPenIds);
      }

      // Export as dataUrl
      const dataUrl = outCanvas.toDataURL("image/jpeg", 0.90);

      // Upload
      const res = await fetch("/api/kaitai/upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl,
          siteId: siteId || undefined,
          reportType: reportType || "marked_photo",
          uploadedBy: undefined, // API will use session user
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "アップロードに失敗しました");
        setSaving(false);
        return;
      }

      setSaved(true);
      setTimeout(() => onSaved(), 1500);
    } catch {
      alert("保存に失敗しました");
      setSaving(false);
    }
  }

  const currentPenDef = PENS.find(p => p.id === activePen) ?? PENS[0];
  const hasStrokes = strokes.length > 0;

  if (!imgLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: T.muted }}>
        <Loader2 size={24} className="animate-spin" style={{ marginRight: 8 }} />
        画像を読み込み中...
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 72, height: 72, background: "rgba(5,150,105,0.1)" }}
        >
          <Check size={36} style={{ color: "#059669" }} />
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: T.text }}>保存しました</p>
        <p style={{ fontSize: 14, color: T.sub }}>マーキング済み写真がアップロードされました</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>

      {/* ── Drawing area ── */}
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
          style={{
            width: "100%",
            height: "100%",
            cursor: "crosshair",
          }}
        />

        {/* Active pen indicator overlay */}
        <div
          className="absolute top-3 left-3 flex items-center gap-2 px-3 py-2 rounded-full"
          style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="rounded-full" style={{ width: 12, height: 12, background: currentPenDef.color }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
            {currentPenDef.label}
          </span>
        </div>

        {/* Undo / Clear overlay */}
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
          padding: "12px 12px calc(12px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Pen selection */}
        <div className="flex gap-2 mb-3">
          {PENS.map(pen => {
            const isActive = activePen === pen.id;
            return (
              <button
                key={pen.id}
                onClick={() => setActivePen(pen.id)}
                className="flex-1 flex flex-col items-center gap-1 rounded-xl"
                style={{
                  padding: "10px 4px",
                  minHeight: 56,
                  background: isActive ? `${pen.color}15` : T.bg,
                  border: isActive ? `2.5px solid ${pen.color}` : `1.5px solid ${T.border}`,
                  transition: "all 0.15s",
                }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: 20, height: 20,
                    background: pen.color,
                    boxShadow: isActive ? `0 0 0 3px ${pen.color}40` : "none",
                  }}
                />
                <span style={{
                  fontSize: 12, fontWeight: 800,
                  color: isActive ? pen.color : T.sub,
                }}>
                  {pen.shortLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected pen description */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="rounded-full" style={{ width: 8, height: 8, background: currentPenDef.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: T.sub }}>
            {currentPenDef.description}
          </span>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || (!hasStrokes)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold"
          style={{
            fontSize: 16,
            background: !hasStrokes ? T.muted : saving ? T.muted : "#059669",
            color: "#fff",
            opacity: saving ? 0.6 : 1,
            minHeight: 52,
          }}
        >
          {saving ? (
            <><Loader2 size={18} className="animate-spin" /> 保存中...</>
          ) : (
            <><Save size={18} /> マーキング写真を保存</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Page component ─────────────────────────────────────────────────────────

export default function PhotoMarkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteId = searchParams.get("siteId") ?? searchParams.get("site") ?? "";
  const siteName = searchParams.get("name") ?? "";
  const reportType = searchParams.get("type") ?? "marked_photo";

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setImageUrl(dataUrl);
    } catch {
      alert("画像の読み込みに失敗しました");
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function handleSaved() {
    // Navigate back
    if (siteId) {
      router.push(`/kaitai/site/${siteId}`);
    } else {
      router.push("/kaitai/report");
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: T.bg }}>
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 flex-shrink-0"
        style={{
          padding: "12px 16px",
          background: "#fff",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <Link
          href={siteId ? `/kaitai/site/${siteId}` : "/kaitai/report"}
          className="flex items-center justify-center rounded-xl"
          style={{ width: 40, height: 40, background: T.bg, border: `1px solid ${T.border}` }}
        >
          <ArrowLeft size={18} style={{ color: T.sub }} />
        </Link>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 16, fontWeight: 700, color: T.text }}>写真マーキング</p>
          {siteName && (
            <p style={{
              fontSize: 13, color: T.muted,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {siteName}
            </p>
          )}
        </div>
        {imageUrl && (
          <button
            onClick={() => setImageUrl(null)}
            className="px-3 py-2 rounded-lg"
            style={{
              fontSize: 13, fontWeight: 700,
              background: T.bg, color: T.sub,
              border: `1px solid ${T.border}`,
            }}
          >
            写真を変更
          </button>
        )}
      </div>

      {/* ── Main content ── */}
      {imageUrl ? (
        <MarkingCanvas
          imageUrl={imageUrl}
          siteId={siteId}
          reportType={reportType}
          onSaved={handleSaved}
        />
      ) : (
        /* ── Photo selection screen ── */
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="text-center mb-4">
            <div
              className="flex items-center justify-center rounded-full mx-auto mb-4"
              style={{ width: 80, height: 80, background: T.primaryLt }}
            >
              <Camera size={36} style={{ color: T.primary }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 8 }}>
              写真を選んでマーキング
            </h2>
            <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.6 }}>
              写真を撮影または選択して、意味付きカラーペンで
              <br />危険箇所や残置物などをマーキングできます
            </p>
          </div>

          {/* Camera button */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full max-w-sm flex items-center justify-center gap-3 py-4 rounded-xl font-bold"
            style={{
              fontSize: 17,
              background: T.primary,
              color: "#fff",
              minHeight: 56,
            }}
          >
            <Camera size={22} /> 写真を撮影
          </button>

          {/* Gallery button */}
          <button
            onClick={() => {
              // Trigger file input without capture attribute for gallery
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (ev) => {
                const file = (ev.target as HTMLInputElement).files?.[0];
                if (file) {
                  fileToDataUrl(file).then(setImageUrl).catch(() => alert("画像の読み込みに失敗しました"));
                }
              };
              input.click();
            }}
            className="w-full max-w-sm flex items-center justify-center gap-3 py-4 rounded-xl font-bold"
            style={{
              fontSize: 17,
              background: "#fff",
              color: T.text,
              border: `1px solid ${T.border}`,
              minHeight: 56,
            }}
          >
            <ImagePlus size={22} style={{ color: T.sub }} /> ギャラリーから選択
          </button>

          {/* Pen legend preview */}
          <div
            className="w-full max-w-sm rounded-xl mt-4"
            style={{ background: "#fff", border: `1px solid ${T.border}`, padding: "16px 20px" }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: T.muted, marginBottom: 12 }}>
              使用できるペン
            </p>
            <div className="flex flex-col gap-3">
              {PENS.map(pen => (
                <div key={pen.id} className="flex items-center gap-3">
                  <div
                    className="rounded-full flex-shrink-0"
                    style={{ width: 16, height: 16, background: pen.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
                      {pen.label}
                    </span>
                    <span style={{ fontSize: 13, color: T.muted, marginLeft: 8 }}>
                      {pen.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hidden file input for camera */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>
      )}
    </div>
  );
}
