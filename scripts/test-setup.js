#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.')
  console.error('NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 .env.local 파일에 설정해주세요.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Supabase 연결 테스트 시작...')
  
  try {
    // 1. 기본 연결 테스트
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    console.log('✅ Supabase 연결 성공!')
    
    // 2. 필수 테이블 확인
    const tables = ['users', 'earnings', 'points', 'items', 'user_items', 'friends', 'visits', 'guestbook']
    console.log('\n📋 필수 테이블 확인:')
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1)
        if (error && error.code !== 'PGRST116') {
          console.log(`❌ ${table} 테이블: 오류 - ${error.message}`)
        } else {
          console.log(`✅ ${table} 테이블: OK`)
        }
      } catch (err) {
        console.log(`❌ ${table} 테이블: 오류 - ${err.message}`)
      }
    }
    
    // 3. 샘플 아이템 확인
    console.log('\n🎨 기본 아이템 확인:')
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('name, type, price')
      .limit(5)
    
    if (itemsError) {
      console.log('❌ 아이템 조회 실패:', itemsError.message)
    } else if (items && items.length > 0) {
      console.log(`✅ ${items.length}개의 아이템 발견:`)
      items.forEach(item => {
        console.log(`   - ${item.name} (${item.type}) - ${item.price} 포인트`)
      })
    } else {
      console.log('⚠️  아이템이 없습니다. 마이그레이션을 실행해주세요.')
    }
    
    console.log('\n✨ 설정 테스트 완료!')
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message)
    console.error('\n해결 방법:')
    console.error('1. Supabase 프로젝트가 실행 중인지 확인')
    console.error('2. 환경 변수가 올바른지 확인')
    console.error('3. 데이터베이스 마이그레이션이 완료되었는지 확인')
    process.exit(1)
  }
}

// 메인 실행
console.log('🛵 배달킹 설정 테스트')
console.log('===================\n')

testConnection()
