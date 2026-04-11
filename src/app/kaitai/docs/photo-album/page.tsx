import { Suspense } from "react";
import PhotoAlbumClient from "./client";
import { T } from "../../lib/design-tokens";

export default async function PhotoAlbumPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  const { site = "" } = await searchParams;

  return (
    <Suspense fallback={
      <div style={{ minHeight: "100dvh", background: T.border, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: T.sub, fontSize: 14 }}>読み込み中...</div>
      </div>
    }>
      <PhotoAlbumClient siteId={site} />
    </Suspense>
  );
}
