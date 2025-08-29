import LoginPage from '@/components/auth/LoginPage'

// prerender 방지를 위한 설정
export const dynamic = 'force-dynamic'

export default function Login() {
  return <LoginPage />
}
