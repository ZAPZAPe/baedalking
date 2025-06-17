'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { FaPaperPlane, FaArrowLeft } from 'react-icons/fa';

interface InquiryForm {
  title: string;
  content: string;
  category: 'general' | 'technical' | 'account' | 'other';
}

export default function InquiryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<InquiryForm>({
    title: '',
    content: '',
    category: 'general'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('inquiries')
        .insert({
          user_id: user.id,
          user_email: user.email,
          title: form.title,
          content: form.content,
          category: form.category,
          status: 'pending'
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        router.push('/settings/support');
      }, 2000);
    } catch (error) {
      console.error('문의 등록 오류:', error);
      setError('문의 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <FaArrowLeft size={16} />
          </button>
          <h1 className="text-2xl font-bold">1:1 문의하기</h1>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 mb-6">
            문의가 성공적으로 등록되었습니다. 빠른 시일 내에 답변 드리겠습니다.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 문의 유형 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              문의 유형
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as InquiryForm['category'] }))}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              required
            >
              <option value="general">일반 문의</option>
              <option value="technical">기술적 문제</option>
              <option value="account">계정 관련</option>
              <option value="other">기타</option>
            </select>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              제목
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="문의 제목을 입력하세요"
              required
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              내용
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent min-h-[200px] resize-y"
              placeholder="문의 내용을 자세히 입력해주세요"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              loading
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
            }`}
          >
            <FaPaperPlane size={16} />
            {loading ? '문의 등록 중...' : '문의하기'}
          </button>
        </form>
      </div>
    </div>
  );
} 