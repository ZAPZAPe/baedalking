import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// 서버 사이드에서만 사용할 수 있는 service role 클라이언트
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 런타임에서만 환경 변수 검증 (빌드 시점에는 체크하지 않음)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('⚠️ Supabase Admin 환경 변수가 설정되지 않았습니다:');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  }
} 