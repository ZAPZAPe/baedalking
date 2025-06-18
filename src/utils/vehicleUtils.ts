import { Vehicle } from '@/types';

// Vehicle 타입을 한국어로 변환
export const getVehicleText = (vehicle: Vehicle): string => {
  const vehicleMap: Record<Vehicle, string> = {
    motorcycle: '오토바이',
    bicycle: '자전거',
    car: '자동차',
    walk: '도보'
  };
  
  return vehicleMap[vehicle] || '오토바이';
};

// Vehicle 타입의 아이콘 이모지 반환
export const getVehicleEmoji = (vehicle: Vehicle): string => {
  const emojiMap: Record<Vehicle, string> = {
    motorcycle: '🏍️',
    bicycle: '🚴',
    car: '🚗',
    walk: '🚶'
  };
  
  return emojiMap[vehicle] || '🏍️';
};

// Vehicle 선택 옵션 배열
export const vehicleOptions = [
  { value: 'motorcycle' as Vehicle, label: '오토바이' },
  { value: 'bicycle' as Vehicle, label: '자전거' },
  { value: 'car' as Vehicle, label: '자동차' },
  { value: 'walk' as Vehicle, label: '도보' }
]; 