'use client';

import { useState } from 'react';
import { FaQuestionCircle, FaEnvelope, FaPhone, FaComments, FaBook, FaChevronDown, FaChevronUp, FaChevronLeft, FaPaperPlane } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function SupportPage() {
  const { user } = useAuth();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [inquiryType, setInquiryType] = useState('general');
  const [inquiryContent, setInquiryContent] = useState('');
  const [sending, setSending] = useState(false);

  const faqs = [
    {
      question: '실적 업로드는 어떻게 하나요?',
      answer: '홈 화면에서 "실적 업로드" 버튼을 클릭하고, 배달 앱의 실적 화면을 캡처한 이미지를 업로드하면 됩니다. AI가 자동으로 금액과 건수를 인식합니다.'
    },
    {
      question: '포인트는 어떻게 얻나요?',
      answer: '신규 가입 시 300P, 출석체크 시 50P, 실적 업로드 시 50P가 적립됩니다. 또한 친구를 추천하면 추가 포인트를 받을 수 있습니다.'
    },
    {
      question: '포인트는 어디에 사용하나요?',
      answer: '현재는 포인트 적립 기능만 제공되며, 향후 다양한 리워드 기능이 추가될 예정입니다. 업데이트를 기대해주세요!'
    },
    {
      question: '실적이 제대로 인식되지 않아요',
      answer: '이미지가 선명하고 전체 화면이 보이도록 캡처해주세요. 계속 문제가 발생하면 1:1 카카오톡 문의로 연락주시기 바랍니다.'
    },
    {
      question: '랭킹은 언제 업데이트되나요?',
      answer: '실적 업로드 즉시 실시간으로 랭킹이 업데이트됩니다. 최종 랭킹은 매일 오전 6시에 확정되며, 전날 랭킹 기준으로 포인트가 지급됩니다.'
    },
    {
      question: '친구 초대는 어떻게 하나요?',
      answer: '설정 > 친구 초대에서 내 추천 코드를 확인하고 친구에게 공유해주세요. 친구가 가입하면 양쪽 모두 500P를 받습니다.'
    },
    {
      question: '계정을 삭제하고 싶어요',
      answer: '현재 계정 삭제 기능은 개발 중입니다. 계정 삭제를 원하시면 1:1 카카오톡 문의로 연락주시기 바랍니다.'
    },
    {
      question: '앱이 느려요 / 오류가 발생해요',
      answer: '앱을 완전히 종료한 후 다시 실행해보세요. 계속 문제가 발생하면 기기 정보와 함께 1:1 문의로 연락주시면 빠르게 해결해드리겠습니다.'
    }
  ];

  const handleSendInquiry = async () => {
    if (!inquiryContent.trim()) {
      alert('문의 내용을 입력해주세요.');
      return;
    }

    setSending(true);
    try {
      // TODO: 실제 문의 전송 로직 구현
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.');
      setInquiryContent('');
    } catch (error) {
      alert('문의 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <p className="text-white">로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* 헤더 */}
        <header className="pt-4 pb-2 mb-4">
          <div className="flex items-center justify-between">
            <Link href="/settings" className="text-white">
              <FaChevronLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold text-white">고객 지원</h1>
            <div className="w-5" />
          </div>
        </header>

        {/* 상단 광고 */}
        <section className="mt-2 mb-4">
          <div className="bg-white/5 rounded-lg h-[100px] flex items-center justify-center border border-white/10">
            <p className="text-sm text-blue-200">광고영역</p>
          </div>
        </section>

        {/* 자주 묻는 질문 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold text-white">자주 묻는 질문</h2>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FaBook className="text-white" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-all"
                  >
                    <span className="text-white font-bold text-sm text-left">{faq.question}</span>
                    {expandedFaq === index ? (
                      <FaChevronUp className="text-purple-400" size={14} />
                    ) : (
                      <FaChevronDown className="text-purple-400" size={14} />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-3 pb-3">
                      <p className="text-purple-200 text-xs leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 문의하기 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold text-white">1:1 문의</h2>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FaComments className="text-white" size={20} />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-white text-sm font-bold mb-1 block">문의 유형</label>
                <select
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="general">일반 문의</option>
                  <option value="bug">버그 신고</option>
                  <option value="suggestion">기능 제안</option>
                  <option value="payment">결제 문의</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div>
                <label className="text-white text-sm font-bold mb-1 block">문의 내용</label>
                <textarea
                  value={inquiryContent}
                  onChange={(e) => setInquiryContent(e.target.value)}
                  placeholder="문의하실 내용을 자세히 작성해주세요"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 h-32 resize-none"
                />
              </div>

              <button
                onClick={handleSendInquiry}
                disabled={sending}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 rounded-xl font-bold text-sm hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <FaPaperPlane size={14} />
                {sending ? '전송 중...' : '문의 보내기'}
              </button>
            </div>
          </div>
        </section>

        {/* 연락처 정보 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <h3 className="text-lg font-bold text-white mb-3">기타 연락처</h3>
            
            <div className="space-y-2">
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-3 border border-green-400/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center">
                    <FaEnvelope className="text-green-400" size={14} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">이메일</h4>
                    <p className="text-green-200 text-xs">support@baedalrank.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-3 border border-yellow-400/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
                    <FaComments className="text-yellow-400" size={14} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">카카오톡 1:1 문의</h4>
                    <p className="text-yellow-200 text-xs">빠른 답변을 원하시면 카카오톡으로 문의하세요</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 하단 광고 */}
        <section className="mb-2">
          <div className="bg-white/5 rounded-lg h-[100px] flex items-center justify-center border border-white/10">
            <p className="text-sm text-blue-200">광고영역</p>
          </div>
        </section>
      </div>
    </div>
  );
} 