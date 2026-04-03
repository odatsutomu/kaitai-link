"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback } from "react";
import type { LatLng } from "../lib/geocode";
import { T } from "../lib/design-tokens";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";

export interface MapSite {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "解体中" | "着工前" | "完工";
  address?: string;
}

const STATUS_COLOR: Record<MapSite["status"], string> = {
  "解体中": T.primary,
  "着工前": "#3B82F6",
  "完工":   T.muted,
};

const STATUS_STYLE: Record<MapSite["status"], { bg: string; fg: string }> = {
  "解体中": { bg: "rgba(180,83,9,0.12)", fg: "#92400E" },
  "着工前": { bg: "#DBEAFE",             fg: "#1D4ED8" },
  "完工":   { bg: "#F1F5F9",             fg: "#475569" },
};

// Google Maps スタイルのティアドロップ型ピン SVG
function teardropPin(color: string): string {
  return `
    <svg width="32" height="48" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
      <path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 48 16 48C16 48 32 28 32 16C32 7.163 24.837 0 16 0Z" fill="${color}"/>
      <circle cx="16" cy="16" r="6.5" fill="white" opacity="0.92"/>
    </svg>
  `;
}

// Building2 icon (lucide-style) for popup thumbnail
const BUILDING_SVG = `
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="rgba(255,255,255,0.85)" stroke-width="1.8"
    stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
    <path d="M6 12H4a2 2 0 0 0-2 2v8h4"/>
    <path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/>
    <path d="M10 6h4"/><path d="M10 10h4"/>
    <path d="M10 14h4"/><path d="M10 18h4"/>
  </svg>
`;

// 現場カード型ポップアップ HTML を生成
function buildPopupHtml(site: MapSite): string {
  const color = STATUS_COLOR[site.status];
  const st = STATUS_STYLE[site.status];
  const addrHtml = site.address
    ? `<p style="font-size:12px;color:#6B7280;margin:0 0 12px 0;line-height:1.45;">${site.address}</p>`
    : "";

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;width:240px;background:#fff;border-radius:14px;overflow:hidden;">
      <div style="height:72px;background:linear-gradient(135deg,${color} 0%,${color}cc 100%);display:flex;align-items:center;justify-content:center;">
        ${BUILDING_SVG}
      </div>
      <div style="padding:14px 16px 16px;">
        <span style="display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:${st.bg};color:${st.fg};margin-bottom:8px;">${site.status}</span>
        <p style="font-size:15px;font-weight:800;color:#1E293B;margin:0 0 ${site.address ? "5px" : "12px"} 0;line-height:1.3;">${site.name}</p>
        ${addrHtml}
        <a href="/kaitai/site/${site.id}"
          style="display:flex;align-items:center;justify-content:center;gap:6px;background:${color};color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 0;border-radius:8px;letter-spacing:0.02em;">
          詳細を見る
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </a>
      </div>
    </div>
  `;
}

interface Props {
  sites: MapSite[];
  center?: LatLng;
  height?: number;
}

export function HomeMap({ sites, center, height = 200 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  // Per-site visibility: default all visible
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);

  const toggleSite = useCallback((id: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const showAll = useCallback(() => setHiddenIds(new Set()), []);
  const hideAll = useCallback(() => setHiddenIds(new Set(sites.map(s => s.id))), [sites]);

  // Sync marker visibility with hiddenIds
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker, id) => {
      if (hiddenIds.has(id)) {
        if (map.hasLayer(marker)) map.removeLayer(marker);
      } else {
        if (!map.hasLayer(marker)) marker.addTo(map);
      }
    });
  }, [hiddenIds]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      // Leaflet のデフォルトポップアップスタイルを上書き
      if (!document.getElementById("kaitai-popup-css")) {
        const style = document.createElement("style");
        style.id = "kaitai-popup-css";
        style.textContent = `
          .kaitai-info-popup .leaflet-popup-content-wrapper {
            padding: 0 !important;
            border-radius: 14px !important;
            border: 1px solid #E5E7EB !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.18) !important;
            overflow: hidden !important;
          }
          .kaitai-info-popup .leaflet-popup-content {
            margin: 0 !important;
            line-height: normal !important;
          }
          .kaitai-info-popup .leaflet-popup-tip {
            background: #fff !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
          }
          .kaitai-info-popup .leaflet-popup-close-button {
            color: rgba(255,255,255,0.8) !important;
            font-size: 18px !important;
            padding: 8px 10px !important;
            z-index: 10 !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.4) !important;
          }
          .kaitai-info-popup .leaflet-popup-close-button:hover {
            color: #fff !important;
          }
        `;
        document.head.appendChild(style);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const defaultCenter: [number, number] =
        center ? [center.lat, center.lng]
        : sites.length > 0
          ? [
              sites.reduce((s, p) => s + p.lat, 0) / sites.length,
              sites.reduce((s, p) => s + p.lng, 0) / sites.length,
            ]
          : [34.6617, 133.9345]; // 岡山市

      const map = L.map(containerRef.current!, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
        maxZoom: 19,
      }).addTo(map);

      // ティアドロップ型ピン + 現場カードポップアップ
      const newMarkers = new Map<string, import("leaflet").Marker>();
      sites.forEach((site) => {
        const color = STATUS_COLOR[site.status];
        const icon = L.divIcon({
          html: teardropPin(color),
          iconSize: [32, 48],
          iconAnchor: [16, 48],
          popupAnchor: [0, -54],
          className: "",
        });

        const marker = L.marker([site.lat, site.lng], { icon })
          .addTo(map)
          .bindPopup(buildPopupHtml(site), {
            className: "kaitai-info-popup",
            maxWidth: 260,
            minWidth: 240,
            closeButton: true,
            autoClose: true,
          });
        newMarkers.set(site.id, marker);
      });
      markersRef.current = newMarkers;

      // 全ピンが収まるように自動フィット
      if (sites.length >= 2) {
        const bounds = L.latLngBounds(sites.map(s => [s.lat, s.lng]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleCount = sites.length - hiddenIds.size;

  return (
    <div style={{ position: "relative" }}>
      <div ref={containerRef} style={{ height, width: "100%", borderRadius: "0 0 12px 12px" }} />

      {/* ピン表示切替パネル */}
      <div style={{
        position: "absolute", top: 8, right: 8, zIndex: 1000,
      }}>
        <button
          onClick={() => setPanelOpen(v => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(255,255,255,0.95)",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 13, fontWeight: 600, color: T.text,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Eye size={14} style={{ color: T.primary }} />
          表示 {visibleCount}/{sites.length}
          {panelOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {panelOpen && (
          <div style={{
            marginTop: 4,
            background: "rgba(255,255,255,0.97)",
            border: "1px solid #E2E8F0",
            borderRadius: 10,
            padding: "8px 0",
            maxHeight: 240,
            overflowY: "auto",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            minWidth: 200,
          }}>
            {/* 一括操作 */}
            <div style={{ display: "flex", gap: 6, padding: "2px 10px 8px", borderBottom: "1px solid #F1F5F9" }}>
              <button
                onClick={showAll}
                style={{
                  flex: 1, fontSize: 12, fontWeight: 600, color: T.primary,
                  background: T.primaryLt, border: "none", borderRadius: 6, padding: "5px 0", cursor: "pointer",
                }}
              >
                すべて表示
              </button>
              <button
                onClick={hideAll}
                style={{
                  flex: 1, fontSize: 12, fontWeight: 600, color: T.sub,
                  background: "#F1F5F9", border: "none", borderRadius: 6, padding: "5px 0", cursor: "pointer",
                }}
              >
                すべて非表示
              </button>
            </div>

            {/* 個別ピン切替 */}
            {sites.map(site => {
              const hidden = hiddenIds.has(site.id);
              const color = STATUS_COLOR[site.status];
              return (
                <button
                  key={site.id}
                  onClick={() => toggleSite(site.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", padding: "8px 12px",
                    background: hidden ? "#FAFAFA" : "transparent",
                    border: "none", cursor: "pointer",
                    opacity: hidden ? 0.5 : 1,
                    transition: "opacity 0.15s, background 0.15s",
                  }}
                >
                  {hidden
                    ? <EyeOff size={15} style={{ color: T.muted, flexShrink: 0 }} />
                    : <Eye size={15} style={{ color: T.primary, flexShrink: 0 }} />
                  }
                  <svg width="10" height="15" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                    <path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 48 16 48C16 48 32 28 32 16C32 7.163 24.837 0 16 0Z" fill={color}/>
                    <circle cx="16" cy="16" r="6.5" fill="white" opacity="0.9"/>
                  </svg>
                  <span style={{
                    fontSize: 13, fontWeight: 600, color: hidden ? T.muted : T.text,
                    textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {site.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 凡例 */}
      <div style={{
        position: "absolute", bottom: 8, left: 8, zIndex: 1000,
        background: "rgba(255,255,255,0.92)",
        border: "1px solid #E2E8F0",
        borderRadius: 8,
        padding: "5px 12px",
        display: "flex", gap: 10, alignItems: "center",
      }}>
        {(["解体中", "着工前", "完工"] as const).map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="10" height="15" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 48 16 48C16 48 32 28 32 16C32 7.163 24.837 0 16 0Z" fill={STATUS_COLOR[s]}/>
              <circle cx="16" cy="16" r="6.5" fill="white" opacity="0.9"/>
            </svg>
            <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
