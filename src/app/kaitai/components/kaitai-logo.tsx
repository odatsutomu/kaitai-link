/**
 * 解体LINK brand logo.
 * To use the actual PNG, place it at /public/kaitai-logo.png and switch
 * to <Image src="/kaitai-logo.png" ... /> below.
 */

// ─── Hex-gear icon (SVG approximation of the brand mark) ──────────────────────

function HexIcon({ size = 48 }: { size?: number }) {
  const c = size / 2;
  const barW = size * 0.28;
  const barH = size * 0.13;
  const ringR = size * 0.37;

  const segs = [
    { angle: 0,   color: "#FF9800" },  // top         – orange
    { angle: 60,  color: "#333333" },  // upper-right – dark
    { angle: 120, color: "#333333" },  // lower-right – dark
    { angle: 180, color: "#333333" },  // bottom      – dark
    { angle: 240, color: "#FF9800" },  // lower-left  – orange
    { angle: 300, color: "#333333" },  // upper-left  – dark
  ];

  // Inner open-arc (chain-link feel)
  const ir = ringR * 0.5;
  const arcStart = { x: c, y: c - ir };
  const arcEnd   = { x: c + ir, y: c };
  const arc2Start = { x: c, y: c + ir };
  const arc2End   = { x: c - ir, y: c };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {/* Six bar segments in hexagonal ring */}
      {segs.map(({ angle, color }, i) => (
        <rect
          key={i}
          x={c - barW / 2}
          y={c - ringR - barH / 2}
          width={barW}
          height={barH}
          rx={barH / 2}
          fill={color}
          transform={`rotate(${angle}, ${c}, ${c})`}
        />
      ))}

      {/* Inner two-arc chain-link symbol */}
      <path
        d={`M ${arcStart.x} ${arcStart.y} A ${ir} ${ir} 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
        fill="none" stroke="#FF9800" strokeWidth={size * 0.065} strokeLinecap="round"
      />
      <path
        d={`M ${arc2Start.x} ${arc2Start.y} A ${ir} ${ir} 0 0 1 ${arc2End.x} ${arc2End.y}`}
        fill="none" stroke="#FF9800" strokeWidth={size * 0.065} strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Full logo ─────────────────────────────────────────────────────────────────

export function KaitaiLogo({
  iconSize = 44,
  textSize = 28,
  light = false,
}: {
  iconSize?: number;
  textSize?: number;
  /** true = on dark bg (text becomes white) */
  light?: boolean;
}) {
  const textColor = light ? "#FFFFFF" : "#111111";

  return (
    <div className="flex items-center gap-2.5" style={{ userSelect: "none" }}>
      <HexIcon size={iconSize} />
      <span
        style={{
          fontSize: textSize,
          fontWeight: 900,
          letterSpacing: "-0.5px",
          lineHeight: 1,
          color: textColor,
        }}
      >
        解体<span style={{ color: "#FF9800" }}>LINK</span>
      </span>
    </div>
  );
}
