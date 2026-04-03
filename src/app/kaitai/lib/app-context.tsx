"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { WorkerEval } from "./evaluation-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthLevel = "worker" | "admin" | "dev";
export type PlanId    = "free" | "standard" | "business" | "enterprise";

export type ClientStatus = "active" | "past" | "suspended";

// ─── Attendance types ─────────────────────────────────────────────────────────

export type AttendanceStatus = "clock_in" | "break_in" | "break_out" | "clock_out";

export interface AttendanceLog {
  id: string;
  userId: string;
  siteId: string;
  status: AttendanceStatus;
  timestamp: string; // ISO
}

/** Returns the latest AttendanceStatus for a user at a site today, or null */
export function getLatestStatus(
  logs: AttendanceLog[],
  siteId: string,
  userId: string,
  today: string
): AttendanceStatus | null {
  const entries = logs
    .filter(l => l.siteId === siteId && l.userId === userId && l.timestamp.startsWith(today))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return entries.length > 0 ? entries[entries.length - 1].status : null;
}

/** Returns Map<userId, AttendanceStatus> for all users at a site today */
export function getSiteStatusMap(
  logs: AttendanceLog[],
  siteId: string,
  today: string
): Map<string, AttendanceStatus> {
  const map = new Map<string, AttendanceStatus>();
  const entries = logs
    .filter(l => l.siteId === siteId && l.timestamp.startsWith(today))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  for (const e of entries) map.set(e.userId, e.status);
  return map;
}

/** Count of staff active (clock_in | break_in | break_out) at a site today */
export function countActiveStaff(
  logs: AttendanceLog[],
  siteId: string,
  today: string
): number {
  const map = getSiteStatusMap(logs, siteId, today);
  let n = 0;
  for (const s of map.values()) {
    if (s === "clock_in" || s === "break_in" || s === "break_out") n++;
  }
  return n;
}

// ─── Equipment types ──────────────────────────────────────────────────────────

export type EquipmentCategory = "自社保有" | "リース" | "レンタル";
export type EquipmentType     = "重機" | "アタッチメント" | "車両" | "その他";
export type EquipmentStatus   = "稼働中" | "待機中" | "修理中" | "返却済み";

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  type: EquipmentType;
  supplier: string;
  unitPrice: number;   // 日単価
  status: EquipmentStatus;
  returnDeadline?: string;  // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  siteId: string;
  siteName: string;
  startDate: string;
  endDate: string;
}

export interface FuelLog {
  id: string;
  equipmentId: string;
  equipmentName: string;
  siteId: string;
  date: string;
  liters: number;
  pricePerLiter: number;
  reporter: string;
  memo?: string;
}

export type ExpenseCategory =
  | "燃料費"
  | "工具・消耗品"
  | "資材購入"
  | "交通費"
  | "食費・雑費"
  | "その他";

export interface ExpenseLog {
  id: string;
  category: ExpenseCategory;
  siteId: string;
  siteName: string;
  date: string;
  amount: number;
  description: string;
  reporter: string;
  memo?: string;
  // 燃料費のみ
  equipmentId?: string;
  equipmentName?: string;
  liters?: number;
  pricePerLiter?: number;
}

export interface Client {
  id: string;
  name: string;          // 会社名 / 屋号 / 個人名（必須）
  contactName?: string;  // 担当者名
  phone?: string;
  email?: string;
  address?: string;
  memo?: string;
  status: ClientStatus;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  adminName: string;
  adminEmail: string;
  password1: string;   // 全従業員共有
  password2: string;   // 管理者専用 (default "0000")
  plan: PlanId;
  stripeCustomerId: string;
  createdAt: string;
}

export interface OperationLog {
  id: string;
  action: string;
  user: string;
  device: string;
  timestamp: string;
}

export type SelectedSite = { id: string; name: string } | null;

// ─── Plan limits ──────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<PlanId, { sites: number; members: number; retentionDays: number }> = {
  free:       { sites: 2,         members: 8,   retentionDays: 90 },
  standard:   { sites: 10,        members: 30,  retentionDays: 365 },
  business:   { sites: 30,        members: 80,  retentionDays: 730 },
  enterprise: { sites: Infinity,  members: Infinity, retentionDays: Infinity },
};

// ─── Context type ─────────────────────────────────────────────────────────────

type AppContextType = {
  // Legacy (keep for backward compat)
  selectedSite: SelectedSite;
  setSelectedSite: (site: SelectedSite) => void;
  adminMode: boolean;
  setAdminMode: (v: boolean) => void;
  isAdminCapable: boolean;
  authSiteId: string | null;
  setAuthSiteId: (id: string | null) => void;

  // New
  authLevel: AuthLevel;
  setAuthLevel: (level: AuthLevel) => void;
  company: Company | null;
  setCompany: (c: Company) => void;
  plan: PlanId;
  operationLog: OperationLog[];
  addLog: (action: string, user?: string) => void;

  // 元請け管理
  clients: Client[];
  addClient: (data: Omit<Client, "id" | "createdAt" | "updatedAt">) => Client;
  updateClient: (id: string, patch: Partial<Omit<Client, "id" | "createdAt">>) => void;

  // 機材・車両管理
  equipment: Equipment[];
  addEquipment: (data: Omit<Equipment, "id" | "createdAt">) => Equipment;
  updateEquipment: (id: string, patch: Partial<Omit<Equipment, "id" | "createdAt">>) => void;
  assignments: EquipmentAssignment[];
  addAssignment: (data: Omit<EquipmentAssignment, "id">) => void;
  removeAssignment: (id: string) => void;
  fuelLogs: FuelLog[];
  addFuelLog: (data: Omit<FuelLog, "id">) => void;
  expenseLogs: ExpenseLog[];
  addExpenseLog: (data: Omit<ExpenseLog, "id">) => void;

  // 作業員評価
  evaluations: WorkerEval[];
  addEvaluation: (data: WorkerEval) => void;

  // 勤怠打刻
  attendanceLogs: AttendanceLog[];
  addAttendanceLogs: (entries: Omit<AttendanceLog, "id">[]) => void;

  // 閲覧者ID（職長による緊急連絡先例外制御）
  viewerMemberId: string | null;
  setViewerMemberId: (id: string | null) => void;
};

// ─── Default company (demo) ───────────────────────────────────────────────────

const DEMO_COMPANY: Company = {
  id: "demo",
  name: "解体工業株式会社",
  address: "東京都世田谷区1-1-1",
  phone: "03-1234-5678",
  adminName: "田中 義雄",
  adminEmail: "tanaka@kaitai.jp",
  password1: "kaitai2026",
  password2: "0000",
  plan: "standard",
  stripeCustomerId: "cus_mock_DEMO00001",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function loadCompany(): Company {
  if (typeof window === "undefined") return DEMO_COMPANY;
  try {
    const s = localStorage.getItem("kaitai_company");
    return s ? JSON.parse(s) : DEMO_COMPANY;
  } catch {
    return DEMO_COMPANY;
  }
}

// ─── Seed clients ─────────────────────────────────────────────────────────────

const SEED_CLIENTS: Client[] = [
  {
    id: "cl001",
    name: "株式会社大和建設",
    contactName: "前田 健二",
    phone: "03-3456-7890",
    email: "maeda@yamato-const.jp",
    address: "東京都品川区西品川1-1-1",
    memo: "大手ゼネコン。年間10件以上の紹介実績あり。",
    status: "active",
    archived: false,
    createdAt: "2025-06-01T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "cl002",
    name: "三和不動産株式会社",
    contactName: "高橋 美咲",
    phone: "03-2345-6789",
    email: "takahashi@sanwa-re.jp",
    address: "東京都渋谷区恵比寿4-20-3",
    memo: "マンション解体案件多い。支払い条件：翌月末。",
    status: "active",
    archived: false,
    createdAt: "2025-09-10T00:00:00.000Z",
    updatedAt: "2025-12-01T00:00:00.000Z",
  },
  {
    id: "cl003",
    name: "田村工務店",
    contactName: "田村 浩",
    phone: "044-567-8901",
    email: "",
    address: "神奈川県川崎市中原区小杉町2-5",
    memo: "個人工務店。紹介ベース。",
    status: "active",
    archived: false,
    createdAt: "2025-11-20T00:00:00.000Z",
    updatedAt: "2025-11-20T00:00:00.000Z",
  },
];

// ─── Seed equipment ───────────────────────────────────────────────────────────

const SEED_EQUIPMENT: Equipment[] = [
  { id: "eq001", name: "0.7バックホー", category: "自社保有", type: "重機", supplier: "自社（本社倉庫）", unitPrice: 25_000, status: "稼働中", notes: "コマツ PC78US-10", createdAt: "2025-01-01T00:00:00.000Z" },
  { id: "eq002", name: "解体用アタッチメント", category: "自社保有", type: "アタッチメント", supplier: "自社（本社倉庫）", unitPrice: 8_000, status: "稼働中", notes: "クラッシャー・ブレーカー兼用", createdAt: "2025-01-01T00:00:00.000Z" },
  { id: "eq003", name: "2tダンプ", category: "自社保有", type: "車両", supplier: "自社（本社倉庫）", unitPrice: 12_000, status: "稼働中", notes: "日野 デュトロ", createdAt: "2025-01-01T00:00:00.000Z" },
  { id: "eq004", name: "10tダンプ", category: "リース", type: "車両", supplier: "東洋リース株式会社", unitPrice: 30_000, status: "稼働中", returnDeadline: "2026-04-30", notes: "いすゞ ギガ。月額リース契約。", createdAt: "2025-12-01T00:00:00.000Z" },
  { id: "eq005", name: "散水車", category: "レンタル", type: "車両", supplier: "レントオール東京", unitPrice: 18_000, status: "待機中", returnDeadline: "2026-04-10", notes: "防塵用。粉塵が多い現場で使用。", createdAt: "2026-03-01T00:00:00.000Z" },
  { id: "eq006", name: "1.4バックホー", category: "リース", type: "重機", supplier: "カナモト", unitPrice: 35_000, status: "修理中", returnDeadline: "2026-05-15", notes: "コマツ PC128US。油圧シリンダー修理中。", createdAt: "2026-02-01T00:00:00.000Z" },
];

const SEED_ASSIGNMENTS: EquipmentAssignment[] = [
  { id: "asgn001", equipmentId: "eq001", siteId: "s1", siteName: "山田邸解体工事", startDate: "2026-03-18", endDate: "2026-04-10" },
  { id: "asgn002", equipmentId: "eq003", siteId: "s1", siteName: "山田邸解体工事", startDate: "2026-03-18", endDate: "2026-04-10" },
  { id: "asgn003", equipmentId: "eq004", siteId: "s2", siteName: "旧田中倉庫解体", startDate: "2026-03-25", endDate: "2026-04-20" },
  { id: "asgn004", equipmentId: "eq002", siteId: "s2", siteName: "旧田中倉庫解体", startDate: "2026-03-25", endDate: "2026-04-20" },
];

const SEED_FUEL_LOGS: FuelLog[] = [
  { id: "fuel001", equipmentId: "eq001", equipmentName: "0.7バックホー", siteId: "s1", date: "2026-03-20", liters: 45, pricePerLiter: 155, reporter: "田中", memo: "" },
  { id: "fuel002", equipmentId: "eq003", equipmentName: "2tダンプ", siteId: "s1", date: "2026-03-22", liters: 30, pricePerLiter: 145, reporter: "鈴木", memo: "" },
];

// ─── Seed attendance (2026-04-03) ─────────────────────────────────────────────

const SEED_ATTENDANCE: AttendanceLog[] = [
  { id: "att001", userId: "m1", siteId: "s1", status: "clock_in",  timestamp: "2026-04-03T07:55:00.000Z" },
  { id: "att002", userId: "m2", siteId: "s1", status: "clock_in",  timestamp: "2026-04-03T08:03:00.000Z" },
  { id: "att003", userId: "m3", siteId: "s1", status: "break_in",  timestamp: "2026-04-03T12:00:00.000Z" },
  { id: "att004", userId: "m4", siteId: "s2", status: "clock_in",  timestamp: "2026-04-03T08:15:00.000Z" },
  { id: "att005", userId: "m5", siteId: "s2", status: "clock_out", timestamp: "2026-04-03T16:30:00.000Z" },
];

// ─── Context + provider ───────────────────────────────────────────────────────

const AppContext = createContext<AppContextType>({
  selectedSite: null, setSelectedSite: () => {},
  adminMode: false,   setAdminMode: () => {},
  isAdminCapable: true,
  authSiteId: null,   setAuthSiteId: () => {},
  authLevel: "worker", setAuthLevel: () => {},
  company: null,      setCompany: () => {},
  plan: "standard" as PlanId,
  operationLog: [],   addLog: () => {},
  clients: SEED_CLIENTS,
  addClient: () => SEED_CLIENTS[0],
  updateClient: () => {},
  equipment: SEED_EQUIPMENT,
  addEquipment: () => SEED_EQUIPMENT[0],
  updateEquipment: () => {},
  assignments: SEED_ASSIGNMENTS,
  addAssignment: () => {},
  removeAssignment: () => {},
  fuelLogs: SEED_FUEL_LOGS,
  addFuelLog: () => {},
  expenseLogs: [],
  addExpenseLog: () => {},
  evaluations: [],
  addEvaluation: () => {},
  attendanceLogs: SEED_ATTENDANCE,
  addAttendanceLogs: () => {},
  viewerMemberId: null,
  setViewerMemberId: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedSite, setSelectedSite] = useState<SelectedSite>(null);
  const [authSiteId,   setAuthSiteId]   = useState<string | null>(null);
  const [authLevel,    setAuthLevelRaw] = useState<AuthLevel>(() => {
    if (typeof window === "undefined") return "worker";
    try { return (sessionStorage.getItem("kaitai_auth_level") as AuthLevel) || "worker"; } catch { return "worker"; }
  });
  const [company,      setCompanyRaw]   = useState<Company>(loadCompany);
  const [operationLog, setOperationLog] = useState<OperationLog[]>([]);
  const [clients,      setClients]      = useState<Client[]>(SEED_CLIENTS);
  const [equipment,    setEquipment]    = useState<Equipment[]>(SEED_EQUIPMENT);
  const [assignments,  setAssignments]  = useState<EquipmentAssignment[]>(SEED_ASSIGNMENTS);
  const [fuelLogs,     setFuelLogs]     = useState<FuelLog[]>(SEED_FUEL_LOGS);
  const [expenseLogs,    setExpenseLogs]    = useState<ExpenseLog[]>([]);
  const [evaluations,    setEvaluations]    = useState<WorkerEval[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(SEED_ATTENDANCE);
  const [viewerMemberId, setViewerMemberId] = useState<string | null>(null);

  // Derived
  const adminMode = authLevel === "admin" || authLevel === "dev";
  const plan = company?.plan ?? "free";

  // setAdminMode wrapper keeps nav unchanged
  const setAdminMode = useCallback((v: boolean) => {
    const level = v ? "admin" : "worker";
    try { sessionStorage.setItem("kaitai_auth_level", level); } catch {}
    setAuthLevelRaw(level);
  }, []);

  const setAuthLevel = useCallback((level: AuthLevel) => {
    try { sessionStorage.setItem("kaitai_auth_level", level); } catch {}
    setAuthLevelRaw(level);
  }, []);

  const setCompany = useCallback((c: Company) => {
    setCompanyRaw(c);
    try { localStorage.setItem("kaitai_company", JSON.stringify(c)); } catch {}
  }, []);

  const addClient = useCallback((data: Omit<Client, "id" | "createdAt" | "updatedAt">): Client => {
    const now = new Date().toISOString();
    const newClient: Client = { ...data, id: `cl${Date.now().toString(36)}`, createdAt: now, updatedAt: now };
    setClients(prev => [newClient, ...prev]);
    return newClient;
  }, []);

  const updateClient = useCallback((id: string, patch: Partial<Omit<Client, "id" | "createdAt">>) => {
    setClients(prev => prev.map(c => c.id === id
      ? { ...c, ...patch, updatedAt: new Date().toISOString() }
      : c
    ));
  }, []);

  const addEquipment = useCallback((data: Omit<Equipment, "id" | "createdAt">): Equipment => {
    const eq: Equipment = { ...data, id: `eq${Date.now().toString(36)}`, createdAt: new Date().toISOString() };
    setEquipment(prev => [eq, ...prev]);
    return eq;
  }, []);

  const updateEquipment = useCallback((id: string, patch: Partial<Omit<Equipment, "id" | "createdAt">>) => {
    setEquipment(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const addAssignment = useCallback((data: Omit<EquipmentAssignment, "id">) => {
    setAssignments(prev => [...prev, { ...data, id: `asgn${Date.now().toString(36)}` }]);
  }, []);

  const removeAssignment = useCallback((id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  }, []);

  const addFuelLog = useCallback((data: Omit<FuelLog, "id">) => {
    setFuelLogs(prev => [{ ...data, id: `fuel${Date.now().toString(36)}` }, ...prev]);
  }, []);

  const addExpenseLog = useCallback((data: Omit<ExpenseLog, "id">) => {
    setExpenseLogs(prev => [{ ...data, id: `exp${Date.now().toString(36)}` }, ...prev]);
  }, []);

  const addEvaluation = useCallback((data: WorkerEval) => {
    setEvaluations(prev => [data, ...prev]);
  }, []);

  const addAttendanceLogs = useCallback((entries: Omit<AttendanceLog, "id">[]) => {
    const newLogs: AttendanceLog[] = entries.map(e => ({
      ...e,
      id: `att${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    }));
    setAttendanceLogs(prev => [...prev, ...newLogs]);
  }, []);

  const addLog = useCallback((action: string, user = "system") => {
    const device = typeof window !== "undefined"
      ? window.navigator.userAgent.slice(0, 60)
      : "server";
    setOperationLog(prev => [{
      id: Date.now().toString(36),
      action,
      user,
      device,
      timestamp: new Date().toISOString(),
    }, ...prev].slice(0, 200)); // keep last 200
  }, []);

  return (
    <AppContext.Provider value={{
      selectedSite, setSelectedSite,
      adminMode,    setAdminMode,
      isAdminCapable: true,
      authSiteId,   setAuthSiteId,
      authLevel,    setAuthLevel,
      company,      setCompany,
      plan: plan as PlanId,
      operationLog, addLog,
      clients,      addClient, updateClient,
      equipment,    addEquipment, updateEquipment,
      assignments,  addAssignment, removeAssignment,
      fuelLogs,     addFuelLog,
      expenseLogs,  addExpenseLog,
      evaluations,  addEvaluation,
      attendanceLogs, addAttendanceLogs,
      viewerMemberId, setViewerMemberId,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
