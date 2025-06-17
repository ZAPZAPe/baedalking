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
    <div className="fixed inset-0 z-50 p-4">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 팝업 컨테이너 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-blue-900 to-purple-900 rounded-2xl p-6 w-full max-w-md max-h-[calc(100vh-12rem)] overflow-y-auto shadow-2xl border border-white/20">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">수기 입력</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <FaTimes className="text-white" size={16} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-xl">
          <p className="text-yellow-200 text-sm text-center">
            수기 입력 기록은 포인트, 랭킹 반영되지 않습니다.<br />
            중복 기록은 덮어쓰기됩니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="platform" className="block text-sm font-bold text-blue-200 mb-2">
              플랫폼
            </label>
            <select
              id="platform"
              name="platform"
              value={formData.platform}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-blue-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm tracking-[0.2em] appearance-none"
              required
            >
              <option value="배민커넥트" className="bg-gray-800">배민커넥트</option>
              <option value="쿠팡이츠" className="bg-gray-800">쿠팡이츠</option>
            </select>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-bold text-blue-200 mb-2">
              날짜
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-blue-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm tracking-[0.2em] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-datetime-edit]:text-white [&::-webkit-datetime-edit-fields-wrapper]:text-white [&::-webkit-datetime-edit-text]:text-white [&::-webkit-datetime-edit-month-field]:text-white [&::-webkit-datetime-edit-day-field]:text-white [&::-webkit-datetime-edit-year-field]:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="orderCount" className="block text-sm font-bold text-blue-200 mb-2">
              건수
            </label>
            <input
              type="text"
              id="orderCount"
              name="orderCount"
              value={formData.orderCount}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-blue-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tracking-[0.2em]"
              required
              min="1"
              placeholder="배달 건수를 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="totalAmount" className="block text-sm font-bold text-blue-200 mb-2">
              금액 (원)
            </label>
            <input
              type="text"
              id="totalAmount"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-blue-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tracking-[0.2em]"
              required
              min="0"
              placeholder="총 금액을 입력하세요"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors border border-white/20"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
              disabled={loading}
            >
              {loading ? '처리중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 