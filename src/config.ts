export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  kakao: {
    appKey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY || '2a6e20ac0ba97afb3b35ecefb5e1f8ed',
  },
  app: {
    name: '배달킹',
    description: '배달대행 라이더 수입 관리',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  }
}; 