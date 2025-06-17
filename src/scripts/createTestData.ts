import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// 현재 시각을 ISO 문자열로 반환
const now = () => new Date().toISOString();

// 테스트 사용자 데이터
const testUsers = [
  {
    id: uuidv4(),
    username: 'test1@test.com',
    email: 'test1@test.com',
    nickname: '서울배달왕',
    region: '서울',
    vehicle: 'motorcycle',
    phone: '010-1234-5678',
    points: 1000,
    total_deliveries: 150,
    total_earnings: 3500000,
    profile_image: null,
    created_at: now(),
    updated_at: now()
  },
  {
    id: uuidv4(),
    username: 'test2@test.com',
    email: 'test2@test.com',
    nickname: '부산라이더',
    region: '부산',
    vehicle: 'bicycle',
    phone: '010-2345-6789',
    points: 800,
    total_deliveries: 120,
    total_earnings: 2800000,
    profile_image: null,
    created_at: now(),
    updated_at: now()
  },
  {
    id: uuidv4(),
    username: 'test3@test.com',
    email: 'test3@test.com',
    nickname: '인천퀵맨',
    region: '인천',
    vehicle: 'motorcycle',
    phone: '010-3456-7890',
    points: 600,
    total_deliveries: 90,
    total_earnings: 2100000,
    profile_image: null,
    created_at: now(),
    updated_at: now()
  }
];

// 테스트 배달 기록 생성 함수
const createDeliveryRecords = async (userId: string) => {
  const today = new Date();
  const records = [];

  // 최근 7일간의 배달 기록 생성
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 하루 2-3건의 배달 기록
    const deliveriesPerDay = Math.floor(Math.random() * 2) + 2;
    
    for (let j = 0; j < deliveriesPerDay; j++) {
      records.push({
        user_id: userId,
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 50000) + 80000, // 8만원 ~ 13만원
        delivery_count: Math.floor(Math.random() * 5) + 10, // 10 ~ 15건
        platform: Math.random() > 0.5 ? '배민커넥트' : '쿠팡이츠',
        verified: true
      });
    }
  }

  return records;
};

// 메인 함수
async function createTestData() {
  try {
    console.log('테스트 데이터 생성 시작...');

    // 1. 테스트 사용자 생성
    for (const user of testUsers) {
      // 먼저 사용자가 이미 존재하는지 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select()
        .eq('email', user.email)
        .single();

      if (existingUser) {
        console.log(`사용자가 이미 존재함: ${user.nickname}`);
        continue;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert(user)
        .select()
        .single();

      if (userError) {
        console.error('사용자 생성 오류:', userError);
        continue;
      }

      console.log(`사용자 생성됨: ${userData.nickname}`);

      // 2. 해당 사용자의 배달 기록 생성
      const deliveryRecords = await createDeliveryRecords(userData.id);
      const { error: recordError } = await supabase
        .from('delivery_records')
        .insert(deliveryRecords);

      if (recordError) {
        console.error('배달 기록 생성 오류:', recordError);
      } else {
        console.log(`${userData.nickname}의 배달 기록 ${deliveryRecords.length}개 생성됨`);
      }
    }

    console.log('테스트 데이터 생성 완료!');
  } catch (error) {
    console.error('테스트 데이터 생성 중 오류 발생:', error);
  }
}

// 스크립트 실행
createTestData(); 