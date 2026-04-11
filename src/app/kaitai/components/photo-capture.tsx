"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, X, ImagePlus, Loader2 } from "lucide-react";
import { T } from "../lib/design-tokens";
import PhotoMarkingOverlay from "./photo-marking-overlay";

export type CapturedPhoto = {
  id?: string;
  url: string;
  uploading?: boolean;
  error?: boolean;
};

type Props = {
  siteId?: string;
  reportType: string;
  uploadedBy?: string;
  maxPhotos?: number;
  accentColor?: string;
  accentBg?: string;
  label?: string;
  placeholder?: string;
  /** Called whenever the photo list changes; receives uploaded photo ids */
  onPhotosChange?: (ids: string[]) => void;
};

// ── Compress image File → Blob (no base64, memory efficient) ──────────────

function compressImageFile(file: File, maxDim = 1280, quality = 0.75): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objectUrl);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("画像の圧縮に失敗しました"));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像の読み込みに失敗しました"));
    };
    img.src = objectUrl;
  });
}

// ── Create a preview thumbnail URL from Blob ──────────────────────────────

function createThumbUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export default function PhotoCapture({
  siteId,
  reportType,
  uploadedBy,
  maxPhotos = 5,
  accentColor = T.primary,
  accentBg = T.primaryLt,
  label = "現場写真",
  placeholder = "タップして写真を撮影・選択",
  onPhotosChange,
}: Props) {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  // ── Marking overlay state ──
  const [markingBlob, setMarkingBlob] = useState<Blob | null>(null);
  const [markingPreviewUrl, setMarkingPreviewUrl] = useState<string | null>(null);

  const notifyParent = useCallback((list: CapturedPhoto[]) => {
    onPhotosChange?.(list.filter(p => p.id).map(p => p.id!));
  }, [onPhotosChange]);

  const handleCapture = useCallback(() => {
    if (photos.length >= maxPhotos) return;
    fileRef.current?.click();
  }, [photos.length, maxPhotos]);

  // ── Upload a Blob via FormData (binary, no base64) ──
  const uploadBlob = useCallback(async (blob: Blob) => {
    const tempId = `tmp_${Date.now()}_${Math.random()}`;
    const thumbUrl = createThumbUrl(blob);

    // Add preview immediately
    setPhotos(prev => {
      if (prev.length >= maxPhotos) return prev;
      return [...prev, { url: thumbUrl, uploading: true, id: tempId }];
    });

    try {
      const formData = new FormData();
      formData.append("file", blob, "photo.jpg");
      if (siteId)     formData.append("siteId", siteId);
      if (reportType) formData.append("reportType", reportType);
      if (uploadedBy) formData.append("uploadedBy", uploadedBy);

      const res = await fetch("/api/kaitai/upload", {
        method: "POST",
        body: formData,
        // Note: don't set Content-Type — browser sets it with boundary automatically
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      setPhotos(prev => {
        const next = prev.map(p => {
          if (p.id === tempId) {
            // Revoke temp blob URL
            URL.revokeObjectURL(thumbUrl);
            return { id: data.image.id, url: data.image.url };
          }
          return p;
        });
        notifyParent(next);
        return next;
      });
    } catch {
      setPhotos(prev =>
        prev.map(p => p.id === tempId
          ? { ...p, uploading: false, error: true }
          : p
        )
      );
    }
  }, [maxPhotos, siteId, reportType, uploadedBy, notifyParent]);

  // ── File input handler → compress → open marking overlay ──
  const handleFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      const blob = await compressImageFile(file);
      const previewUrl = createThumbUrl(blob);
      setMarkingBlob(blob);
      setMarkingPreviewUrl(previewUrl);
    } catch {
      alert("画像の読み込みに失敗しました");
    }

    if (fileRef.current) fileRef.current.value = "";
  }, []);

  // ── Marking overlay callbacks ──
  const handleMarkingComplete = useCallback(async (resultBlob: Blob) => {
    // Clean up preview URL
    if (markingPreviewUrl) URL.revokeObjectURL(markingPreviewUrl);
    setMarkingBlob(null);
    setMarkingPreviewUrl(null);

    setBusy(true);
    await uploadBlob(resultBlob);
    setBusy(false);
  }, [uploadBlob, markingPreviewUrl]);

  const handleMarkingCancel = useCallback(() => {
    if (markingPreviewUrl) URL.revokeObjectURL(markingPreviewUrl);
    setMarkingBlob(null);
    setMarkingPreviewUrl(null);
  }, [markingPreviewUrl]);

  const handleRemove = useCallback(async (index: number) => {
    const photo = photos[index];

    // Revoke blob URL if it's a local preview
    if (photo.url.startsWith("blob:")) {
      URL.revokeObjectURL(photo.url);
    }

    setPhotos(prev => {
      const next = prev.filter((_, i) => i !== index);
      notifyParent(next);
      return next;
    });

    // Delete from R2 if uploaded
    if (photo.id && !photo.id.startsWith("tmp_")) {
      try {
        await fetch(`/api/kaitai/upload/${photo.id}`, { method: "DELETE" });
      } catch { /* best-effort */ }
    }
  }, [photos, notifyParent]);

  return (
    <div>
      <p className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: T.muted }}>
        {label}
      </p>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: 8,
          marginBottom: 10,
        }}>
          {photos.map((photo, i) => (
            <div
              key={photo.id ?? i}
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: 12,
                overflow: "hidden",
                border: photo.error ? "2px solid #EF4444" : `1px solid ${T.border}`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`写真 ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {photo.uploading && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0.4)",
                }}>
                  <Loader2 size={24} color="#FFF" className="animate-spin" />
                </div>
              )}
              {!photo.uploading && (
                <button
                  onClick={() => handleRemove(i)}
                  style={{
                    position: "absolute", top: 4, right: 4,
                    width: 24, height: 24, borderRadius: 12,
                    background: "rgba(0,0,0,0.6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "none", cursor: "pointer",
                  }}
                >
                  <X size={14} color="#FFF" />
                </button>
              )}
              {photo.error && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: "2px 0", textAlign: "center",
                  background: "rgba(239,68,68,0.9)", color: "#FFF",
                  fontSize: 10, fontWeight: 700,
                }}>
                  失敗
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {photos.length < maxPhotos && (
        <button
          onClick={handleCapture}
          disabled={busy}
          className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl transition-all active:scale-[0.98]"
          style={{
            height: photos.length > 0 ? 56 : 80,
            background: accentBg,
            border: `2px dashed ${accentColor}40`,
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? (
            <Loader2 size={22} color={accentColor} className="animate-spin" />
          ) : photos.length > 0 ? (
            <>
              <ImagePlus size={20} color={accentColor} />
              <span style={{ fontSize: 12, color: accentColor, fontWeight: 600 }}>
                写真を追加（{photos.length}/{maxPhotos}）
              </span>
            </>
          ) : (
            <>
              <Camera size={24} color={accentColor} />
              <span style={{ fontSize: 13, color: accentColor, fontWeight: 600 }}>
                {placeholder}
              </span>
            </>
          )}
        </button>
      )}

      {/* Hidden file input — accept camera + gallery */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFiles}
        style={{ display: "none" }}
      />

      {/* ── Marking overlay (fullscreen) ── */}
      {markingBlob && markingPreviewUrl && (
        <PhotoMarkingOverlay
          imageBlob={markingBlob}
          onComplete={handleMarkingComplete}
          onCancel={handleMarkingCancel}
        />
      )}
    </div>
  );
}
