'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaTimes } from 'react-icons/fa';
import { addDeliveryRecord, getRecordByDate, updateDeliveryRecord } from '@/services/userService';

interface ManualEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ManualEntry({ isOpen, onClose, onSuccess }: ManualEntryProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    platform: '배민커넥트',
    date: new Date().toISOString().split('T')[0],
    orderCount: '',
    totalAmount: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // 같은 날짜와 플랫폼의 기록이 있는지 확인
      const existingRecord = await getRecordByDate(
        user.id,
        formData.platform,
        formData.date
      );
      
      const deliveryData = {
        user_id: user.id,
        date: formData.date,
        amount: Number(formData.totalAmount.replace(/,/g, '')),
        deliveryCount: Number(formData.orderCount),
        platform: formData.platform,
        verified: false
      };

      if (existingRecord && existingRecord.id) {
        // 기존 기록이 있으면 업데이트
        await updateDeliveryRecord(user.id, existingRecord.id, deliveryData);
        console.log('기존 기록이 업데이트되었습니다.');
      } else {
        // 새로운 기록 추가
        await addDeliveryRecord(user.id, deliveryData);
        console.log('새로운 기록이 추가되었습니다.');
      }
      
      // 폼 초기화
      setFormData({
        platform: '배민커넥트',
        date: new Date().toISOString().split('T')[0],
        orderCount: '',
        totalAmount: ''
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('배달 기록 추가/수정 오류:', error);
      alert('배달 기록 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'totalAmount') {
      // 숫자만 추출하고 세자리마다 콤마 추가
      const numericValue = value.replace(/[^0-9]/g, '');
      const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else if (name === 'orderCount') {
      // 건수도 숫자만 입력 가능하도록
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 팝업 컨테이너 */}
      <div className="relative bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-3 sm:p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl border border-purple-500/30 relative overflow-hidden">
        {/* 배경 애니메이션 효과 */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
        
        <div className="relative z-10">
          {/* 헤더 - 실시간 Top 3 스타일 */}
          <div className="text-center mb-3 sm:mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FaTimes className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
              <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                수기 입력
              </h2>
              <FaTimes className="text-purple-400 animate-bounce w-4 h-4 sm:w-7 sm:h-7" />
            </div>
            <p className="text-purple-200 text-xs">실적을 직접 입력하세요! ✍️</p>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <FaTimes size={16} />
          </button>

          <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 rounded-xl">
            <p className="text-yellow-200 text-xs sm:text-sm text-center">
              수기 입력은 포인트 랭킹에 반영 ❌<br />
              중복 입력은 최신 데이터로 덮어쓰기 됩니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="platform" className="block text-xs sm:text-sm font-bold text-purple-200 mb-1.5 sm:mb-2">
                플랫폼
              </label>
              <select
                id="platform"
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-purple-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm appearance-none text-xs sm:text-sm"
                required
              >
                <option value="배민커넥트" className="bg-slate-900">배민커넥트</option>
                <option value="쿠팡이츠" className="bg-slate-900">쿠팡이츠</option>
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-xs sm:text-sm font-bold text-purple-200 mb-1.5 sm:mb-2">
                날짜
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-purple-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm [&::-webkit-calendar-picker-indicator]:invert text-xs sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="orderCount" className="block text-xs sm:text-sm font-bold text-purple-200 mb-1.5 sm:mb-2">
                건수
              </label>
              <input
                type="text"
                id="orderCount"
                name="orderCount"
                value={formData.orderCount}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-purple-400/30 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-xs sm:text-sm"
                required
                min="1"
                placeholder="배달 건수를 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="totalAmount" className="block text-xs sm:text-sm font-bold text-purple-200 mb-1.5 sm:mb-2">
                금액 (원)
              </label>
              <input
                type="text"
                id="totalAmount"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-purple-400/30 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-xs sm:text-sm"
                required
                min="0"
                placeholder="총 금액을 입력하세요"
              />
            </div>

            <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20 text-xs sm:text-sm"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white font-bold rounded-xl transition-all hover:scale-[1.02] shadow-lg text-xs sm:text-sm"
                disabled={loading}
              >
                {loading ? '처리중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 