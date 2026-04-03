// ─── Industrial Enterprise UI — Design Tokens ────────────────────────────────
// Single source of truth for colors, radii, and spacing across all kaitai pages.

/** Light-theme tokens (general worker pages) */
export const T = {
  // Backgrounds
  bg: "#F9FAFB",
  surface: "#FFFFFF",

  // Primary brand (rust / deep brown-orange)
  primary: "#B45309",
  primaryDk: "#92400E",
  primaryLt: "rgba(180,83,9,0.08)",
  primaryMd: "rgba(180,83,9,0.15)",

  // Secondary accents
  blue: "#3B82F6",
  blueBg: "#DBEAFE",
  green: "#10B981",
  red: "#EF4444",

  // Text hierarchy
  heading: "#111827",
  text: "#1E293B",
  sub: "#6B7280",
  muted: "#9CA3AF",

  // Structural
  border: "#E5E7EB",
  navy: "#1E293B",
  slate: "#475569",

  // Dimensions
  cardRadius: 12,
  pillRadius: 9999,
  cardPad: 24,
  maxWidth: 1280,
} as const;

/** Dark-theme tokens (admin dashboard overlay) */
export const TDark = {
  bg: "#0F172A",
  surface: "#1E293B",
  primary: "#D97706",
  primaryLt: "rgba(217,119,6,0.15)",
  primaryMd: "rgba(217,119,6,0.25)",
  border: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  sub: "rgba(255,255,255,0.6)",
  muted: "rgba(255,255,255,0.3)",
} as const;
