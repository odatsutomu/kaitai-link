"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Camera, ImagePlus, Loader2, AlertTriangle, RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { T } from "../../lib/design-tokens";
import PhotoMarkingOverlay from "../../components/photo-marking-overlay";

// ─── Compress File → Blob + dataUrl ─────────────────────────────────────────

function compressImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  const MAX_DIM = 1024;
  const QUALITY = 0.6;
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objectUrl);

      const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ blob, dataUrl });
          else {
            // fallback
            const b64 = dataUrl.split(",")[1];
            const bytes = atob(b64);
            const arr = new Uint8Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
            resolve({ blob: new Blob([arr], { type: "image/jpeg" }), dataUrl });
          }
        },
        "image/jpeg",
        QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像の読み込みに失敗しました"));
    };
    img.src = objectUrl;
  });
}

// ── Upload with retry + dual strategy ──

async function uploadWithRetry(
  blob: Blob,
  params: { siteId?: string; reportType?: string },
  maxRetries = 3,
): Promise<void> {
  // Get dataUrl for JSON fallback
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  let lastError = "";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Try FormData
    try {
      const formData = new FormData();
      formData.append("file", blob, "marked_photo.jpg");
      if (params.siteId) formData.append("siteId", params.siteId);
      if (params.reportType) formData.append("reportType", params.reportType);

      const res = await fetch("/api/kaitai/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) return;

      const errData = await res.json().catch(() => ({}));
      lastError = errData.detail || errData.error || `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "ネットワークエラー";
    }

    // Try JSON fallback
    try {
      const res = await fetch("/api/kaitai/upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl,
          siteId: params.siteId,
          reportType: params.reportType,
        }),
      });

      if (res.ok) return;

      const errData = await res.json().catch(() => ({}));
      lastError = errData.detail || errData.error || `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "ネットワークエラー";
    }

    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  throw new Error(lastError || "アップロードに失敗しました");
}

// Pen definitions for display only
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

  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const lastBlobRef = useRef<Blob | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { blob } = await compressImage(file);
      setImageBlob(blob);
      setUploadError(null);
    } catch {
      alert("画像の読み込みに失敗しました");
    }
    e.target.value = "";
  }

  async function doUpload(blob: Blob) {
    setUploading(true);
    setUploadError(null);
    lastBlobRef.current = blob;

    try {
      await uploadWithRetry(blob, {
        siteId: siteId || undefined,
        reportType: reportType || "marked_photo",
      });

      if (siteId) {
        router.push(`/kaitai/site/${siteId}`);
      } else {
        router.push("/kaitai/report");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "不明なエラー";
      setUploadError(msg);
      setUploading(false);
    }
  }

  function handleMarkingComplete(finalBlob: Blob) {
    setImageBlob(null);
    doUpload(finalBlob);
  }

  function handleMarkingCancel() {
    setImageBlob(null);
  }

  function handleRetry() {
    if (lastBlobRef.current) {
      doUpload(lastBlobRef.current);
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
      </div>

      {/* ── Uploading / Error state ── */}
      {uploading && !uploadError && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 size={36} className="animate-spin" style={{ color: T.primary }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: T.text }}>アップロード中...</p>
          <p style={{ fontSize: 13, color: T.muted }}>自動リトライ中（最大3回）</p>
        </div>
      )}

      {uploadError && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 72, height: 72, background: "rgba(239,68,68,0.1)" }}
          >
            <AlertTriangle size={36} style={{ color: "#EF4444" }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: T.text }}>アップロード失敗</p>
          <p style={{ fontSize: 13, color: T.sub, textAlign: "center" }}>
            {uploadError}
          </p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold"
            style={{ fontSize: 15, background: T.primary, color: "#fff" }}
          >
            <RotateCcw size={18} /> 再試行
          </button>
          <button
            onClick={() => { setUploadError(null); setUploading(false); }}
            className="px-4 py-2 rounded-lg"
            style={{ fontSize: 13, color: T.sub }}
          >
            やり直す
          </button>
        </div>
      )}

      {/* ── Photo selection screen ── */}
      {!uploading && !uploadError && !imageBlob && (
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

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full max-w-sm flex items-center justify-center gap-3 py-4 rounded-xl font-bold"
            style={{ fontSize: 17, background: T.primary, color: "#fff", minHeight: 56 }}
          >
            <Camera size={22} /> 写真を撮影
          </button>

          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (ev) => {
                const file = (ev.target as HTMLInputElement).files?.[0];
                if (file) {
                  compressImage(file)
                    .then(({ blob }) => { setImageBlob(blob); setUploadError(null); })
                    .catch(() => alert("画像の読み込みに失敗しました"));
                }
              };
              input.click();
            }}
            className="w-full max-w-sm flex items-center justify-center gap-3 py-4 rounded-xl font-bold"
            style={{
              fontSize: 17, background: "#fff", color: T.text,
              border: `1px solid ${T.border}`, minHeight: 56,
            }}
          >
            <ImagePlus size={22} style={{ color: T.sub }} /> ギャラリーから選択
          </button>

          {/* Pen legend */}
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
                  <div className="rounded-full flex-shrink-0" style={{ width: 16, height: 16, background: pen.color }} />
                  <div className="flex-1 min-w-0">
                    <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{pen.label}</span>
                    <span style={{ fontSize: 13, color: T.muted, marginLeft: 8 }}>{pen.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

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

      {/* Marking overlay */}
      {!uploading && !uploadError && imageBlob && (
        <PhotoMarkingOverlay
          imageBlob={imageBlob}
          onComplete={handleMarkingComplete}
          onCancel={handleMarkingCancel}
        />
      )}
    </div>
  );
}
