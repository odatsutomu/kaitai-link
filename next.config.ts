import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 画像の外部ドメインを許可（R2パブリックURL）
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
  // スマホ写真アップロード対応：ボディサイズ制限を緩和（FormData + Server Actions）
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
