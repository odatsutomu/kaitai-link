"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Building2, User, Lock, Sparkles } from "lucide-react";
import { KaitaiLogo } from "../components/kaitai-logo";
import { useAppContext, Company } from "../lib/app-context";
import { T } from "../lib/design-tokens";

type Step = "company" | "admin" | "password" | "complete";

const STEPS: Step[] = ["company", "admin", "password", "complete"];

const STEP_META: Record<Step, { label: string }> = {
  company:  { label: "会社情報" },
  admin:    { label: "管理者情報" },
  password: { label: "パスワード設定" },
  complete: { label: "登録完了" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const { setCompany, addLog } = useAppContext();

  const [step, setStep]   = useState<Step>("company");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [address,     setAddress]     = useState("");
  const [phone,       setPhone]       = useState("");
  const [adminName,   setAdminName]   = useState("");
  const [email,       setEmail]       = useState("");
  const [pw1,         setPw1]         = useState(""); // 全従業員
  const [pw2,         setPw2]         = useState(""); // 管理者

  const stepIdx = STEPS.indexOf(step);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (step === "company") {
      if (!companyName.trim()) e.companyName = "会社名を入力してください";
      if (!address.trim())     e.address     = "住所を入力してください";
      if (!phone.trim())       e.phone       = "電話番号を入力してください";
    }
    if (step === "admin") {
      if (!adminName.trim()) e.adminName = "担当者氏名を入力してください";
      if (!email.trim() || !email.includes("@")) e.email = "正しいメールアドレスを入力してください";
    }
    if (step === "password") {
      if (pw1.length < 4) e.pw1 = "4文字以上で設定してください";
      if (pw2.length < 4) e.pw2 = "4文字以上で設定してください";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validate()) return;
    if (step === "password") {
      // Complete registration with free plan
      const company: Company = {
        id: Date.now().toString(36),
        name: companyName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        adminName: adminName.trim(),
        adminEmail: email.trim(),
        password1: pw1,
        password2: pw2,
        plan: "free",
        stripeCustomerId: "",
        createdAt: new Date().toISOString(),
      };
      setCompany(company);
      addLog("signup_complete", email.trim());
    }
    setStep(STEPS[stepIdx + 1]);
  }

  function back() {
    if (stepIdx > 0) setStep(STEPS[stepIdx - 1]);
  }

  function field(
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts: { type?: string; placeholder?: string; key: string }
  ) {
    return (
      <div key={opts.key} className="flex flex-col gap-1.5">
        <label style={{ fontSize: 13, fontWeight: 700, color: "#555555" }}>{label}</label>
        <input
          type={opts.type ?? "text"}
          value={value}
          onChange={e => { onChange(e.target.value); setErrors(prev => ({ ...prev, [opts.key]: "" })); }}
          placeholder={opts.placeholder ?? ""}
          className="w-full rounded-2xl px-4 outline-none transition-all"
          style={{
            height: 56,
            fontSize: 16,
            background: T.bg,
            border: errors[opts.key] ? "2px solid #EF4444" : "2px solid #EEEEEE",
            color: "#111111",
          }}
        />
        {errors[opts.key] && (
          <p style={{ fontSize: 12, color: "#EF4444" }}>{errors[opts.key]}</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto flex flex-col min-h-screen pb-8" style={{ background: T.surface }}>

      {/* Header */}
      <header className="px-5 pt-10 pb-5 flex items-center gap-3">
        {stepIdx > 0 && step !== "complete" && (
          <button onClick={back} className="w-10 h-10 flex items-center justify-center rounded-2xl" style={{ background: "#F5F5F5" }}>
            <ChevronLeft size={20} style={{ color: "#444" }} />
          </button>
        )}
        <KaitaiLogo iconSize={32} textSize={20} />
      </header>

      {/* Progress bar */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-1.5 mb-2">
          {STEPS.filter(s => s !== "complete").map((s, i) => {
            const done = STEPS.indexOf(step) > i;
            const curr = s === step;
            return (
              <div key={s} className="flex-1 rounded-full" style={{
                height: 4,
                background: done ? T.primary : curr ? "#FFCC80" : "#EEEEEE",
              }} />
            );
          })}
        </div>
        <p style={{ fontSize: 12, color: "#888888" }}>
          {step === "complete" ? "完了" : `ステップ ${stepIdx + 1} / ${STEPS.length - 1}：${STEP_META[step].label}`}
        </p>
      </div>

      <div className="flex-1 px-5 flex flex-col gap-5">

        {/* ── Step: company ── */}
        {step === "company" && (
          <>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#111111" }}>会社情報を入力</h2>
              <p style={{ fontSize: 14, color: "#888888", marginTop: 4 }}>解体LINK に登録する会社の基本情報</p>
            </div>
            <div className="flex flex-col gap-4">
              {field("会社名", companyName, setCompanyName, { placeholder: "例: 山田解体工業株式会社", key: "companyName" })}
              {field("会社住所", address, setAddress, { placeholder: "例: 東京都世田谷区1-1-1", key: "address" })}
              {field("電話番号", phone, setPhone, { placeholder: "例: 03-1234-5678", type: "tel", key: "phone" })}
            </div>
          </>
        )}

        {/* ── Step: admin ── */}
        {step === "admin" && (
          <>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#111111" }}>管理者情報を入力</h2>
              <p style={{ fontSize: 14, color: "#888888", marginTop: 4 }}>アカウントを管理する担当者の情報</p>
            </div>
            <div className="flex flex-col gap-4">
              {field("担当者氏名", adminName, setAdminName, { placeholder: "例: 田中 義雄", key: "adminName" })}
              {field("メールアドレス", email, setEmail, { placeholder: "例: tanaka@company.jp", type: "email", key: "email" })}
            </div>
          </>
        )}

        {/* ── Step: password ── */}
        {step === "password" && (
          <>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#111111" }}>パスワードを設定</h2>
              <p style={{ fontSize: 14, color: "#888888", marginTop: 4 }}>2種類のパスワードで権限を分離します</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl p-5" style={{ background: T.primaryLt, border: "1.5px solid #FED7AA" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#B45309", marginBottom: 2 }}>第一パスワード（全従業員共有）</p>
                <p style={{ fontSize: 11, color: "#92400E" }}>現場確認・スケジュール・勤怠報告に使用</p>
              </div>
              {field("第一パスワード", pw1, setPw1, { placeholder: "4文字以上", type: "password", key: "pw1" })}

              <div className="rounded-2xl p-5" style={{ background: "#FEF2F2", border: "1.5px solid #FECACA" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", marginBottom: 2 }}>第二パスワード（管理者専用）</p>
                <p style={{ fontSize: 11, color: "#7F1D1D" }}>経営分析・メンバー評価・管理者ページに使用</p>
              </div>
              {field("第二パスワード", pw2, setPw2, { placeholder: "4文字以上", type: "password", key: "pw2" })}
            </div>
          </>
        )}

        {/* ── Step: complete ── */}
        {step === "complete" && (
          <div className="flex flex-col items-center text-center pt-4">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: "#E8F5E9" }}>
              <span style={{ fontSize: 48 }}>🎉</span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: "#111111", marginBottom: 8 }}>登録完了！</h2>
            <p style={{ fontSize: 15, color: "#666666", marginBottom: 28, lineHeight: 1.6 }}>
              {companyName} の<br />解体LINK アカウントが作成されました
            </p>

            {/* Summary */}
            <div className="w-full rounded-2xl p-4 mb-6 text-left" style={{ background: T.bg, border: "1.5px solid #EEEEEE" }}>
              {[
                { label: "会社名",   value: companyName },
                { label: "管理者",   value: adminName },
                { label: "メール",   value: email },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2" style={{ borderBottom: "1px solid #EEEEEE" }}>
                  <span style={{ fontSize: 12, color: "#888888" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111111" }}>{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/kaitai/login")}
              className="w-full flex items-center justify-center gap-2 rounded-3xl font-black"
              style={{ height: 64, fontSize: 18, background: "#111111", color: T.surface }}
            >
              ログインへ進む <ChevronRight size={20} />
            </button>
          </div>
        )}

      </div>

      {/* Next button */}
      {step !== "complete" && (
        <div className="px-5 pt-4">
          <button
            onClick={next}
            className="w-full flex items-center justify-center gap-2 rounded-3xl font-black transition-all active:scale-[0.98]"
            style={{ height: 64, fontSize: 18, background: "#111111", color: T.surface }}
          >
            {step === "password" ? "登録する" : "次へ"} <ChevronRight size={22} />
          </button>
        </div>
      )}

    </div>
  );
}
