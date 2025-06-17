import { supabase } from '../lib/supabase';
import { createNotification } from './notificationService';
import { NotificationType } from '@/types';

export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export const sendFriendRequest = async (fromUserId: string, toUserId: string) => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // 친구 요청 알림 생성
    await createNotification({
      user_id: toUserId,
      type: 'friend_request',
      title: '새로운 친구 요청',
      message: '새로운 친구 요청이 도착했습니다.'
    });

    return data;
  } catch (error) {
    console.error('친구 요청 전송 오류:', error);
    throw error;
  }
};

export const getFriendRequests = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('친구 요청 조회 오류:', error);
    return [];
  }
};

export const acceptFriendRequest = async (requestId: string) => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    // 친구 수락 알림 생성
    await createNotification({
      user_id: data.from_user_id,
      type: 'friend_accept',
      title: '친구 요청 수락',
      message: '친구 요청이 수락되었습니다.'
    });

    return data;
  } catch (error) {
    console.error('친구 요청 수락 오류:', error);
    throw error;
  }
};

export const rejectFriendRequest = async (requestId: string) => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('친구 요청 거절 오류:', error);
    throw error;
  }
};

export const getFriends = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        from_user:users!friend_requests_from_user_id_fkey(id, nickname, email),
        to_user:users!friend_requests_to_user_id_fkey(id, nickname, email)
      `)
      .eq('status', 'accepted')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

    if (error) throw error;
    
    // 친구 목록 정리
    const friends = data?.map(request => {
      if (request.from_user_id === userId) {
        return request.to_user;
      } else {
        return request.from_user;
      }
    }) || [];

    return friends;
  } catch (error) {
    console.error('친구 목록 조회 오류:', error);
    return [];
  }
}; 