export interface LatLng { lat: number; lng: number; }

/** 日本の住所を段階的に短くして検索するためのヘルパー */
function simplifyAddress(address: string): string[] {
  const candidates: string[] = [address];

  // 番地 (数字-数字-数字) を除いたバージョン
  const noBlock = address.replace(/\d+-\d+-\d+$/, "").replace(/\d+-\d+$/, "").trim();
  if (noBlock && noBlock !== address) candidates.push(noBlock);

  // 丁目・番地表現を削除
  const noChome = address.replace(/\d+丁目.*$/, "").replace(/\d+番.*$/, "").trim();
  if (noChome && !candidates.includes(noChome)) candidates.push(noChome);

  // 区・市・町レベル（最初の市区町村まで）
  const cityMatch = address.match(/^(.+?[都道府県].+?[市区町村])/);
  if (cityMatch && !candidates.includes(cityMatch[1])) candidates.push(cityMatch[1]);

  return candidates;
}

/**
 * Nominatim (OpenStreetMap) で住所 → 緯度経度に変換
 * 詳細住所がヒットしない場合は段階的に住所を短縮して再試行する
 */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  if (!address.trim()) return null;

  const candidates = simplifyAddress(address);

  for (const q of candidates) {
    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(q)}` +
        `&format=json&limit=1&accept-language=ja`;
      const res = await fetch(url, {
        headers: { "User-Agent": "kaitai-link-app/1.0 (demo)" },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch {
      // ネットワークエラーは次の候補へ
    }
  }

  return null;
}

/** 日本の中心あたりのデフォルト座標（フォールバック用） */
export const DEFAULT_CENTER: LatLng = { lat: 35.6762, lng: 139.6503 };
