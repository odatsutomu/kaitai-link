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

    // Leaflet は SSR 非対応のため動的 import
    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      // デフォルトアイコンのパスバグを回避（divIcon を使うので不要だが念のため）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const defaultCenter: [number, number] =
        center ? [center.lat, center.lng]
        : sites.length > 0
          ? [
              sites.reduce((s, p) => s + p.lat, 0) / sites.length,
              sites.reduce((s, p) => s + p.lng, 0) / sites.length,
            ]
          : [35.6762, 139.6503];

      const map = L.map(containerRef.current!, {
        center: defaultCenter,
        zoom: 10,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
        maxZoom: 19,
      }).addTo(map);

      // 各現場にカラーピンを配置
      sites.forEach((site) => {
        const color = STATUS_COLOR[site.status];
        const icon = L.divIcon({
          html: `
            <div style="
              width:20px;height:20px;
              background:${color};
              border:3px solid #fff;
              border-radius:50%;
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
            "></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          className: "",
        });

        L.marker([site.lat, site.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-size:12px;font-weight:700;color:#1E293B">${site.name}</div>
            <div style="font-size:11px;color:#64748B;margin-top:2px">${site.status}</div>
          `);
      });

      // 全ピンが収まるように自動フィット
      if (sites.length >= 2) {
        const bounds = L.latLngBounds(sites.map(s => [s.lat, s.lng]));
        map.fitBounds(bounds, { padding: [30, 30] });
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
        padding: "4px 8px",
        display: "flex", gap: 10, alignItems: "center",
      }}>
        {(["解体中", "着工前", "完工"] as const).map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: STATUS_COLOR[s],
              border: "2px solid #fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
            <span style={{ fontSize: 14, color: "#64748B", fontWeight: 600 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
