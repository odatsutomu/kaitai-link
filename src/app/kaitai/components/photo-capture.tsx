"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, X, ImagePlus, Loader2, AlertTriangle } from "lucide-react";
import { T } from "../lib/design-tokens";
import PhotoMarkingOverlay from "./photo-marking-overlay";

export type CapturedPhoto = {
  id?: string;
  url: string;
  uploading?: boolean;
  error?: boolean;
  errorMsg?: string;
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
  onPhotosChange?: (ids: string[]) => void;
};

// ─── Aggressive compress: max 1024px, JPEG 0.6 → typically 80-200KB ─────────

function compressImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const MAX_DIM = 1024;
    const QUALITY = 0.6;

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

      // Get both blob and dataUrl
      const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, dataUrl });
          } else {
            // Fallback: extract blob from dataUrl
            try {
              const b64 = dataUrl.split(",")[1];
              const bytes = atob(b64);
              const arr = new Uint8Array(bytes.length);
              for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
              resolve({ blob: new Blob([arr], { type: "image/jpeg" }), dataUrl });
            } catch {
              reject(new Error("圧縮に失敗しました"));
            }
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

// ─── Upload with retry + FormData/JSON dual strategy ────────────────────────

async function uploadWithRetry(
  blob: Blob,
  dataUrl: string,
  params: { siteId?: string; reportType?: string; uploadedBy?: string },
  maxRetries = 3,
): Promise<{ id: string; url: string }> {
  let lastError = "";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Strategy 1: FormData (binary, most efficient)
      const formData = new FormData();
      formData.append("file", blob, "photo.jpg");
      if (params.siteId) formData.append("siteId", params.siteId);
      if (params.reportType) formData.append("reportType", params.reportType);
      if (params.uploadedBy) formData.append("uploadedBy", params.uploadedBy);

      const res = await fetch("/api/kaitai/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return { id: data.image.id, url: data.image.url };
      }

      // If FormData failed, try JSON fallback on last attempt
      const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      lastError = errData.detail || errData.error || `HTTP ${res.status}`;
      console.warn(`Upload attempt ${attempt} (FormData) failed:`, lastError);

      if (attempt === maxRetries - 1 || res.status >= 400 && res.status < 500) {
        // Try JSON base64 as fallback
        console.log("Trying JSON base64 fallback...");
        const jsonRes = await fetch("/api/kaitai/upload", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataUrl,
            siteId: params.siteId,
            reportType: params.reportType,
            uploadedBy: params.uploadedBy,
          }),
        });

        if (jsonRes.ok) {
          const data = await jsonRes.json();
          return { id: data.image.id, url: data.image.url };
        }

        const jsonErr = await jsonRes.json().catch(() => ({ error: `HTTP ${jsonRes.status}` }));
        lastError = jsonErr.detail || jsonErr.error || `HTTP ${jsonRes.status}`;
        console.warn("JSON fallback also failed:", lastError);
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : "ネットワークエラー";
      console.warn(`Upload attempt ${attempt} network error:`, lastError);
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  throw new Error(lastError || "アップロードに失敗しました");
}

// ─── Component ──────────────────────────────────────────────────────────────

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
  const [markingDataUrl, setMarkingDataUrl] = useState<string | null>(null);

  const notifyParent = useCallback((list: CapturedPhoto[]) => {
    onPhotosChange?.(list.filter(p => p.id).map(p => p.id!));
  }, [onPhotosChange]);

  // ── Upload a Blob (with dataUrl fallback) ──
  const uploadPhoto = useCallback(async (blob: Blob, dataUrl: string) => {
    const tempId = `tmp_${Date.now()}`;
    const thumbUrl = URL.createObjectURL(blob);

    setPhotos(prev => {
      if (prev.length >= maxPhotos) return prev;
      return [...prev, { url: thumbUrl, uploading: true, id: tempId }];
    });

    try {
      const result = await uploadWithRetry(blob, dataUrl, {
        siteId, reportType, uploadedBy,
      });

      setPhotos(prev => {
        const next = prev.map(p => {
          if (p.id === tempId) {
            URL.revokeObjectURL(thumbUrl);
            return { id: result.id, url: result.url };
          }
          return p;
        });
        notifyParent(next);
        return next;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "不明なエラー";
      setPhotos(prev =>
        prev.map(p => p.id === tempId
          ? { ...p, uploading: false, error: true, errorMsg: msg }
          : p
        )
      );
    }
  }, [maxPhotos, siteId, reportType, uploadedBy, notifyParent]);

  // ── File input → compress → marking overlay ──
  const handleFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const { blob, dataUrl } = await compressImage(files[0]);
      setMarkingBlob(blob);
      setMarkingDataUrl(dataUrl);
    } catch {
      alert("画像の読み込みに失敗しました");
    }

    if (fileRef.current) fileRef.current.value = "";
  }, []);

  // ── Marking overlay callbacks ──
  const handleMarkingComplete = useCallback(async (resultBlob: Blob) => {
    // Create a dataUrl from the result blob for JSON fallback
    const reader = new FileReader();
    const dataUrlPromise = new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(resultBlob);
    });

    setMarkingBlob(null);
    setMarkingDataUrl(null);

    setBusy(true);
    const dataUrl = await dataUrlPromise;
    await uploadPhoto(resultBlob, dataUrl);
    setBusy(false);
  }, [uploadPhoto]);

  const handleMarkingCancel = useCallback(() => {
    setMarkingBlob(null);
    setMarkingDataUrl(null);
  }, []);

  const handleRemove = useCallback(async (index: number) => {
    const photo = photos[index];
    if (photo.url.startsWith("blob:")) URL.revokeObjectURL(photo.url);

    setPhotos(prev => {
      const next = prev.filter((_, i) => i !== index);
      notifyParent(next);
      return next;
    });

    if (photo.id && !photo.id.startsWith("tmp_")) {
      try {
        await fetch(`/api/kaitai/upload/${photo.id}`, { method: "DELETE" });
      } catch { /* best-effort */ }
    }
  }, [photos, notifyParent]);

  // ── Retry a failed upload ──
  const handleRetry = useCallback(async (index: number) => {
    const photo = photos[index];
    if (!photo.error || !photo.url.startsWith("blob:")) return;

    // Re-attempt: fetch blob from object URL, create dataUrl
    setPhotos(prev => prev.map((p, i) =>
      i === index ? { ...p, uploading: true, error: false, errorMsg: undefined } : p
    ));

    try {
      const res = await fetch(photo.url);
      const blob = await res.blob();
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const result = await uploadWithRetry(blob, dataUrl, {
        siteId, reportType, uploadedBy,
      });

      setPhotos(prev => {
        const next = prev.map((p, i) => {
          if (i === index) {
            URL.revokeObjectURL(photo.url);
            return { id: result.id, url: result.url };
          }
          return p;
        });
        notifyParent(next);
        return next;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "不明なエラー";
      setPhotos(prev => prev.map((p, i) =>
        i === index ? { ...p, uploading: false, error: true, errorMsg: msg } : p
      ));
    }
  }, [photos, siteId, reportType, uploadedBy, notifyParent]);

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
              {!photo.uploading && !photo.error && (
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
                <div
                  onClick={() => handleRetry(i)}
                  style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 4,
                    background: "rgba(239,68,68,0.85)", color: "#FFF",
                    cursor: "pointer",
                  }}
                >
                  <AlertTriangle size={20} />
                  <span style={{ fontSize: 11, fontWeight: 700 }}>タップで再試行</span>
                  {photo.errorMsg && (
                    <span style={{ fontSize: 9, opacity: 0.8, textAlign: "center", padding: "0 4px" }}>
                      {photo.errorMsg.slice(0, 30)}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {photos.length < maxPhotos && (
        <button
          onClick={() => { if (photos.length < maxPhotos) fileRef.current?.click(); }}
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

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFiles}
        style={{ display: "none" }}
      />

      {/* Marking overlay */}
      {markingBlob && (
        <PhotoMarkingOverlay
          imageBlob={markingBlob}
          onComplete={handleMarkingComplete}
          onCancel={handleMarkingCancel}
        />
      )}
    </div>
  );
}
