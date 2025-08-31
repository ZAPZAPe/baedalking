#!/usr/bin/env node

/**
 * 박스 시스템 마이그레이션 적용 스크립트
 * 포인트 시스템을 박스 시스템으로 변경
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 박스 시스템 마이그레이션 시작...');

try {
  // 1. Supabase 마이그레이션 적용
  console.log('📦 Supabase 마이그레이션 적용 중...');
  execSync('npx supabase db reset', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  
  console.log('✅ 박스 시스템 마이그레이션이 성공적으로 완료되었습니다!');
  console.log('');
  console.log('📋 변경사항:');
  console.log('  - points 테이블 → boxes 테이블로 변경');
  console.log('  - points_awarded → boxes_awarded로 변경');
  console.log('  - 모든 API에서 포인트 → 박스로 변경');
  console.log('  - UI에서 포인트 → 박스로 변경');
  console.log('');
  console.log('🎮 이제 배달킹에서 박스를 모아서 아이템을 구매할 수 있습니다!');
  
} catch (error) {
  console.error('❌ 마이그레이션 실패:', error.message);
  process.exit(1);
}
