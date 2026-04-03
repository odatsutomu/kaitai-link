"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback } from "react";
import type { LatLng } from "../lib/geocode";
import { T } from "../lib/design-tokens";
import { Check } from "lucide-react";

export interface MapSite {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "解体中" | "着工前" | "完工";
  address?: string;
}

const STATUSES = ["解体中", "着工前", "完工"] as const;
type SiteStatus = (typeof STATUSES)[number];

const STATUS_COLOR: Record<SiteStatus, string> = {
  "解体中": T.primary,
  "着工前": "#3B82F6",
  "完工":   T.muted,
};

const STATUS_STYLE: Record<SiteStatus, { bg: string; fg: string }> = {
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

  // Category-based visibility: all statuses visible by default
  const [visibleStatuses, setVisibleStatuses] = useState<Set<SiteStatus>>(new Set(STATUSES));

  const toggleStatus = useCallback((status: SiteStatus) => {
    setVisibleStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  // Count sites per status
  const countByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = sites.filter(site => site.status === s).length;
    return acc;
  }, {} as Record<SiteStatus, number>);

  // Sync marker visibility with visibleStatuses
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker, id) => {
      const site = sites.find(s => s.id === id);
      if (!site) return;
      if (!visibleStatuses.has(site.status)) {
        if (map.hasLayer(marker)) map.removeLayer(marker);
      } else {
        if (!map.hasLayer(marker)) marker.addTo(map);
      }
    });
  }, [visibleStatuses, sites]);

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
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers when sites data arrives or changes
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || sites.length === 0) return;

    // Clear old markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current.clear();

    // Create new markers
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
        .bindPopup(buildPopupHtml(site), {
          className: "kaitai-info-popup",
          maxWidth: 260,
          minWidth: 240,
          closeButton: true,
          autoClose: true,
        });

      // Only add to map if status is visible
      if (visibleStatuses.has(site.status)) {
        marker.addTo(map);
      }
      newMarkers.set(site.id, marker);
    });
    markersRef.current = newMarkers;

    // Fit bounds to all sites
    if (sites.length >= 2) {
      const bounds = L.latLngBounds(sites.map(s => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (sites.length === 1) {
      map.setView([sites[0].lat, sites[0].lng], 14);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={containerRef} style={{ height, width: "100%", borderRadius: "0 0 12px 12px" }} />

      {/* ── 凡例 兼 フィルター（左下） ── */}
      <div style={{
        position: "absolute", bottom: 8, left: 8, zIndex: 1000,
        background: "rgba(255,255,255,0.92)",
        border: "1px solid #E2E8F0",
        borderRadius: 8,
        padding: "3px 6px",
        display: "flex", gap: 2, alignItems: "center",
      }}>
        {STATUSES.map(status => {
          const active = visibleStatuses.has(status);
          const color = STATUS_COLOR[status];
          const count = countByStatus[status];
          if (count === 0) return null;
          return (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 8px", border: "none", borderRadius: 6,
                background: "transparent", cursor: "pointer",
                opacity: active ? 1 : 0.35,
                transition: "opacity 0.15s",
              }}
            >
              <span style={{ position: "relative", flexShrink: 0 }}>
                <svg width="10" height="15" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 48 16 48C16 48 32 28 32 16C32 7.163 24.837 0 16 0Z" fill={color}/>
                  <circle cx="16" cy="16" r="6.5" fill="white" opacity="0.9"/>
                </svg>
                {active && (
                  <Check
                    size={8}
                    strokeWidth={3}
                    style={{
                      position: "absolute", top: 2, left: 1,
                      color,
                    }}
                  />
                )}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: active ? T.text : T.muted }}>
                {status}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
