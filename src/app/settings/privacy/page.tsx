'use client';

import { useState } from 'react';
import { FaShieldAlt, FaLock, FaEye, FaEyeSlash, FaTrash, FaExclamationTriangle, FaChevronLeft } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function PrivacySettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [profileVisibility, setProfileVisibility] = useState('public');

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '계정삭제') {
      alert('계정삭제를 정확히 입력해주세요.');
      return;
    }

    // TODO: 실제 계정 삭제 로직 구현
    alert('계정이 삭제되었습니다.');
    await signOut();
    router.push('/');
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
            <h1 className="text-xl font-bold text-white">개인정보 설정</h1>
            <div className="w-5" />
          </div>
        </header>

        {/* 상단 광고 */}
        <section className="mt-2 mb-4">
          <div className="bg-white/5 rounded-lg h-[100px] flex items-center justify-center border border-white/10">
            <p className="text-sm text-blue-200">광고영역</p>
          </div>
        </section>

        {/* 개인정보 설정 섹션 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold text-white">개인정보 보호</h2>
                <p className="text-blue-200 text-sm">내 정보를 안전하게 관리하세요</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FaShieldAlt className="text-white" size={20} />
              </div>
            </div>

            <div className="space-y-3">
              {/* 프로필 공개 설정 */}
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-400/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center">
                      <FaEye className="text-blue-400" size={14} />
                    </div>
                    <span className="text-white font-bold text-sm">프로필 공개 설정</span>
                  </div>
                </div>
                <select
                  value={profileVisibility}
                  onChange={(e) => setProfileVisibility(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="public">전체 공개</option>
                  <option value="friends">친구만 공개</option>
                  <option value="private">비공개</option>
                </select>
              </div>

              {/* 비밀번호 변경 */}
              <Link href="/settings/privacy/change-password" className="block">
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-3 border border-green-400/30 hover:scale-105 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center">
                        <FaLock className="text-green-400" size={14} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm">비밀번호 변경</h3>
                        <p className="text-green-200 text-xs">계정 보안 강화</p>
                      </div>
                    </div>
                    <span className="text-white/40">›</span>
                  </div>
                </div>
              </Link>

              {/* 로그인 기록 */}
              <Link href="/settings/privacy/login-history" className="block">
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-400/30 hover:scale-105 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center">
                        <FaEyeSlash className="text-purple-400" size={14} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm">로그인 기록</h3>
                        <p className="text-purple-200 text-xs">접속 내역 확인</p>
                      </div>
                    </div>
                    <span className="text-white/40">›</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* 계정 삭제 섹션 */}
        <section className="mb-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xl font-bold text-red-400">위험 구역</h2>
                <p className="text-red-200 text-sm">되돌릴 수 없는 작업입니다</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaExclamationTriangle className="text-white" size={16} />
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl p-3 border border-red-400/30 hover:scale-105 transition-all"
              >
                <div className="flex items-center justify-center gap-2">
                  <FaTrash className="text-red-400" size={14} />
                  <span className="text-red-300 font-bold text-sm">계정 삭제</span>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-red-200 text-sm text-center">
                  정말로 계정을 삭제하시겠습니까?<br />
                  모든 데이터가 영구적으로 삭제됩니다.
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="계정삭제 라고 입력하세요"
                  className="w-full bg-white/10 border border-red-400/30 rounded-lg px-3 py-2 text-white text-sm placeholder-red-300/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1 bg-white/20 text-white py-2 rounded-lg font-bold text-sm hover:bg-white/30 transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-600 transition-all"
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
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