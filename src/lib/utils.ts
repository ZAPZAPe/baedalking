import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 가입 시 랜덤으로 고유 ID를 생성하는 함수
 * @param length 생성할 ID의 길이 (기본값: 8)
 * @returns 랜덤으로 생성된 고유 ID
 */
export function generateRandomId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * 더 안전한 랜덤 ID 생성 (특수문자 포함)
 * @param length 생성할 ID의 길이 (기본값: 12)
 * @returns 랜덤으로 생성된 고유 ID
 */
export function generateSecureRandomId(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * 닉네임 유효성 검사
 * @param nickname 검사할 닉네임
 * @returns 유효성 여부
 */
export function validateNickname(nickname: string): boolean {
  // 2-20자, 한글/영문/숫자만 허용
  const nicknameRegex = /^[가-힣a-zA-Z0-9]{2,20}$/
  return nicknameRegex.test(nickname)
}

/**
 * 이메일 유효성 검사
 * @param email 검사할 이메일
 * @returns 유효성 여부
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
