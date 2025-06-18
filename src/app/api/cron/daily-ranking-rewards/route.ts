import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { addPoints } from '@/services/pointService';

interface DeliveryRecord {
  user_id: string;
  amount: number;
  delivery_count: number;
  users: {
    nickname: string;
    region: string;
  };
}

// Vercel Cron Job - 매일 아침 5시 59분 실행
export async function GET(request: Request) {
  // Cron Secret 검증 (보안)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('일일 랭킹 포인트 지급 시작:', new Date().toISOString());

    // 어제 날짜 계산
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 어제의 최종 랭킹 가져오기 (직접 쿼리)
    const { data: records, error: rankError } = await supabase
      .from('delivery_records')
      .select(`
        user_id,
        users!inner(nickname, region),
        amount,
        delivery_count
      `)
      .eq('date', yesterdayStr)
      .eq('verified', true) as { data: DeliveryRecord[] | null; error: any };

    if (rankError) throw rankError;
    
    if (!records || records.length === 0) {
      console.log('어제 랭킹 데이터가 없습니다.');
      return NextResponse.json({ 
        success: false, 
        message: '어제 랭킹 데이터 없음' 
      });
    }

    // 사용자별 합계 계산
    const userTotals = new Map<string, {
      userId: string;
      nickname: string;
      totalAmount: number;
      totalOrders: number;
    }>();

    for (const record of records) {
      const userId = record.user_id;
      const existing = userTotals.get(userId) || {
        userId,
        nickname: record.users.nickname,
        totalAmount: 0,
        totalOrders: 0
      };
      
      existing.totalAmount += record.amount;
      existing.totalOrders += record.delivery_count;
      userTotals.set(userId, existing);
    }

    // 랭킹 계산 (금액 기준, 같으면 건수 기준)
    const rankings = Array.from(userTotals.values())
      .sort((a, b) => {
        if (b.totalAmount !== a.totalAmount) {
          return b.totalAmount - a.totalAmount;
        }
        return b.totalOrders - a.totalOrders;
      })
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    const results = [];
    
    // TOP 10까지 포인트 지급
    for (const user of rankings.slice(0, 10)) {
      let points = 0;
      let reason = '';
      
      if (user.rank === 1) {
        points = 500;
        reason = `일일 1위 달성`;
      } else if (user.rank === 2) {
        points = 400;
        reason = `일일 2위 달성`;
      } else if (user.rank === 3) {
        points = 300;
        reason = `일일 3위 달성`;
      } else if (user.rank >= 4 && user.rank <= 10) {
        points = 100;
        reason = `일일 TOP 10 달성 (${user.rank}위)`;
      }
      
      if (points > 0) {
        const success = await addPoints(
          user.userId, 
          points, 
          'daily_ranking', 
          reason
        );
        
        results.push({
          userId: user.userId,
          nickname: user.nickname,
          rank: user.rank,
          points: points,
          success: success
        });
        
        console.log(`포인트 지급: ${user.nickname} (${user.rank}위) - ${points}P`);
      }
    }

    // 포인트 지급 내역 기록
    await supabase
      .from('daily_ranking_rewards')
      .insert({
        date: yesterday.toISOString().split('T')[0],
        rewards: results,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({ 
      success: true, 
      message: '일일 랭킹 포인트 지급 완료',
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('일일 랭킹 포인트 지급 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
} 