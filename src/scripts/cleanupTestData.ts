import { supabase } from '../lib/supabase';

async function cleanupTestData() {
  try {
    console.log('테스트 데이터 삭제 시작...');

    // 테스트 이메일 패턴으로 사용자 찾기
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .like('email', 'test%@test.com');

    if (userError) {
      throw userError;
    }

    if (users && users.length > 0) {
      const userIds = users.map(user => user.id);

      // 배달 기록 삭제
      const { error: recordError } = await supabase
        .from('delivery_records')
        .delete()
        .in('user_id', userIds);

      if (recordError) {
        console.error('배달 기록 삭제 오류:', recordError);
      } else {
        console.log('배달 기록 삭제 완료');
      }

      // 사용자 삭제
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .in('id', userIds);

      if (deleteError) {
        console.error('사용자 삭제 오류:', deleteError);
      } else {
        console.log(`${userIds.length}명의 테스트 사용자 삭제 완료`);
      }
    } else {
      console.log('삭제할 테스트 데이터가 없습니다.');
    }

    console.log('테스트 데이터 삭제 완료!');
  } catch (error) {
    console.error('테스트 데이터 삭제 중 오류 발생:', error);
  }
}

// 스크립트 실행
cleanupTestData(); 