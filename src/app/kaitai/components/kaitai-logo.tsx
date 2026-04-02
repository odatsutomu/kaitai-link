/**
 * 解体LINK brand logo.
 * logo.png が /public/logo.png に配置されている場合は画像を使用。
 * 配置前はSVGフォールバックを表示。
 */

import Image from "next/image";

// ─── 画像ロゴ（/public/logo.png が存在する場合） ──────────────────────────────

export function KaitaiLogo({
  iconSize = 44,
  textSize = 28,
  light = false,
  height = 40,  // 画像表示時の高さ（px）
}: {
  iconSize?: number;
  textSize?: number;
  light?: boolean;
  height?: number;
}) {
  // logo.png を優先使用
  return (
    <Image
      src="/logo.png"
      alt="解体LINK"
      width={Math.round(height * 3.5)}  // 横長ロゴなので横幅を広めに
      height={height}
      style={{ objectFit: "contain", height, width: "auto" }}
      priority
    />
  );
}

// ─── サイドバー用（小さいアイコン＋テキスト） ────────────────────────────────

export function KaitaiLogoCompact({ darkBg = false }: { darkBg?: boolean }) {
  return (
    <Image
      src="/logo.png"
      alt="解体LINK"
      width={140}
      height={42}
      style={{ objectFit: "contain", height: 42, width: "auto" }}
      priority
    />
  );
}
