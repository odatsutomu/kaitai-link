import { Suspense } from "react";
import PreviewClient from "./client";

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; site?: string }>;
}) {
  const { type = "estimate", site = "s1" } = await searchParams;

  return (
    <Suspense fallback={
      <div style={{ minHeight: "100dvh", background: "#D1D5DB", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#64748B", fontSize: 14 }}>読み込み中...</div>
      </div>
    }>
      <PreviewClient type={type} siteId={site} />
    </Suspense>
  );
}
