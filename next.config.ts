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

      // PixiJS ESM 모듈 최적화
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            pixi: {
              test: /[\\/]node_modules[\\/]pixi\.js[\\/]/,
              name: 'pixi',
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };

      // Dynamic imports 최적화
      if (dev) {
        config.optimization.splitChunks = {
          ...config.optimization.splitChunks,
          chunks: 'all',
        };
      }
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
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
