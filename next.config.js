/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  // AWS Amplify 배포를 위한 설정
  output: 'standalone',
  // 폰트 최적화 설정
  optimizeFonts: true,
  // 실험적 기능 설정
  experimental: {
    optimizePackageImports: ['@aws-amplify/ui-react'],
  },
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
    return config;
  },
}

module.exports = nextConfig 