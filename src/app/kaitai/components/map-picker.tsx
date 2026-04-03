"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Search, Loader2, CheckCircle2 } from "lucide-react";
import { geocodeAddress, DEFAULT_CENTER, type LatLng } from "../lib/geocode";

interface Props {
  address: string;
  value: LatLng | null;
  onChange: (pos: LatLng | null) => void;
}

export function MapPicker({ address, value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<import("leaflet").Map | null>(null);
  const markerRef    = useRef<import("leaflet").Marker | null>(null);
  const onChangeRef  = useRef(onChange);
  onChangeRef.current = onChange;

  const [loading, setLoading] = useState(false);
  const [geocoded, setGeocoded] = useState(false);
  const [error, setError] = useState("");

  // マップ初期化
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const initCenter: [number, number] = value
        ? [value.lat, value.lng]
        : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

      const map = L.map(containerRef.current!, {
        center: initCenter,
        zoom: value ? 16 : 11,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
        maxZoom: 19,
      }).addTo(map);

      // ドラッグ可能なアンバーピン
      const icon = L.divIcon({
        html: `<div style="
          width:28px;height:28px;
          background:#F59E0B;
          border:3px solid #fff;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 3px 10px rgba(0,0,0,0.35);
          cursor:grab;
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        className: "",
      });

      if (value) {
        const marker = L.marker([value.lat, value.lng], { icon, draggable: true }).addTo(map);
        markerRef.current = marker;
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          onChangeRef.current({ lat: p.lat, lng: p.lng });
        });
      }

      // 地図クリックでピン設置
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
          markerRef.current = marker;
          marker.on("dragend", () => {
            const p = marker.getLatLng();
            onChangeRef.current({ lat: p.lat, lng: p.lng });
          });
        }
        onChangeRef.current({ lat, lng });
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // value 変化でマーカー位置同期
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !value) return;
    markerRef.current.setLatLng([value.lat, value.lng]);
  }, [value]);

  // 住所からジオコーディングして地図を移動
  const handleGeocode = useCallback(async () => {
    if (!address.trim()) { setError("住所を入力してください"); return; }
    setLoading(true);
    setError("");
    setGeocoded(false);

    const pos = await geocodeAddress(address);
    setLoading(false);

    if (!pos) {
      setError("住所が見つかりませんでした");
      return;
    }

    setGeocoded(true);
    onChange(pos);

    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      mapRef.current.setView([pos.lat, pos.lng], 17);

      const icon = L.divIcon({
        html: `<div style="
          width:28px;height:28px;
          background:#F59E0B;
          border:3px solid #fff;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 3px 10px rgba(0,0,0,0.35);
          cursor:grab;
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        className: "",
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([pos.lat, pos.lng]);
      } else {
        const marker = L.marker([pos.lat, pos.lng], { icon, draggable: true }).addTo(mapRef.current!);
        markerRef.current = marker;
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          onChangeRef.current({ lat: p.lat, lng: p.lng });
        });
      }
    });
  }, [address, onChange]);

  return (
    <div className="flex flex-col gap-2">
      {/* ジオコードボタン */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleGeocode}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: loading ? "#F1F5F9" : "#F59E0B",
            color: loading ? "#94A3B8" : "#fff",
            boxShadow: loading ? "none" : "0 2px 8px rgba(245,158,11,0.35)",
          }}
        >
          {loading
            ? <Loader2 size={14} className="animate-spin" />
            : <Search size={14} />}
          地図で住所を確認
        </button>
        {geocoded && (
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#10B981" }}>
            <CheckCircle2 size={13} /> 位置を取得しました
          </span>
        )}
        {error && (
          <span className="text-xs font-medium" style={{ color: "#EF4444" }}>{error}</span>
        )}
      </div>

      {/* 地図エリア */}
      <div style={{
        border: "1.5px solid #E2E8F0",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        <div ref={containerRef} style={{ height: 280, width: "100%" }} />
      </div>

      {/* 座標表示 + ヒント */}
      <div className="flex items-center justify-between">
        {value ? (
          <p className="text-xs font-mono" style={{ color: "#64748B" }}>
            <MapPin size={11} style={{ display: "inline", marginRight: 3, color: "#F59E0B" }} />
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </p>
        ) : (
          <p className="text-xs" style={{ color: "#94A3B8" }}>
            地図をクリック、またはピンをドラッグして位置を確定
          </p>
        )}
        {value && (
          <button
            type="button"
            onClick={() => { onChange(null); markerRef.current?.remove(); markerRef.current = null; }}
            className="text-xs underline"
            style={{ color: "#94A3B8" }}
          >
            リセット
          </button>
        )}
      </div>
    </div>
  );
}
