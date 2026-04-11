"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
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
  // 添付写真
  imageIds?: string[];
}

export type ClientContact = { name: string; phone: string; role?: string };

export interface Client {
  id: string;
  name: string;          // 会社名 / 屋号 / 個人名（必須）
  contactName?: string;  // 担当者名（後方互換）
  phone?: string;
  email?: string;
  address?: string;
  memo?: string;
  contacts?: ClientContact[];  // 複数担当者
  status: ClientStatus;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  adminName: string;
  adminEmail: string;
  plan: PlanId;
  stripeCustomerId?: string;
  createdAt?: string;
}

export interface OperationLog {
  id: string;
  action: string;
  user: string;
  device: string;
  timestamp: string;
}

export type SelectedSite = { id: string; name: string } | null;

// ─── Handover memo ────────────────────────────────────────────────────────────

export interface HandoverMemo {
  id: string;
  siteId: string;
  date: string;      // YYYY-MM-DD (the date it was written for)
  memo: string;
  evaluatorId: string;
  createdAt: string;
}

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
  setCompany: (c: Company | null) => void;
  sessionReady: boolean;
  plan: PlanId;
  operationLog: OperationLog[];
  addLog: (action: string, user?: string, imageIds?: string[]) => void;

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

  // 引き継ぎメモ
  handoverMemos: HandoverMemo[];
  addHandoverMemo: (data: Omit<HandoverMemo, "id" | "createdAt">) => void;
  getHandoverMemo: (siteId: string, date: string) => HandoverMemo | undefined;
};

// ─── Default company (demo) ───────────────────────────────────────────────────

function loadCompany(): Company | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem("kaitai_company");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

// ─── Empty initial state (no demo data for new companies) ────────────────────

// ─── Context + provider ───────────────────────────────────────────────────────

const AppContext = createContext<AppContextType>({
  selectedSite: null, setSelectedSite: () => {},
  adminMode: false,   setAdminMode: () => {},
  isAdminCapable: true,
  authSiteId: null,   setAuthSiteId: () => {},
  authLevel: "worker", setAuthLevel: () => {},
  company: null,      setCompany: () => {},
  sessionReady: false,
  plan: "free" as PlanId,
  operationLog: [],   addLog: () => {},
  clients: [],
  addClient: () => ({ id: "", name: "", status: "active" as ClientStatus, archived: false, createdAt: "", updatedAt: "" }),
  updateClient: () => {},
  equipment: [],
  addEquipment: () => ({ id: "", name: "", category: "自社保有" as EquipmentCategory, type: "重機" as EquipmentType, supplier: "", unitPrice: 0, status: "待機中" as EquipmentStatus, createdAt: "" }),
  updateEquipment: () => {},
  assignments: [],
  addAssignment: () => {},
  removeAssignment: () => {},
  fuelLogs: [],
  addFuelLog: () => {},
  expenseLogs: [],
  addExpenseLog: () => {},
  evaluations: [],
  addEvaluation: () => {},
  attendanceLogs: [],
  addAttendanceLogs: () => {},
  viewerMemberId: null,
  setViewerMemberId: () => {},
  handoverMemos: [],
  addHandoverMemo: () => {},
  getHandoverMemo: () => undefined,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedSite, setSelectedSite] = useState<SelectedSite>(null);
  const [authSiteId,   setAuthSiteId]   = useState<string | null>(null);
  const [authLevel,    setAuthLevelRaw] = useState<AuthLevel>(() => {
    if (typeof window === "undefined") return "worker";
    try { return (sessionStorage.getItem("kaitai_auth_level") as AuthLevel) || "worker"; } catch { return "worker"; }
  });
  const [company,      setCompanyRaw]   = useState<Company | null>(loadCompany);
  const [sessionReady, setSessionReady] = useState(false);
  const [operationLog, setOperationLog] = useState<OperationLog[]>([]);
  const [clients,      setClients]      = useState<Client[]>([]);
  const [equipment,    setEquipment]    = useState<Equipment[]>([]);
  const [assignments,  setAssignments]  = useState<EquipmentAssignment[]>([]);
  const [fuelLogs,     setFuelLogs]     = useState<FuelLog[]>([]);
  const [expenseLogs,    setExpenseLogs]    = useState<ExpenseLog[]>([]);
  const [evaluations,    setEvaluations]    = useState<WorkerEval[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [viewerMemberId, setViewerMemberId] = useState<string | null>(null);
  const [handoverMemos,  setHandoverMemos]  = useState<HandoverMemo[]>([]);

  // セッション初期化: cookie ベースの認証状態を復元
  useEffect(() => {
    let cancelled = false;
    fetch("/api/kaitai/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return;
        if (data && data.companyId) {
          const c: Company = {
            id: data.companyId,
            name: data.companyName,
            adminName: data.adminName,
            adminEmail: data.adminEmail ?? "",
            plan: (data.plan ?? "free") as PlanId,
          };
          setCompanyRaw(c);
          try { localStorage.setItem("kaitai_company", JSON.stringify(c)); } catch {}
          setAuthLevelRaw(data.authLevel ?? "worker");
          try { sessionStorage.setItem("kaitai_auth_level", data.authLevel ?? "worker"); } catch {}
        }
        setSessionReady(true);
      })
      .catch(() => { if (!cancelled) setSessionReady(true); });
    return () => { cancelled = true; };
  }, []);

  // Fetch company data once session is ready
  useEffect(() => {
    if (!sessionReady || !company) return;

    // Fetch clients
    fetch("/api/kaitai/clients", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.clients) setClients(data.clients);
      })
      .catch(() => {});

    // Fetch equipment
    fetch("/api/kaitai/equipment", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.equipment) setEquipment(data.equipment);
      })
      .catch(() => {});

    // Fetch expense logs
    fetch("/api/kaitai/expense", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.logs) setExpenseLogs(data.logs);
      })
      .catch(() => {});
  }, [sessionReady, company]);

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

  const setCompany = useCallback((c: Company | null) => {
    setCompanyRaw(c);
    try {
      if (c) localStorage.setItem("kaitai_company", JSON.stringify(c));
      else localStorage.removeItem("kaitai_company");
    } catch {}
  }, []);

  const addClient = useCallback((data: Omit<Client, "id" | "createdAt" | "updatedAt">): Client => {
    const now = new Date().toISOString();
    const newClient: Client = { ...data, id: `cl${Date.now().toString(36)}`, createdAt: now, updatedAt: now };
    setClients(prev => [newClient, ...prev]);
    // Persist to API
    fetch("/api/kaitai/clients", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(r => r.ok ? r.json() : null).then(res => {
      if (res?.client) {
        setClients(prev => prev.map(c => c.id === newClient.id ? { ...res.client } : c));
      }
    }).catch(() => {});
    return newClient;
  }, []);

  const updateClient = useCallback((id: string, patch: Partial<Omit<Client, "id" | "createdAt">>) => {
    setClients(prev => prev.map(c => c.id === id
      ? { ...c, ...patch, updatedAt: new Date().toISOString() }
      : c
    ));
    // Persist to API
    fetch("/api/kaitai/clients", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    }).catch(() => {});
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

    // Persist to DB as expense (fuel_log operation log is created by the expense API)
    fetch("/api/kaitai/expense", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "燃料費",
        siteId: data.siteId,
        siteName: null,
        amount: Math.round((data.liters ?? 0) * (data.pricePerLiter ?? 155)),
        description: `${data.equipmentName ?? ""}への給油 ${data.liters ?? 0}L`,
        reporter: data.reporter ?? "作業員",
        date: data.date,
        memo: data.memo ?? null,
        equipmentId: data.equipmentId ?? null,
        equipmentName: data.equipmentName ?? null,
        liters: data.liters,
        pricePerLiter: data.pricePerLiter,
      }),
    }).catch(() => {});
  }, []);

  const addExpenseLog = useCallback((data: Omit<ExpenseLog, "id">) => {
    const tempId = `exp${Date.now().toString(36)}`;
    setExpenseLogs(prev => [{ ...data, id: tempId }, ...prev]);

    // Persist to DB (creates KaitaiExpenseLog + KaitaiOperationLog)
    fetch("/api/kaitai/expense", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(r => r.ok ? r.json() : null).then(res => {
      if (res?.log) {
        setExpenseLogs(prev => prev.map(e => e.id === tempId ? { ...e, id: res.log.id } : e));
      }
    }).catch(() => {});
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

  const addHandoverMemo = useCallback((data: Omit<HandoverMemo, "id" | "createdAt">) => {
    const memo: HandoverMemo = { ...data, id: `hm${Date.now().toString(36)}`, createdAt: new Date().toISOString() };
    setHandoverMemos(prev => [memo, ...prev]);
  }, []);

  const getHandoverMemo = useCallback((siteId: string, date: string): HandoverMemo | undefined => {
    return handoverMemos.find(m => m.siteId === siteId && m.date === date);
  }, [handoverMemos]);

  const addLog = useCallback((action: string, user = "system", imageIds?: string[]) => {
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

    // Persist to DB
    fetch("/api/kaitai/operation-logs", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, user, device, imageIds: imageIds ?? [] }),
    }).catch(() => {});
  }, []);

  return (
    <AppContext.Provider value={{
      selectedSite, setSelectedSite,
      adminMode,    setAdminMode,
      isAdminCapable: true,
      authSiteId,   setAuthSiteId,
      authLevel,    setAuthLevel,
      company,      setCompany,
      sessionReady,
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
      handoverMemos, addHandoverMemo, getHandoverMemo,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
