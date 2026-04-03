"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, X, ImagePlus, Loader2 } from "lucide-react";
import { T } from "../lib/design-tokens";

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

  const notifyParent = useCallback((list: CapturedPhoto[]) => {
    onPhotosChange?.(list.filter(p => p.id).map(p => p.id!));
  }, [onPhotosChange]);

  const handleCapture = useCallback(() => {
    if (photos.length >= maxPhotos) return;
    fileRef.current?.click();
  }, [photos.length, maxPhotos]);

  const handleFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBusy(true);

    for (const file of Array.from(files)) {
      try {
        const dataUrl = await fileToDataUrl(file);
        const tempId = `tmp_${Date.now()}_${Math.random()}`;

        // Add preview immediately
        setPhotos(prev => {
          if (prev.length >= maxPhotos) return prev;
          return [...prev, { url: dataUrl, uploading: true, id: tempId }];
        });

        // Upload to R2
        const res = await fetch("/api/kaitai/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl, siteId, reportType, uploadedBy }),
        });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();

        // Replace temp with uploaded
        setPhotos(prev => {
          const next = prev.map(p =>
            p.id === tempId ? { id: data.image.id, url: data.image.url } : p
          );
          notifyParent(next);
          return next;
        });
      } catch {
        setPhotos(prev =>
          prev.map(p => p.id?.startsWith("tmp_") && p.uploading
            ? { ...p, uploading: false, error: true }
            : p
          )
        );
      }
    }

    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }, [maxPhotos, siteId, reportType, uploadedBy, notifyParent]);

  const handleRemove = useCallback(async (index: number) => {
    const photo = photos[index];
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
        multiple
        onChange={handleFiles}
        style={{ display: "none" }}
      />
    </div>
  );
}

// ── Compress large images before upload ────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1920;
      let w = img.width;
      let h = img.height;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
