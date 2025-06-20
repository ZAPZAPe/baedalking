/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Vercel 배포를 위한 설정
  output: process.env.VERCEL ? undefined : 'standalone',
  // 폰트 최적화 설정
  optimizeFonts: true,
  // 웹팩 설정
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    if (isServer) {
      // 서버사이드에서 tesseract.js 제외
      config.externals.push('tesseract.js');
    }
    return config;
  },
  // 환경 변수 검증 (빌드 시)
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  // 성능 최적화 설정
  compress: true,
  poweredByHeader: false,
  // react-icons 모듈화 임포트 설정
  modularizeImports: {
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
  },
  // 실험적 기능들
  experimental: {
    // optimizeCss 비활성화 - SSR 빌드 에러 방지
    // optimizeCss: true
    optimizePackageImports: ['react-icons', '@supabase/supabase-js'],
  },
  // HTTP 헤더 설정
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 