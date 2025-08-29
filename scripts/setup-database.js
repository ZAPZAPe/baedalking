#!/usr/bin/env node

/**
 * 데이터베이스 설정 스크립트
 * Supabase 프로젝트 생성 후 실행하여 데이터베이스 스키마를 설정합니다.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Baedalking 데이터베이스 설정 시작...\n');

// 1. 환경 변수 확인
console.log('1️⃣ 환경 변수 확인 중...');
const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local 파일이 없습니다!');
  console.log('📝 다음 단계를 따라주세요:');
  console.log('   1. Supabase 프로젝트 생성');
  console.log('   2. .env.local 파일 생성 및 환경 변수 설정');
  console.log('   3. 이 스크립트 다시 실행');
  process.exit(1);
}

console.log('✅ .env.local 파일 확인됨\n');

// 2. Supabase CLI 확인
console.log('2️⃣ Supabase CLI 확인 중...');
try {
  const version = execSync('npx supabase --version', { encoding: 'utf8' });
  console.log(`✅ Supabase CLI 버전: ${version.trim()}\n`);
} catch (error) {
  console.error('❌ Supabase CLI가 설치되지 않았습니다.');
  console.log('💡 다음 명령어로 설치하세요: npm install -g supabase');
  process.exit(1);
}

// 3. 로컬 개발 환경 시작
console.log('3️⃣ 로컬 Supabase 개발 환경 시작 중...');
try {
  execSync('npx supabase start', { stdio: 'inherit' });
  console.log('✅ 로컬 Supabase 시작 완료!\n');
} catch (error) {
  console.error('❌ 로컬 Supabase 시작 실패:', error.message);
  console.log('💡 이미 실행 중인 경우 무시하세요.\n');
}

// 4. 데이터베이스 마이그레이션
console.log('4️⃣ 데이터베이스 마이그레이션 실행 중...');
try {
  execSync('npx supabase db push', { stdio: 'inherit' });
  console.log('✅ 마이그레이션 완료!\n');
} catch (error) {
  console.error('❌ 마이그레이션 실패:', error.message);
  console.log('💡 수동으로 실행하세요: npx supabase db push\n');
}

// 5. 샘플 데이터 삽입 (선택사항)
console.log('5️⃣ 샘플 데이터 삽입 중...');
try {
  execSync('npx supabase db seed', { stdio: 'inherit' });
  console.log('✅ 샘플 데이터 삽입 완료!\n');
} catch (error) {
  console.log('ℹ️ 샘플 데이터 삽입 건너뜀 (선택사항)\n');
}

console.log('🎉 데이터베이스 설정 완료!');
console.log('\n📋 다음 단계:');
console.log('   1. http://localhost:54323 에서 Supabase Studio 접속');
console.log('   2. 애플리케이션에서 연결 테스트');
console.log('   3. 개발 시작! 🚀');
