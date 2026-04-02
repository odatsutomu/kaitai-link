// プラン定義・画像保存期間・利用制限

export type KaitaiPlan = "free" | "standard" | "business" | "enterprise";

export interface PlanConfig {
  maxSites:       number;   // Infinity = 無制限
  maxMembers:     number;
  imageRetentionDays: number | null; // null = 永続
  label:          string;
  priceMonthly:   number;
}

export const PLAN_CONFIG: Record<KaitaiPlan, PlanConfig> = {
  free: {
    maxSites:           2,
    maxMembers:         8,
    imageRetentionDays: 90,
    label:              "Free",
    priceMonthly:       0,
  },
  standard: {
    maxSites:           10,
    maxMembers:         30,
    imageRetentionDays: 365,
    label:              "Standard",
    priceMonthly:       9800,
  },
  business: {
    maxSites:           30,
    maxMembers:         80,
    imageRetentionDays: 730,
    label:              "Business",
    priceMonthly:       29800,
  },
  enterprise: {
    maxSites:           Infinity,
    maxMembers:         Infinity,
    imageRetentionDays: null,
    label:              "Enterprise",
    priceMonthly:       0,
  },
};

/** 画像の expiresAt を計算して返す（null = 永続） */
export function calcImageExpiry(plan: KaitaiPlan): Date | null {
  const days = PLAN_CONFIG[plan].imageRetentionDays;
  if (days === null) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/** プランが有効かチェック */
export function isValidPlan(v: string): v is KaitaiPlan {
  return ["free", "standard", "business", "enterprise"].includes(v);
}
