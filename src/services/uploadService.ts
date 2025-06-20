import { supabase } from '../lib/supabase';
import { addPoints, rewardUploadPoints, isFirstUpload } from './pointService';

export interface UploadResult {
  success: boolean;
  imageUrl?: string;
  recordId?: string;
  error?: string;
  points?: number;
}

// 배달 데이터 업로드
export async function uploadDeliveryData(
  userId: string,
  amount: number,
  deliveryCount: number,
  platform: string,
  imageFile?: File,
  recordDate?: string
) {
  try {
    let imageUrl = '';
    
    if (imageFile) {
      const fileName = `${userId}/${Date.now()}_${imageFile.name}`;
      const { data, error } = await supabase.storage
        .from('delivery-images')
        .upload(fileName, imageFile);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('delivery-images')
        .getPublicUrl(fileName);
      
      imageUrl = urlData.publicUrl;
    }

    const date = recordDate ? new Date(recordDate) : new Date();
    date.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('delivery_records')
      .insert({
        user_id: userId,
        amount,
        delivery_count: deliveryCount,
        platform,
        image_url: imageUrl,
        date: date.toISOString(),
        is_verified: false,
        is_manual_entry: !imageFile
      })
      .select()
      .single();

    if (error) throw error;

    console.log('배달 데이터 업로드 성공');
    return data;
  } catch (error) {
    console.error('배달 데이터 업로드 오류:', error);
    throw error;
  }
}

// 사용자 프로필 가져오기
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      return {
        id: data.id,
        displayName: data.nickname || '',
        points: data.points || 0,
        totalEarnings: data.total_earnings || 0,
        totalDeliveries: data.total_deliveries || 0,
        createdAt: data.created_at
      };
    } else {
      // 프로필이 없으면 기본값으로 생성
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          nickname: '',
          points: 0,
          total_earnings: 0,
          total_deliveries: 0
        })
        .select()
        .single();

      if (createError) throw createError;

      return {
        id: newUser.id,
        displayName: newUser.nickname || '',
        points: newUser.points || 0,
        totalEarnings: newUser.total_earnings || 0,
        totalDeliveries: newUser.total_deliveries || 0,
        createdAt: newUser.created_at
      };
    }
  } catch (error) {
    console.error('프로필 가져오기 오류:', error);
    throw error;
  }
}

// 사용자 프로필 업데이트
export async function updateUserProfile(userId: string, data: any) {
  try {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        nickname: data.displayName,
        points: data.points,
        total_earnings: data.totalEarnings,
        total_deliveries: data.totalDeliveries
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: updatedUser.id,
      displayName: updatedUser.nickname,
      points: updatedUser.points,
      totalEarnings: updatedUser.total_earnings,
      totalDeliveries: updatedUser.total_deliveries,
      updatedAt: updatedUser.updated_at
    };
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    throw error;
  }
}



export async function rewardUploadPointsLegacy(userId: string) {
  try {
    return await rewardUploadPoints(userId);
  } catch (error) {
    console.error('업로드 포인트 지급 오류:', error);
    return false;
  }
}



// 이미지 업로드
export const uploadImage = async (file: File, userId: string): Promise<string> => {
  try {
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('delivery-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('delivery-images')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    throw error;
  }
};

// 이미지 삭제
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return;

    const { error } = await supabase.storage
      .from('delivery-images')
      .remove([fileName]);

    if (error) throw error;
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    throw error;
  }
};

// 수동 배달 기록 추가
export const addManualDeliveryRecord = async (
  recordData: {
    userId: string;
    userNickname: string;
    userRegion: string;
    platform: 'baemin' | 'coupang' | 'yogiyo' | 'other';
    amount: number;
    deliveryCount: number;
    date: string;
  }
): Promise<UploadResult> => {
  try {
    const { data, error } = await supabase
      .from('delivery_records')
      .insert({
        user_id: recordData.userId,
        user_nickname: recordData.userNickname,
        user_region: recordData.userRegion,
        platform: recordData.platform,
        amount: recordData.amount,
        delivery_count: recordData.deliveryCount,
        date: recordData.date,
        is_manual_entry: true,
        is_verified: false
      })
      .select()
      .single();

    if (error) throw error;

    // 포인트 지급
    const pointsAwarded = await rewardUploadPoints(recordData.userId);

    return {
      success: true,
      recordId: data.id,
      points: pointsAwarded ? 50 : 0
    };
  } catch (error) {
    console.error('수동 배달 기록 추가 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
};

// 오늘 날짜인지 확인 (한국 시간 기준 오전 6시 갱신)
export const isTodayDate = (date: string): boolean => {
  const inputDate = new Date(date);
  const now = new Date();
  
  // 한국 시간으로 변환 (UTC+9)
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const koreaHour = koreaTime.getUTCHours();
  
  // 오전 6시 이전이면 전날로 처리
  if (koreaHour < 6) {
    koreaTime.setDate(koreaTime.getDate() - 1);
  }
  
  // 날짜만 비교 (시간 제외)
  const inputDateStr = inputDate.toISOString().split('T')[0];
  const todayStr = koreaTime.toISOString().split('T')[0];
  
  return inputDateStr === todayStr;
};

// 한국 시간 기준 오늘 날짜 가져오기
export const getKoreanToday = (): string => {
  const now = new Date();
  // 한국 시간으로 변환 (UTC+9)
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const koreaHour = koreaTime.getUTCHours();
  
  // 오전 6시 이전이면 전날로 처리
  if (koreaHour < 6) {
    koreaTime.setDate(koreaTime.getDate() - 1);
  }
  
  return koreaTime.toISOString().split('T')[0];
};

// 중복 업로드 확인
export const checkDuplicateUpload = async (
  userId: string,
  platform: string,
  date: string
): Promise<{
  isDuplicate: boolean;
  existingRecord?: any;
  hasReceivedPoints?: boolean;
}> => {
  try {
    const { data, error } = await supabase
      .from('delivery_records')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('date', date)
      .eq('is_manual_entry', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      // 포인트 지급 여부 확인
      const { data: pointData } = await supabase
        .from('point_history')
        .select('*')
        .eq('user_id', userId)
        .eq('point_type', 'upload')
        .gte('created_at', date)
        .lt('created_at', new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      return {
        isDuplicate: true,
        existingRecord: data[0],
        hasReceivedPoints: !!(pointData && pointData.length > 0)
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('중복 확인 오류:', error);
    return { isDuplicate: false };
  }
};

// 배달 기록 업로드 (이미지 포함)
export const uploadDeliveryRecord = async (
  file: File,
  recordData: {
    userId: string;
    userNickname: string;
    userRegion: string;
    platform: '배민커넥트' | '쿠팡이츠';
    amount: number;
    deliveryCount: number;
    date: string;
  }
): Promise<UploadResult> => {
  try {
    // 날짜 검증 - 오늘 날짜인지 확인
    if (!isTodayDate(recordData.date)) {
      return {
        success: false,
        error: '오늘 날짜의 실적만 업로드 가능합니다. 지난 날짜의 실적은 수기 입력을 이용해주세요.'
      };
    }

    // 중복 업로드 확인
    const duplicateCheck = await checkDuplicateUpload(
      recordData.userId,
      recordData.platform,
      recordData.date
    );

    let shouldAwardPoints = true;
    
    if (duplicateCheck.isDuplicate) {
      // 이미 업로드된 기록이 있음 - 덮어쓰기
      if (duplicateCheck.hasReceivedPoints) {
        shouldAwardPoints = false; // 이미 포인트를 받았으면 중복 지급하지 않음
      }
      
      // 기존 이미지 삭제
      if (duplicateCheck.existingRecord?.image_url) {
        try {
          await deleteImage(duplicateCheck.existingRecord.image_url);
        } catch (err) {
          console.error('기존 이미지 삭제 실패:', err);
        }
      }
      
      // 기존 레코드 삭제
      await supabase
        .from('delivery_records')
        .delete()
        .eq('id', duplicateCheck.existingRecord.id);
    }

    // 이미지 업로드
    const imageUrl = await uploadImage(file, recordData.userId);

    // 배달 기록 저장
    const { data, error } = await supabase
      .from('delivery_records')
      .insert({
        user_id: recordData.userId,
        user_nickname: recordData.userNickname,
        user_region: recordData.userRegion,
        platform: recordData.platform,
        amount: recordData.amount,
        delivery_count: recordData.deliveryCount,
        date: recordData.date,
        image_url: imageUrl,
        is_manual_entry: false,
        is_verified: false
      })
      .select()
      .single();

    if (error) throw error;

    // 포인트 지급 (중복이 아닌 경우에만)
    let pointsAwarded = 0;
    if (shouldAwardPoints) {
      const awarded = await rewardUploadPoints(recordData.userId);
      pointsAwarded = awarded ? 50 : 0;
    }

    return {
      success: true,
      imageUrl,
      recordId: data.id,
      points: pointsAwarded
    };
  } catch (error) {
    console.error('배달 기록 업로드 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
};

// 이미지 파일 검증
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // 파일 크기 체크 (10MB 제한)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' };
  }

  // 파일 타입 체크
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'JPG, PNG, WEBP 파일만 업로드 가능합니다.' };
  }

  return { valid: true };
};

// 이미지 압축
export const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}; 