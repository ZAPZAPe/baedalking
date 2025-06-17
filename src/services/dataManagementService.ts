import { supabase } from '../lib/supabase';

// 데이터 백업
export const backupData = async () => {
  try {
    // 모든 테이블의 데이터를 가져와서 백업
    const tables = ['users', 'delivery_records', 'notifications', 'point_history'];
    const backupData: any = {};

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (error) throw error;
      backupData[table] = data;
    }

    // 백업 데이터를 JSON 파일로 다운로드
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `backup_${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    return { success: true, message: '백업이 완료되었습니다.' };
  } catch (error) {
    console.error('백업 오류:', error);
    throw error;
  }
};

// 데이터 복원
export const restoreData = async (backupFile: File) => {
  try {
    const text = await backupFile.text();
    const backupData = JSON.parse(text);
    
    // 각 테이블에 데이터 복원
    for (const [table, data] of Object.entries(backupData)) {
      if (Array.isArray(data) && data.length > 0) {
        const { error } = await supabase
          .from(table)
          .upsert(data);
        
        if (error) throw error;
      }
    }
    
    return { success: true, message: '복원이 완료되었습니다.' };
  } catch (error) {
    console.error('복원 오류:', error);
    throw error;
  }
};

// 데이터 정리
export const cleanupOldData = async (daysToKeep: number = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // 오래된 배달 기록 삭제
    const { error: deliveryError } = await supabase
      .from('delivery_records')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
    
    if (deliveryError) throw deliveryError;
    
    // 오래된 알림 삭제
    const { error: notificationError } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .eq('read', true);
    
    if (notificationError) throw notificationError;
    
    return { success: true, message: `${daysToKeep}일 이전의 데이터가 정리되었습니다.` };
  } catch (error) {
    console.error('데이터 정리 오류:', error);
    throw error;
  }
};

// 데이터 통계
export const getDataStatistics = async () => {
  try {
    const stats: any = {};
    
    // 사용자 수
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    stats.totalUsers = userCount || 0;
    
    // 배달 기록 수
    const { count: recordCount } = await supabase
      .from('delivery_records')
      .select('*', { count: 'exact', head: true });
    stats.totalRecords = recordCount || 0;
    
    // 총 수익
    const { data: revenueData } = await supabase
      .from('delivery_records')
      .select('amount');
    stats.totalRevenue = revenueData?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
    
    // 활성 사용자 (최근 7일)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: activeUserCount } = await supabase
      .from('delivery_records')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());
    stats.activeUsers = activeUserCount || 0;
    
    return stats;
  } catch (error) {
    console.error('통계 조회 오류:', error);
    throw error;
  }
};

// 데이터 내보내기 (CSV)
export const exportToCSV = async (tableName: string) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('내보낼 데이터가 없습니다.');
    }
    
    // CSV 변환
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    // 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${tableName}_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return { success: true, message: 'CSV 내보내기가 완료되었습니다.' };
  } catch (error) {
    console.error('CSV 내보내기 오류:', error);
    throw error;
  }
}; 