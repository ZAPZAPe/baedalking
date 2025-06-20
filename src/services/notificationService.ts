import { supabase } from '../lib/supabase';
import { NotificationType } from '@/types';

export interface Notification {
  id?: string;
  user_id: string | null; // null이면 전체 공지
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

// 알림 생성
export async function createNotification(noti: Omit<Notification, 'id' | 'read' | 'created_at'>) {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: noti.user_id,
      notification_type: noti.type, // type -> notification_type로 매핑
      title: noti.title,
      message: noti.message,
      read: false
    });

  if (error) {
    throw error;
  }
}

// 알림 불러오기 (공지+내 알림)
export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, notification_type, title, message, created_at, read')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // notification_type을 type으로 매핑하여 반환
  return data?.map(item => ({
    ...item,
    type: item.notification_type
  })) as Notification[];
}

// 알림 읽음 처리
export async function markAsRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

// 알림 삭제
export async function deleteNotification(id: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
} 