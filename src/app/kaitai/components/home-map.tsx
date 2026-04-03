"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { LatLng } from "../lib/geocode";

export interface MapSite {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "解体中" | "着工前" | "完工";
}

const STATUS_COLOR: Record<MapSite["status"], string> = {
  "解体中": "#F59E0B",  // amber  — 稼働中
  "着工前": "#3B82F6",  // blue   — 予定
  "完工":   "#94A3B8",  // gray   — 完了
};

// Google Maps スタイルのティアドロップ型ピン SVG を生成
function teardropPin(color: string): string {
  return `
    <svg width="32" height="48" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
      <path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 48 16 48C16 48 32 28 32 16C32 7.163 24.837 0 16 0Z" fill="${color}"/>
      <circle cx="16" cy="16" r="6.5" fill="white" opacity="0.92"/>
    </svg>
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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

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

      // ティアドロップ型ピンを配置
      sites.forEach((site) => {
        const color = STATUS_COLOR[site.status];
        const icon = L.divIcon({
          html: teardropPin(color),
          iconSize: [32, 48],
          iconAnchor: [16, 48],   // 下端の先端を座標に合わせる
          popupAnchor: [0, -48],
          className: "",
        });

        L.marker([site.lat, site.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-size:13px;font-weight:700;color:#1E293B;min-width:120px">${site.name}</div>
            <div style="font-size:12px;color:#64748B;margin-top:3px">${site.status}</div>
          `);
      });

      // 全ピンが収まるように自動フィット
      if (sites.length >= 2) {
        const bounds = L.latLngBounds(sites.map(s => [s.lat, s.lng]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <div ref={containerRef} style={{ height, width: "100%", borderRadius: "0 0 12px 12px" }} />
      {/* 凡例 */}
      <div style={{
        position: "absolute", bottom: 8, left: 8, zIndex: 1000,
        background: "rgba(255,255,255,0.92)",
        border: "1px solid #E2E8F0",
        borderRadius: 8,
        padding: "4px 10px",
        display: "flex", gap: 10, alignItems: "center",
      }}>
        {(["解体中", "着工前", "完工"] as const).map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="10" height="15" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 48 16 48C16 48 32 28 32 16C32 7.163 24.837 0 16 0Z" fill={STATUS_COLOR[s]}/>
              <circle cx="16" cy="16" r="6.5" fill="white" opacity="0.9"/>
            </svg>
            <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
