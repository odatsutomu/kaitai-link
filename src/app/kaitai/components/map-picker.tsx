"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Search, Loader2, CheckCircle2, Navigation, X } from "lucide-react";
import { geocodeAddress, DEFAULT_CENTER, type LatLng } from "../lib/geocode";
import { T } from "../lib/design-tokens";

interface Props {
  address: string;
  value: LatLng | null;
  onChange: (pos: LatLng | null) => void;
}

function createPinIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    html: `<div style="
      width:28px;height:28px;
      background:#B45309;
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
}

export function MapPicker({ address, value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<import("leaflet").Map | null>(null);
  const markerRef    = useRef<import("leaflet").Marker | null>(null);
  const onChangeRef  = useRef(onChange);
  onChangeRef.current = onChange;

  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [geocoded, setGeocoded] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [error, setError] = useState("");

  // ── Helper: ピンを置く/移動する ──
  const placeMarker = useCallback((lat: number, lng: number, zoom?: number) => {
    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      if (zoom) mapRef.current.setView([lat, lng], zoom);
      else mapRef.current.setView([lat, lng]);

      const icon = createPinIcon(L);

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(mapRef.current!);
        markerRef.current = marker;
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          onChangeRef.current({ lat: p.lat, lng: p.lng });
        });
      }
    });
    onChangeRef.current({ lat, lng });
  }, []);

  // ── マップ初期化 ──
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

      const icon = createPinIcon(L);

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

      // Invalidate size after mount to fix tile loading
      setTimeout(() => map.invalidateSize(), 100);
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

  // ── 住所からジオコーディング ──
  const handleGeocode = useCallback(async () => {
    if (!address.trim()) { setError("住所を入力してください"); return; }
    setLoading(true);
    setError("");
    setGeocoded(false);
    setGpsSuccess(false);

    const pos = await geocodeAddress(address);
    setLoading(false);

    if (!pos) {
      setError("住所が見つかりませんでした");
      return;
    }

    setGeocoded(true);
    placeMarker(pos.lat, pos.lng, 17);
  }, [address, placeMarker]);

  // ── GPS 現在地を取得 ──
  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setError("このデバイスではGPSが利用できません");
      return;
    }

    setGpsLoading(true);
    setError("");
    setGeocoded(false);
    setGpsSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsLoading(false);
        setGpsSuccess(true);
        placeMarker(latitude, longitude, 17);
        // 3秒後にチェックマーク消去
        setTimeout(() => setGpsSuccess(false), 3000);
      },
      (err) => {
        setGpsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("位置情報の使用が許可されていません。設定から許可してください。");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("現在地を取得できませんでした");
            break;
          case err.TIMEOUT:
            setError("現在地の取得がタイムアウトしました");
            break;
          default:
            setError("現在地を取得できませんでした");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [placeMarker]);

  return (
    <div className="flex flex-col gap-3">
      {/* ── ボタン行 ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* GPS 現在地ボタン */}
        <button
          type="button"
          onClick={handleGPS}
          disabled={gpsLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
          style={{
            background: gpsLoading ? T.bg : "#3B82F6",
            color: gpsLoading ? T.muted : "#fff",
          }}
        >
          {gpsLoading
            ? <Loader2 size={16} className="animate-spin" />
            : <Navigation size={16} />}
          現在地を取得
        </button>

        {/* 住所ジオコードボタン */}
        <button
          type="button"
          onClick={handleGeocode}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading ? T.bg : T.primary,
            color: loading ? T.muted : "#fff",
          }}
        >
          {loading
            ? <Loader2 size={14} className="animate-spin" />
            : <Search size={14} />}
          住所から検索
        </button>

        {/* ステータス表示 */}
        {geocoded && (
          <span className="flex items-center gap-1 text-sm font-medium" style={{ color: "#10B981" }}>
            <CheckCircle2 size={13} /> 住所から取得しました
          </span>
        )}
        {gpsSuccess && (
          <span className="flex items-center gap-1 text-sm font-medium" style={{ color: "#3B82F6" }}>
            <CheckCircle2 size={13} /> 現在地を取得しました
          </span>
        )}
        {error && (
          <span className="text-sm font-medium" style={{ color: "#EF4444" }}>{error}</span>
        )}
      </div>

      {/* ── 地図エリア（正方形） ── */}
      <div style={{
        border: `2px solid ${T.border}`,
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
      }}>
        <div
          ref={containerRef}
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            maxHeight: 500,
            minHeight: 300,
          }}
        />
        {/* GPS フローティングボタン（マップ上） */}
        <button
          type="button"
          onClick={handleGPS}
          disabled={gpsLoading}
          className="absolute z-[1000] flex items-center justify-center rounded-xl transition-all active:scale-[0.95]"
          style={{
            bottom: 12,
            right: 12,
            width: 44,
            height: 44,
            background: "#fff",
            border: `2px solid ${T.border}`,
            color: gpsLoading ? T.muted : "#3B82F6",
          }}
          title="現在地を取得"
        >
          {gpsLoading ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} />}
        </button>
      </div>

      {/* ── 座標表示 + リセット ── */}
      <div className="flex items-center justify-between">
        {value ? (
          <p className="text-sm font-mono" style={{ color: T.sub }}>
            <MapPin size={11} style={{ display: "inline", marginRight: 3, color: T.primary }} />
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </p>
        ) : (
          <p className="text-sm" style={{ color: T.muted }}>
            📍 地図をクリック、ピンをドラッグ、または「現在地を取得」で位置を確定
          </p>
        )}
        {value && (
          <button
            type="button"
            onClick={() => { onChange(null); markerRef.current?.remove(); markerRef.current = null; }}
            className="flex items-center gap-1 text-sm px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: T.muted }}
          >
            <X size={12} />
            リセット
          </button>
        )}
      </div>
    </div>
  );
}
