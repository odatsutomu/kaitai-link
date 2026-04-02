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
};

export default nextConfig;
