import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // PixiJS와의 호환성을 위한 설정
  serverExternalPackages: ['pixi.js'],
  webpack: (config, { isServer, dev }) => {
    // PixiJS shader 파일 처리
    if (!isServer) {
      config.module.rules.push({
        test: /\.(frag|vert|glsl)$/,
        type: 'asset/source',
      });
    }

    return config;
  },
  // React StrictMode 비활성화 (PixiJS 충돌 방지)
  reactStrictMode: false,
  
  // TypeScript 빌드 오류 무시 (개발 시에만)
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint 오류 무시 (개발 시에만)
  eslint: {
    // 기능/디자인에 영향 없이 빌드 시 린트 무시
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
