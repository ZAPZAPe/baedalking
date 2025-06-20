import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('추천인 코드 마이그레이션 시작...');

    // 1. users 테이블의 긴 referral_code들을 찾기
    const { data: longReferralCodes, error: fetchUsersError } = await supabase
      .from('users')
      .select('id, referral_code')
      .not('referral_code', 'is', null)
      .gt('referral_code', 'AAAAA'); // 5자리보다 긴 코드들

    if (fetchUsersError) throw fetchUsersError;

    console.log(`${longReferralCodes?.length || 0}개의 긴 referral_code를 찾았습니다.`);

    // 2. users 테이블의 referral_code 마이그레이션
    if (longReferralCodes && longReferralCodes.length > 0) {
      for (const user of longReferralCodes) {
        if (!user.referral_code || user.referral_code.length <= 5) continue;

        // 새로운 5자리 코드 생성
        let newCode: string;
        let attempts = 0;
        do {
          const letters = Math.random().toString(36).substring(2, 5).toUpperCase();
          const numbers = Math.floor(Math.random() * 100).toString().padStart(2, '0');
          newCode = letters + numbers;
          attempts++;

          // 중복 확인
          const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('referral_code', newCode)
            .single();

          if (!existing) break;
        } while (attempts < 10);

        if (attempts >= 10) {
          console.error(`사용자 ${user.id}의 새로운 추천인 코드 생성 실패`);
          continue;
        }

        // referral_code 업데이트
        const { error: updateUserError } = await supabase
          .from('users')
          .update({ referral_code: newCode })
          .eq('id', user.id);

        if (updateUserError) {
          console.error(`사용자 ${user.id}의 referral_code 업데이트 실패:`, updateUserError);
          continue;
        }

        console.log(`사용자 ${user.id}: ${user.referral_code} -> ${newCode}`);
      }
    }

    // 3. invite_codes 테이블의 긴 코드들을 찾기
    const { data: longInviteCodes, error: fetchInviteCodesError } = await supabase
      .from('invite_codes')
      .select('*')
      .gt('code', 'AAAAA'); // 5자리보다 긴 코드들

    if (fetchInviteCodesError) throw fetchInviteCodesError;

    console.log(`${longInviteCodes?.length || 0}개의 긴 invite_code를 찾았습니다.`);

    // 4. invite_codes 테이블 마이그레이션
    if (longInviteCodes && longInviteCodes.length > 0) {
      for (const oldCode of longInviteCodes) {
        if (!oldCode.code || oldCode.code.length <= 5) continue;

        // 새로운 5자리 코드 생성
        let newCode: string;
        let attempts = 0;
        do {
          const letters = Math.random().toString(36).substring(2, 5).toUpperCase();
          const numbers = Math.floor(Math.random() * 100).toString().padStart(2, '0');
          newCode = letters + numbers;
          attempts++;

          // 중복 확인
          const { data: existing } = await supabase
            .from('invite_codes')
            .select('id')
            .eq('code', newCode)
            .single();

          if (!existing) break;
        } while (attempts < 10);

        if (attempts >= 10) {
          console.error(`invite_code ${oldCode.id}의 새로운 코드 생성 실패`);
          continue;
        }

        // 기존 초대 기록들의 invite_code도 업데이트
        const { error: updateInvitesError } = await supabase
          .from('invites')
          .update({ invite_code: newCode })
          .eq('invite_code', oldCode.code);

        if (updateInvitesError) {
          console.error(`초대 기록 업데이트 실패 (${oldCode.code} -> ${newCode}):`, updateInvitesError);
          continue;
        }

        // 초대 코드 업데이트
        const { error: updateCodeError } = await supabase
          .from('invite_codes')
          .update({ code: newCode })
          .eq('id', oldCode.id);

        if (updateCodeError) {
          console.error(`초대 코드 업데이트 실패 (${oldCode.code} -> ${newCode}):`, updateCodeError);
          continue;
        }

        console.log(`invite_code 마이그레이션 완료: ${oldCode.code} -> ${newCode}`);
      }
    }

    console.log('추천인 코드 마이그레이션이 완료되었습니다.');

    return NextResponse.json({
      success: true,
      message: '추천인 코드 마이그레이션이 완료되었습니다.',
      migrated: {
        users: longReferralCodes?.length || 0,
        inviteCodes: longInviteCodes?.length || 0
      }
    });

  } catch (error) {
    console.error('추천인 코드 마이그레이션 실패:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 