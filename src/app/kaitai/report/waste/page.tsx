"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft, CheckCircle, ChevronDown, MapPin, Truck,
  Navigation,
} from "lucide-react";
import { useAppContext } from "../../lib/app-context";
import { T } from "../../lib/design-tokens";

// ─── 廃材品目の絵文字マッピング ─────────────────────────────────────────────
const EMOJI_MAP: Record<string, string> = {
  "コンクリートガラ": "🪨", "コンクリート": "🪨",
  "木くず": "🪵", "木材": "🪵",
  "金属スクラップ": "🔩", "金属": "🔩", "鉄くず": "🔩",
  "石膏ボード": "📦", "石膏": "📦",
  "廃プラスチック": "♻️", "プラスチック": "♻️",
  "混合廃棄物": "🗑️", "混合": "🗑️",
  "アスベスト含有": "⚠️", "アスベスト": "⚠️",
  "瓦・タイル": "🏗", "瓦": "🏗", "タイル": "🏗",
  "ガラス": "🪟", "土砂": "⛰️", "繊維くず": "🧵",
};
const DEFAULT_EMOJI = "📦";

type WasteItem = { id: string; label: string; unit: string; emoji: string };

type Processor = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  prices: { wasteType: string; unitPrice: number; direction: string; unit: string }[];
};

type Selection = {
  processorId: string;
  processorName: string;
  unitPrice: number;
  direction: string;
};

function yen(n: number) {
  return (n < 0 ? "-" : "") + "¥" + Math.abs(n).toLocaleString("ja-JP");
}

// ─── Haversine距離計算（km） ─────────────────────────────────────────────────
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

// ─── メインコンポーネント ────────────────────────────────────────────────────
function WastePageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const siteId = params.get("site") ?? "";
  const siteName = params.get("name") ?? "現場";
  const { company, addLog } = useAppContext();

  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([]);
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);

  // 現場の位置情報
  const [siteLat, setSiteLat] = useState<number | null>(null);
  const [siteLng, setSiteLng] = useState<number | null>(null);

  // 処理場マスター読み込み + 現場位置取得
  useEffect(() => {
    // 処理場データ
    fetch("/api/kaitai/processors")
      .then(r => r.json())
      .then(d => {
        if (!d.ok) return;
        const procs: Processor[] = (d.processors ?? []).map(
          (p: Record<string, unknown>) => ({
            id: p.id as string,
            name: p.name as string,
            address: (p.address as string) ?? null,
            lat: p.lat != null ? Number(p.lat) : null,
            lng: p.lng != null ? Number(p.lng) : null,
            prices: (p.prices as Processor["prices"]) ?? [],
          }),
        );
        setProcessors(procs);

        const seen = new Map<string, { unit: string }>();
        for (const proc of procs) {
          for (const p of proc.prices) {
            if (!seen.has(p.wasteType)) {
              seen.set(p.wasteType, { unit: p.unit });
            }
          }
        }

        const items: WasteItem[] = Array.from(seen.entries()).map(
          ([wasteType, info]) => ({
            id: wasteType,
            label: wasteType,
            unit: info.unit,
            emoji: EMOJI_MAP[wasteType] ?? DEFAULT_EMOJI,
          }),
        );

        setWasteItems(items);
        setQuantities(Object.fromEntries(items.map(w => [w.id, ""])));
      })
      .catch(() => {})
      .finally(() => setLoadingItems(false));

    // 現場の位置情報を取得
    if (siteId) {
      fetch("/api/kaitai/sites", { credentials: "include" })
        .then(r => r.json())
        .then(d => {
          if (!d?.sites) return;
          const site = (d.sites as Record<string, unknown>[]).find(
            s => s.id === siteId,
          );
          if (site && site.lat != null && site.lng != null) {
            setSiteLat(Number(site.lat));
            setSiteLng(Number(site.lng));
          }
        })
        .catch(() => {});
    }
  }, [siteId]);

  // 処理場ごとの現場からの距離
  const processorDistances = useMemo(() => {
    const map = new Map<string, number>();
    if (siteLat == null || siteLng == null) return map;
    for (const proc of processors) {
      if (proc.lat != null && proc.lng != null) {
        map.set(proc.id, haversineKm(siteLat, siteLng, proc.lat, proc.lng));
      }
    }
    return map;
  }, [processors, siteLat, siteLng]);

  function handleInput(id: string, val: string) {
    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
      setQuantities(prev => ({ ...prev, [id]: val }));
    }
  }

  const activeWaste = useMemo(
    () =>
      wasteItems
        .filter(w => parseFloat(quantities[w.id] || "0") > 0)
        .map(w => ({ ...w, qty: parseFloat(quantities[w.id]) })),
    [quantities, wasteItems],
  );

  // 品目ごとの処理場オプション（距離順でソート可能）
  function getProcessorOptions(wasteId: string, wasteLabel: string) {
    return processors
      .map(proc => {
        const price = proc.prices.find(
          p => p.wasteType === wasteId || p.wasteType === wasteLabel,
        );
        if (!price) return null;
        return {
          processorId: proc.id,
          processorName: proc.name,
          address: proc.address,
          lat: proc.lat,
          lng: proc.lng,
          unitPrice: price.unitPrice,
          direction: price.direction,
          unit: price.unit,
          distance: processorDistances.get(proc.id) ?? null,
        };
      })
      .filter(Boolean) as {
      processorId: string;
      processorName: string;
      address: string | null;
      lat: number | null;
      lng: number | null;
      unitPrice: number;
      direction: string;
      unit: string;
      distance: number | null;
    }[];
  }

  // 処理場ごとにグループ化した配送マニフェスト
  const deliveryManifest = useMemo(() => {
    const byProc = new Map<
      string,
      {
        processorId: string;
        processorName: string;
        distance: number | null;
        address: string | null;
        items: {
          label: string;
          emoji: string;
          qty: number;
          unit: string;
          unitPrice: number;
          direction: string;
          cost: number;
        }[];
        totalCost: number;
      }
    >();

    for (const w of activeWaste) {
      const sel = selections[w.id];
      if (!sel) continue;
      const cost =
        sel.direction === "buyback"
          ? -(w.qty * sel.unitPrice)
          : w.qty * sel.unitPrice;

      if (!byProc.has(sel.processorId)) {
        const proc = processors.find(p => p.id === sel.processorId);
        byProc.set(sel.processorId, {
          processorId: sel.processorId,
          processorName: sel.processorName,
          distance: processorDistances.get(sel.processorId) ?? null,
          address: proc?.address ?? null,
          items: [],
          totalCost: 0,
        });
      }
      const group = byProc.get(sel.processorId)!;
      group.items.push({
        label: w.label,
        emoji: w.emoji,
        qty: w.qty,
        unit: w.unit,
        unitPrice: sel.unitPrice,
        direction: sel.direction,
        cost,
      });
      group.totalCost += cost;
    }

    // 距離順にソート
    return Array.from(byProc.values()).sort((a, b) => {
      if (a.distance != null && b.distance != null)
        return a.distance - b.distance;
      if (a.distance != null) return -1;
      return 1;
    });
  }, [activeWaste, selections, processors, processorDistances]);

  // 全コスト合計
  const grandTotal = useMemo(
    () => deliveryManifest.reduce((sum, g) => sum + g.totalCost, 0),
    [deliveryManifest],
  );

  const allSelected =
    activeWaste.length > 0 && activeWaste.every(w => selections[w.id]);

  function selectProcessor(
    wasteId: string,
    opt: {
      processorId: string;
      processorName: string;
      unitPrice: number;
      direction: string;
    },
  ) {
    setSelections(prev => ({ ...prev, [wasteId]: opt }));
    setOpenDropdown(null);
  }

  async function submit() {
    if (!allSelected || submitting) return;
    setSubmitting(true);
    try {
      for (const w of activeWaste) {
        const sel = selections[w.id];
        if (!sel) continue;
        await fetch("/api/kaitai/waste-dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId,
            siteName,
            wasteType: w.label,
            quantity: w.qty,
            unit: w.unit,
            processorId: sel.processorId,
            processorName: sel.processorName,
            cost: Math.round(w.qty * sel.unitPrice),
            direction: sel.direction,
            reporter: company?.adminName ?? "作業員",
          }),
        });
      }
      addLog(
        `waste_dispatch: ${siteName} / ${activeWaste.map(w => `${w.label}:${w.qty}${w.unit}→${selections[w.id]?.processorName}`).join("、")}`,
        company?.adminName ?? "作業員",
      );
      setDone(true);
    } catch {}
    setSubmitting(false);
  }

  // ── 完了画面 ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="py-6 pb-28 md:pb-8 flex flex-col gap-6">
        <div
          className="flex flex-col items-center py-12"
          style={{ background: "#F5F5F5", borderRadius: 20, padding: "48px 24px" }}
        >
          <CheckCircle size={80} color="#10B981" strokeWidth={1.8} />
          <p
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: "#212121",
              marginTop: 20,
            }}
          >
            廃材記録 完了
          </p>
        </div>

        {/* 配送先別サマリー */}
        {deliveryManifest.map(group => (
          <div
            key={group.processorId}
            className="rounded-2xl overflow-hidden"
            style={{ border: "1.5px solid #E5E7EB", background: "#fff" }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{
                background: "#F0FDF4",
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "#10B981" }}
              >
                <Truck size={16} color="#fff" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  style={{ fontSize: 14, fontWeight: 800, color: "#065F46" }}
                >
                  {group.processorName}
                </p>
                {group.distance != null && (
                  <p style={{ fontSize: 12, color: "#6B7280" }}>
                    {formatDist(group.distance)}
                  </p>
                )}
              </div>
            </div>
            {group.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2.5"
                style={{
                  borderBottom:
                    i < group.items.length - 1 ? "1px solid #F3F4F6" : "none",
                }}
              >
                <span style={{ fontSize: 14, color: "#333" }}>
                  {item.emoji} {item.label} {item.qty}
                  {item.unit}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color:
                      item.direction === "buyback" ? "#10B981" : "#B45309",
                  }}
                >
                  {item.direction === "buyback"
                    ? `+${yen(Math.abs(item.cost))}`
                    : yen(item.cost)}
                </span>
              </div>
            ))}
          </div>
        ))}

        <button
          onClick={() => router.push("/kaitai/report")}
          style={{
            height: 56,
            padding: "0 36px",
            background: T.primary,
            color: "#FFF",
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
          }}
        >
          ← 報告画面に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 pb-28 md:pb-8 flex flex-col gap-5">
      <header
        className="flex flex-col gap-2"
        style={{ borderBottom: "2px solid #EEEEEE", paddingBottom: 20 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-2xl"
            style={{ background: "#F5F5F5" }}
          >
            <ChevronLeft size={20} style={{ color: "#444" }} />
          </button>
          <span style={{ fontSize: 14, color: "#888" }}>{siteName}</span>
        </div>
        <p style={{ fontSize: 26, fontWeight: 900, color: "#212121" }}>
          🚛 廃材入力
        </p>
        <p style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
          品目・量を入力し、各廃材の行き先を選択してください
        </p>
      </header>

      {/* ── 配送先別マニフェスト（処理場が選択されたら表示） ── */}
      {deliveryManifest.length > 0 && (
        <div className="flex flex-col gap-3">
          <p
            style={{ fontSize: 14, fontWeight: 800, color: "#222" }}
          >
            🗺️ 配送マニフェスト
          </p>

          {deliveryManifest.map(group => (
            <div
              key={group.processorId}
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1.5px solid #D1FAE5",
                background: "#F0FDF4",
              }}
            >
              {/* 処理場ヘッダー */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: "1px solid #D1FAE5" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#10B981" }}
                >
                  <Truck size={18} color="#fff" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#065F46",
                      }}
                    >
                      {group.processorName}
                    </p>
                  </div>
                  {group.distance != null && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          background: group.distance < 10 ? "#DBEAFE" : group.distance < 30 ? "#FEF3C7" : "#FEE2E2",
                          color: group.distance < 10 ? "#1D4ED8" : group.distance < 30 ? "#92400E" : "#DC2626",
                        }}
                      >
                        <Navigation size={12} />
                        {formatDist(group.distance)}
                      </span>
                    </div>
                  )}
                  {group.address && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#6B7280",
                        marginTop: 1,
                      }}
                    >
                      {group.address}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color:
                        group.totalCost < 0 ? "#10B981" : "#B45309",
                    }}
                  >
                    {group.totalCost < 0
                      ? `+${yen(Math.abs(group.totalCost))}`
                      : yen(group.totalCost)}
                  </span>
                </div>
              </div>

              {/* 品目リスト */}
              {group.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2"
                  style={{
                    background: "#fff",
                    borderBottom:
                      i < group.items.length - 1
                        ? "1px solid #F0FDF4"
                        : "none",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 18 }}>{item.emoji}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#333",
                      }}
                    >
                      {item.label}
                    </span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                      {item.qty}
                      {item.unit}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color:
                        item.direction === "buyback"
                          ? "#10B981"
                          : "#B45309",
                    }}
                  >
                    {item.direction === "buyback"
                      ? `+${yen(Math.abs(item.cost))}`
                      : yen(item.cost)}
                  </span>
                </div>
              ))}
            </div>
          ))}

          {/* 合計 */}
          <div
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "#FEF3C7", border: "1.5px solid #FDE68A" }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, color: "#78350F" }}>
              処理費用 合計
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: grandTotal < 0 ? "#10B981" : "#B45309",
              }}
            >
              {grandTotal < 0
                ? `+${yen(Math.abs(grandTotal))}`
                : yen(grandTotal)}
            </span>
          </div>
        </div>
      )}

      {/* ── 廃材入力リスト ── */}
      {loadingItems && (
        <div className="flex items-center justify-center py-12">
          <span style={{ fontSize: 14, color: "#999" }}>
            廃材品目を読み込み中...
          </span>
        </div>
      )}
      {!loadingItems && wasteItems.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-12 gap-3"
          style={{
            background: "#F9FAFB",
            borderRadius: 16,
            border: "1.5px dashed #D1D5DB",
          }}
        >
          <span style={{ fontSize: 36 }}>📋</span>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#666" }}>
            廃材品目が未登録です
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#999",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            管理者画面の「処理場管理」で処理場と
            <br />
            対応する廃材品目を登録してください
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {wasteItems.map(w => {
          const qty = parseFloat(quantities[w.id] || "0");
          const isActive = qty > 0;
          const sel = selections[w.id];
          const options = getProcessorOptions(w.id, w.label);
          const isDropdownOpen = openDropdown === w.id;

          // 決定済み = active + processor選択済み
          const isDecided = isActive && !!sel;

          return (
            <div
              key={w.id}
              className="rounded-2xl overflow-hidden transition-all"
              style={{
                background: isDecided
                  ? "#F8FAFC"
                  : isActive
                    ? "#FFFBEB"
                    : T.surface,
                border: isDecided
                  ? "1.5px solid #E2E8F0"
                  : isActive
                    ? "1.5px solid #FDE68A"
                    : "1.5px solid #EEEEEE",
                opacity: isDecided ? 0.75 : 1,
              }}
            >
              {/* 品目行 */}
              <div className="flex items-center gap-3 px-4 py-3">
                <span style={{ fontSize: isDecided ? 20 : 24, flexShrink: 0 }}>
                  {w.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      style={{
                        fontSize: isDecided ? 14 : 15,
                        fontWeight: 700,
                        color: isDecided ? "#94A3B8" : "#222",
                      }}
                    >
                      {w.label}
                    </p>
                    {isDecided && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: "2px 6px", borderRadius: 6,
                        background: "#E2E8F0", color: "#64748B",
                      }}>
                        ✓ 決定
                      </span>
                    )}
                  </div>
                  {isDecided && sel && (
                    <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                      → {sel.processorName}　¥{sel.unitPrice.toLocaleString()}/{w.unit}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={quantities[w.id]}
                    onChange={e => handleInput(w.id, e.target.value)}
                    placeholder="0"
                    className="rounded-xl text-right outline-none"
                    style={{
                      width: isDecided ? 80 : 100,
                      height: isDecided ? 38 : 44,
                      fontSize: isDecided ? 16 : 20,
                      fontWeight: 800,
                      color: isDecided ? "#94A3B8" : "#111",
                      background: isDecided ? "#F1F5F9" : "#F9FAFB",
                      border: `1.5px solid ${isDecided ? "#E2E8F0" : "#E5E7EB"}`,
                      padding: "0 10px",
                    }}
                  />
                  <span
                    style={{
                      fontSize: isDecided ? 12 : 14,
                      color: isDecided ? "#94A3B8" : "#666",
                      fontWeight: 600,
                      minWidth: 24,
                    }}
                  >
                    {w.unit}
                  </span>
                </div>
              </div>

              {/* 処理場選択（量が入力された品目のみ表示） */}
              {isActive && options.length > 0 && (
                <div className="px-4 pb-3">
                  {/* 選択ボタン */}
                  <button
                    onClick={() =>
                      setOpenDropdown(isDropdownOpen ? null : w.id)
                    }
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-all"
                    style={{
                      background: sel
                        ? "#F1F5F9"
                        : "#F3F4F6",
                      border: sel
                        ? "1.5px solid #E2E8F0"
                        : "1.5px solid #E5E7EB",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin
                        size={14}
                        style={{
                          color: sel ? "#94A3B8" : "#9CA3AF",
                        }}
                      />
                      {sel ? (
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#64748B",
                          }}
                        >
                          {sel.processorName}
                          <span style={{ fontWeight: 400, marginLeft: 4, color: "#94A3B8" }}>
                            （変更する）
                          </span>
                        </span>
                      ) : (
                        <span style={{ fontSize: 13, color: "#9CA3AF" }}>
                          処理場を選択...
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      size={16}
                      style={{
                        color: "#9CA3AF",
                        transform: isDropdownOpen
                          ? "rotate(180deg)"
                          : "none",
                        transition: "transform 0.15s",
                      }}
                    />
                  </button>

                  {/* ドロップダウン */}
                  {isDropdownOpen && (
                    <div
                      className="mt-1 rounded-xl overflow-hidden"
                      style={{
                        border: "1.5px solid #E5E7EB",
                        background: "#FFF",
                      }}
                    >
                      {options
                        .sort((a, b) => {
                          const costA =
                            a.direction === "buyback"
                              ? -a.unitPrice
                              : a.unitPrice;
                          const costB =
                            b.direction === "buyback"
                              ? -b.unitPrice
                              : b.unitPrice;
                          return costA - costB;
                        })
                        .map((opt, i) => {
                          const estCost = qty * opt.unitPrice;
                          const isSelected =
                            sel?.processorId === opt.processorId;
                          const isBuyback = opt.direction === "buyback";
                          return (
                            <button
                              key={opt.processorId}
                              onClick={() => selectProcessor(w.id, opt)}
                              className="w-full px-3 py-3 text-left transition-colors"
                              style={{
                                background: isSelected
                                  ? isBuyback
                                    ? "#ECFDF5"
                                    : "#FFF7ED"
                                  : "transparent",
                                borderBottom:
                                  i < options.length - 1
                                    ? "1px solid #F3F4F6"
                                    : "none",
                              }}
                            >
                              {/* 上段: 処理場名 + バッジ + 金額 */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                                  {i === 0 && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 800,
                                        padding: "1px 6px",
                                        borderRadius: 99,
                                        background: isBuyback
                                          ? "#DCFCE7"
                                          : "#FEF3C7",
                                        color: isBuyback
                                          ? "#166534"
                                          : "#92400E",
                                      }}
                                    >
                                      {isBuyback ? "最高買取" : "最安"}
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      fontSize: 15,
                                      fontWeight: 700,
                                      color: "#222",
                                    }}
                                  >
                                    {opt.processorName}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0 ml-2">
                                  <span
                                    style={{
                                      fontSize: 16,
                                      fontWeight: 800,
                                      color: isBuyback
                                        ? "#10B981"
                                        : "#B45309",
                                    }}
                                  >
                                    {isBuyback
                                      ? `+${yen(estCost)}`
                                      : yen(estCost)}
                                  </span>
                                  <span
                                    style={{ fontSize: 11, color: "#9CA3AF" }}
                                  >
                                    ¥{opt.unitPrice.toLocaleString()}/
                                    {opt.unit}
                                    {isBuyback && (
                                      <span style={{ color: "#10B981", fontWeight: 700 }}>
                                        {" "}買取
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                              {/* 下段: 距離 + 住所（見やすく） */}
                              <div className="flex items-center gap-2 mt-1.5">
                                {opt.distance != null && (
                                  <span
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg"
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 800,
                                      background: opt.distance < 10 ? "#DBEAFE" : opt.distance < 30 ? "#FEF3C7" : "#FEE2E2",
                                      color: opt.distance < 10 ? "#1D4ED8" : opt.distance < 30 ? "#92400E" : "#DC2626",
                                    }}
                                  >
                                    <Navigation size={12} />
                                    {formatDist(opt.distance)}
                                  </span>
                                )}
                                {opt.address && (
                                  <span
                                    className="truncate"
                                    style={{
                                      fontSize: 12,
                                      color: "#9CA3AF",
                                    }}
                                  >
                                    {opt.address}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* 処理場が未登録の品目 */}
              {isActive && options.length === 0 && (
                <div className="px-4 pb-3">
                  <p
                    style={{
                      fontSize: 12,
                      color: "#9CA3AF",
                      fontStyle: "italic",
                    }}
                  >
                    この品目に対応する処理場が登録されていません
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 送信ボタン ── */}
      <div className="pt-2">
        <button
          onClick={submit}
          disabled={!allSelected || submitting || wasteItems.length === 0}
          className="w-full flex items-center justify-center gap-2 rounded-3xl font-black transition-all active:scale-[0.98]"
          style={{
            height: 68,
            fontSize: 20,
            background:
              allSelected && wasteItems.length > 0 ? "#212121" : "#D1D5DB",
            color: "#FFF",
            cursor:
              allSelected && wasteItems.length > 0
                ? "pointer"
                : "not-allowed",
          }}
        >
          {submitting
            ? "送信中..."
            : activeWaste.length === 0
              ? "廃材を入力してください"
              : !allSelected
                ? "各廃材の処理場を選択してください"
                : `廃材記録を送信（${deliveryManifest.length}箇所）`}
        </button>
      </div>
    </div>
  );
}

export default function WastePage() {
  return (
    <Suspense fallback={null}>
      <WastePageInner />
    </Suspense>
  );
}
