"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Building2, Save, Upload, Trash2, Loader2,
  User, MapPin, Phone, Mail, FileText, Landmark, Stamp,
} from "lucide-react";
import Link from "next/link";
import { TDark, T } from "../../lib/design-tokens";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CompanyProfile {
  name: string;
  rep: string;
  zip: string;
  address: string;
  tel: string;
  fax: string;
  email: string;
  invoiceNo: string;
  bank: string;
  bankType: string;
  bankNo: string;
  bankHolder: string;
}

const EMPTY_PROFILE: CompanyProfile = {
  name: "", rep: "", zip: "", address: "",
  tel: "", fax: "", email: "", invoiceNo: "",
  bank: "", bankType: "", bankNo: "", bankHolder: "",
};

// ─── Field definitions ──────────────────────────────────────────────────────

const SECTIONS = [
  {
    title: "基本情報",
    icon: Building2,
    fields: [
      { key: "name",    label: "会社名",     placeholder: "例：株式会社○○解体", icon: Building2 },
      { key: "rep",     label: "代表者名",   placeholder: "例：山田 太郎", icon: User },
      { key: "zip",     label: "郵便番号",   placeholder: "例：700-0000", icon: MapPin },
      { key: "address", label: "住所",       placeholder: "例：岡山県岡山市北区○○1-2-3", icon: MapPin },
    ],
  },
  {
    title: "連絡先",
    icon: Phone,
    fields: [
      { key: "tel",   label: "電話番号", placeholder: "例：086-000-0000", icon: Phone },
      { key: "fax",   label: "FAX番号",  placeholder: "例：086-000-0001", icon: Phone },
      { key: "email", label: "メール",   placeholder: "例：info@example.com", icon: Mail },
    ],
  },
  {
    title: "請求書関連",
    icon: FileText,
    fields: [
      { key: "invoiceNo", label: "適格請求書 登録番号", placeholder: "例：T1234567890123", icon: FileText },
    ],
  },
  {
    title: "振込先口座",
    icon: Landmark,
    fields: [
      { key: "bank",       label: "銀行名",   placeholder: "例：○○銀行 ○○支店", icon: Landmark },
      { key: "bankType",   label: "口座種別", placeholder: "例：普通", icon: Landmark },
      { key: "bankNo",     label: "口座番号", placeholder: "例：1234567", icon: Landmark },
      { key: "bankHolder", label: "口座名義", placeholder: "例：カ）○○カイタイ", icon: Landmark },
    ],
  },
] as const;

// ─── Component ──────────────────────────────────────────────────────────────

export default function CompanySettingsPage() {
  const [profile, setProfile] = useState<CompanyProfile>({ ...EMPTY_PROFILE });
  const [stampUrl, setStampUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stampUploading, setStampUploading] = useState(false);
  const stampInputRef = useRef<HTMLInputElement>(null);

  // Load existing profile
  useEffect(() => {
    fetch("/api/kaitai/company/profile", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const p = data.profile as Partial<CompanyProfile> | null;
          const defaults = data.defaults ?? {};
          setProfile({
            ...EMPTY_PROFILE,
            // Use defaults from company table if profile fields are empty
            name: p?.name || defaults.name || "",
            address: p?.address || defaults.address || "",
            tel: p?.tel || defaults.tel || "",
            // Remaining from profile
            rep: p?.rep || "",
            zip: p?.zip || "",
            fax: p?.fax || "",
            email: p?.email || "",
            invoiceNo: p?.invoiceNo || "",
            bank: p?.bank || "",
            bankType: p?.bankType || "",
            bankNo: p?.bankNo || "",
            bankHolder: p?.bankHolder || "",
          });
          setStampUrl(data.stampUrl || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Save profile
  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/kaitai/company/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert("保存に失敗しました");
      }
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  // Upload stamp image
  async function handleStampUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("ファイルサイズは2MB以下にしてください");
      return;
    }

    setStampUploading(true);
    try {
      // Upload to R2
      const formData = new FormData();
      formData.append("file", file);
      formData.append("siteId", "company-stamp");
      formData.append("reportType", "stamp");

      const uploadRes = await fetch("/api/kaitai/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();
      const url = uploadData.image.url;

      // Save stamp URL to company profile
      const saveRes = await fetch("/api/kaitai/company/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stampUrl: url }),
      });

      if (saveRes.ok) {
        setStampUrl(url);
      } else {
        throw new Error("Save failed");
      }
    } catch {
      alert("スタンプ画像のアップロードに失敗しました");
    } finally {
      setStampUploading(false);
      if (stampInputRef.current) stampInputRef.current.value = "";
    }
  }

  // Remove stamp
  async function handleStampRemove() {
    if (!confirm("電子印を削除しますか？")) return;
    try {
      await fetch("/api/kaitai/company/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stampUrl: null }),
      });
      setStampUrl(null);
    } catch {
      alert("削除に失敗しました");
    }
  }

  function updateField(key: string, value: string) {
    setProfile(prev => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh", color: TDark.sub }}>
        <Loader2 size={24} className="animate-spin" style={{ marginRight: 8 }} />
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 120px" }}>
      {/* Header */}
      <div className="flex items-center gap-3" style={{ padding: "20px 0 24px" }}>
        <Link
          href="/kaitai/admin"
          className="flex items-center justify-center rounded-xl"
          style={{ width: 40, height: 40, background: TDark.surface, border: `1px solid ${TDark.border}` }}
        >
          <ArrowLeft size={18} style={{ color: TDark.sub }} />
        </Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: TDark.text }}>自社情報設定</h1>
          <p style={{ fontSize: 13, color: TDark.sub }}>帳票に自動反映される自社情報を登録</p>
        </div>
      </div>

      {/* Stamp section */}
      <div
        className="rounded-2xl"
        style={{
          background: TDark.surface,
          border: `1px solid ${TDark.border}`,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Stamp size={18} style={{ color: "#EF4444" }} />
          <h2 style={{ fontSize: 16, fontWeight: 800, color: TDark.text }}>電子印（スタンプ）</h2>
        </div>
        <p style={{ fontSize: 13, color: TDark.sub, marginBottom: 16 }}>
          帳票の印欄に自動で表示されます。PNG・JPG推奨、背景透過のPNGが最適です。
        </p>

        <div className="flex items-center gap-4">
          {/* Stamp preview */}
          <div
            style={{
              width: 100, height: 100,
              borderRadius: 12,
              border: stampUrl ? "none" : `2px dashed rgba(255,255,255,0.15)`,
              background: stampUrl ? "transparent" : "rgba(255,255,255,0.03)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {stampUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stampUrl}
                alt="電子印"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <div style={{ textAlign: "center", color: TDark.muted }}>
                <Stamp size={28} style={{ margin: "0 auto 4px" }} />
                <div style={{ fontSize: 10 }}>未登録</div>
              </div>
            )}
          </div>

          {/* Stamp actions */}
          <div className="flex flex-col gap-2 flex-1">
            <button
              onClick={() => stampInputRef.current?.click()}
              disabled={stampUploading}
              className="flex items-center justify-center gap-2 rounded-xl font-bold"
              style={{
                height: 44, fontSize: 14,
                background: stampUploading ? TDark.muted : "#EF4444",
                color: "#fff",
                border: "none", cursor: stampUploading ? "wait" : "pointer",
              }}
            >
              {stampUploading ? (
                <><Loader2 size={16} className="animate-spin" /> アップロード中...</>
              ) : (
                <><Upload size={16} /> {stampUrl ? "画像を変更" : "画像をアップロード"}</>
              )}
            </button>
            {stampUrl && (
              <button
                onClick={handleStampRemove}
                className="flex items-center justify-center gap-2 rounded-xl font-bold"
                style={{
                  height: 40, fontSize: 13,
                  background: "transparent",
                  color: TDark.sub,
                  border: `1px solid ${TDark.border}`,
                  cursor: "pointer",
                }}
              >
                <Trash2 size={14} /> 削除
              </button>
            )}
          </div>
          <input
            ref={stampInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: "none" }}
            onChange={handleStampUpload}
          />
        </div>
      </div>

      {/* Profile sections */}
      {SECTIONS.map(section => {
        const SectionIcon = section.icon;
        return (
          <div
            key={section.title}
            className="rounded-2xl"
            style={{
              background: TDark.surface,
              border: `1px solid ${TDark.border}`,
              padding: 24,
              marginBottom: 16,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <SectionIcon size={18} style={{ color: TDark.primary }} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: TDark.text }}>{section.title}</h2>
            </div>
            <div className="flex flex-col gap-3">
              {section.fields.map(field => (
                <div key={field.key}>
                  <label
                    style={{ fontSize: 12, fontWeight: 700, color: TDark.sub, marginBottom: 6, display: "block" }}
                  >
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={(profile as unknown as Record<string, string>)[field.key] || ""}
                    onChange={e => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl outline-none"
                    style={{
                      height: 48, fontSize: 15, padding: "0 16px",
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${TDark.border}`,
                      color: TDark.text,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Preview card */}
      <div
        className="rounded-2xl"
        style={{
          background: "#FFFFFF",
          border: `1px solid ${T.border}`,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 12 }}>
          帳票プレビュー（発行者欄）
        </p>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>
          {profile.name || "（会社名未設定）"}
        </div>
        <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.9 }}>
          {profile.zip && <div>{profile.zip}</div>}
          {profile.address && <div>{profile.address}</div>}
          {(profile.tel || profile.fax) && (
            <div>
              {profile.tel && `TEL：${profile.tel}`}
              {profile.tel && profile.fax && "　"}
              {profile.fax && `FAX：${profile.fax}`}
            </div>
          )}
          {profile.email && <div>{profile.email}</div>}
          {profile.rep && <div style={{ fontWeight: 600, marginTop: 2 }}>{profile.rep}</div>}
          {profile.invoiceNo && (
            <div style={{ fontSize: 11, color: T.muted }}>
              適格請求書 登録番号：{profile.invoiceNo}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3" style={{ marginTop: 10 }}>
          <div
            style={{
              width: 50, height: 50, borderRadius: 4,
              border: stampUrl ? "none" : `1.5px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {stampUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stampUrl} alt="印" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 11, color: T.muted }}>印</span>
            )}
          </div>
          <span style={{ fontSize: 12, color: T.muted }}>
            {stampUrl ? "電子印が帳票に反映されます" : "電子印未登録（「印」と表示されます）"}
          </span>
        </div>
      </div>

      {/* Save button (sticky) */}
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          padding: "12px 16px calc(12px + env(safe-area-inset-bottom, 0px))",
          background: TDark.bg,
          borderTop: `1px solid ${TDark.border}`,
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-xl font-bold"
            style={{
              height: 56, fontSize: 16,
              background: saved ? "#10B981" : saving ? TDark.muted : TDark.primary,
              color: "#fff",
              border: "none",
              cursor: saving ? "wait" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {saved ? (
              <><Save size={20} /> 保存しました</>
            ) : saving ? (
              <><Loader2 size={20} className="animate-spin" /> 保存中...</>
            ) : (
              <><Save size={20} /> 自社情報を保存</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
