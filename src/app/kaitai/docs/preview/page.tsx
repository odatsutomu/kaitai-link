import { Suspense } from "react";
import PreviewClient from "./client";
import { T } from "../../lib/design-tokens";

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; site?: string }>;
}) {
  const { type = "estimate", site = "s1" } = await searchParams;

  return (
    <Suspense fallback={
      <div style={{ minHeight: "100dvh", background: T.border, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: T.sub, fontSize: 14 }}>読み込み中...</div>
      </div>
    }>
      <PreviewClient type={type} siteId={site} />
    </Suspense>
  );
}
