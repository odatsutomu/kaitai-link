"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Camera, ImagePlus, Loader2,
} from "lucide-react";
import Link from "next/link";
import { T } from "../../lib/design-tokens";
import PhotoMarkingOverlay from "../../components/photo-marking-overlay";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fileToDataUrl(file: File, maxDim = 1920): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
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
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像の読み込みに失敗しました"));
    };
    img.src = objectUrl;
  });
}

// Pen definitions for display only (shared with overlay component)
const PENS = [
  { id: "danger", label: "危険・キズ", color: "#EF4444", description: "既存クラック、活線、地中障害物、アスベスト" },
  { id: "keep", label: "残す・保護", color: "#22C55E", description: "残置物、境界ブロック、庭木" },
  { id: "demolish", label: "解体範囲", color: "#3B82F6", description: "ここから壊す、縁切りライン" },
  { id: "caution", label: "注意・確認", color: "#EAB308", description: "確認事項、後工程への申し送り" },
];

// ─── Page component ─────────────────────────────────────────────────────────

export default function PhotoMarkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteId = searchParams.get("siteId") ?? searchParams.get("site") ?? "";
  const siteName = searchParams.get("name") ?? "";
  const reportType = searchParams.get("type") ?? "marked_photo";

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setImageDataUrl(dataUrl);
    } catch {
      alert("画像の読み込みに失敗しました");
    }
    e.target.value = "";
  }

  async function handleMarkingComplete(finalDataUrl: string) {
    // Upload the final image (with or without marks)
    setUploading(true);
    try {
      const res = await fetch("/api/kaitai/upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl: finalDataUrl,
          siteId: siteId || undefined,
          reportType: reportType || "marked_photo",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "アップロードに失敗しました");
        setUploading(false);
        return;
      }

      // Navigate back after successful upload
      if (siteId) {
        router.push(`/kaitai/site/${siteId}`);
      } else {
        router.push("/kaitai/report");
      }
    } catch {
      alert("保存に失敗しました");
      setUploading(false);
    }
  }

  function handleMarkingCancel() {
    setImageDataUrl(null);
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
      </div>

      {/* ── Uploading state ── */}
      {uploading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 size={36} className="animate-spin" style={{ color: T.primary }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: T.text }}>アップロード中...</p>
        </div>
      )}

      {/* ── Photo selection screen ── */}
      {!uploading && !imageDataUrl && (
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
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (ev) => {
                const file = (ev.target as HTMLInputElement).files?.[0];
                if (file) {
                  fileToDataUrl(file).then(setImageDataUrl).catch(() => alert("画像の読み込みに失敗しました"));
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

      {/* ── Marking overlay ── */}
      {!uploading && imageDataUrl && (
        <PhotoMarkingOverlay
          imageDataUrl={imageDataUrl}
          onComplete={handleMarkingComplete}
          onCancel={handleMarkingCancel}
        />
      )}
    </div>
  );
}
