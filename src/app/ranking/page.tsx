'use client';

import { useState, useEffect } from 'react';
import { FaCrown, FaTrophy, FaMedal, FaStar, FaFilter, FaUsers, FaFireAlt, FaCamera, FaCoins, FaList, FaChevronDown, FaShare, FaTimes, FaUser, FaMapMarkerAlt, FaMotorcycle, FaBicycle, FaCar, FaWalking } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getTodayRanking, getWeeklyRanking, getMonthlyRanking, RankingData } from '@/services/rankingService';
import { Ranking } from '@/types/ranking';
import Loading from '@/components/Loading';
import KakaoAd from '@/components/KakaoAd';
import { shareRanking, initKakaoShare } from '@/services/kakaoShare';
import { toast } from 'react-hot-toast';

export default function RankingPage() {
  const { user, userProfile, loading } = useAuth();
  // 기간 선택 (일간/주간)
  const [period, setPeriod] = useState('today');
  // 정렬 기준 (금액/건수)
  const [sortBy, setSortBy] = useState('amount');
  // 지역 필터
  const [region, setRegion] = useState('all');
  // 플랫폼 필터 추가
  const [platform, setPlatform] = useState('all');
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<RankingData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [displayCount, setDisplayCount] = useState(10); // 표시할 랭킹 개수

  // 랭킹 데이터 가져오기
  useEffect(() => {
    const fetchRankings = async () => {
      setRankingLoading(true);
      try {
        let data: RankingData[] = [];
        if (period === 'today') {
          data = await getTodayRanking() as unknown as RankingData[];
        } else if (period === 'week') {
          data = await getWeeklyRanking() as unknown as RankingData[];
        } else {
          data = await getMonthlyRanking() as unknown as RankingData[];
        }
        
        // 정렬 기준에 따라 데이터 정렬
        data.sort((a, b) => {
          if (sortBy === 'amount') {
            if (b.totalAmount !== a.totalAmount) {
              return b.totalAmount - a.totalAmount;
            }
            return b.totalOrders - a.totalOrders;
          } else {
            if (b.totalOrders !== a.totalOrders) {
              return b.totalOrders - a.totalOrders;
            }
            return b.totalAmount - a.totalAmount;
          }
        });

        // 필터 적용
        let filtered = data;
        if (region !== 'all') {
          filtered = filtered.filter(item => item.region && item.region.includes(region));
        }
        if (platform !== 'all') {
          filtered = filtered.filter(item => item.platform === platform);
        }

        // 랭킹 순위 재계산 (공동 순위 처리)
        filtered = filtered.reduce((acc: RankingData[], curr, idx, arr) => {
          if (idx === 0) {
            curr.rank = 1;
          } else {
            const prev = arr[idx - 1];
            if (prev.totalAmount === curr.totalAmount && prev.totalOrders === curr.totalOrders) {
              curr.rank = prev.rank;
            } else {
              curr.rank = idx + 1;
            }
          }
          return [...acc, curr];
        }, []);

        setRankings(filtered);
        setDisplayCount(10); // 필터 변경 시 표시 개수 초기화
      } catch (error) {
        console.error('랭킹 데이터 가져오기 오류:', error);
        setRankings([]);
      } finally {
        setRankingLoading(false);
      }
    };

    fetchRankings();
  }, [period, sortBy, region, platform]);

  // 카카오톡 SDK 초기화
  useEffect(() => {
    // 카카오 SDK 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://t1.daumcdn.net/kakao_js_sdk/2.5.0/kakao.min.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      console.log('카카오 SDK 스크립트 로드 완료');
      // SDK 로드 후 초기화
      setTimeout(() => {
        initKakaoShare();
      }, 100);
    };

    script.onerror = () => {
      console.error('카카오 SDK 스크립트 로드 실패');
    };

    return () => {
      // 클린업 시 스크립트 제거하지 않음 (다른 페이지에서도 사용할 수 있으므로)
    };
  }, []);

  const handleShareMyRank = () => {
    console.log('내 순위 자랑하기 버튼 클릭됨');
    
    if (!userProfile) {
      toast.error('로그인이 필요한 기능입니다.');
      return;
    }
    
    // 현재 필터 조건에서 내 순위 찾기
    const myRank = rankings.find(r => r.userId === userProfile.id);
    
    // 선택된 지역이 내 지역이 아닌 경우 공유 불가
    if (region !== 'all' && userProfile.region !== region) {
      toast.error('선택한 지역의 순위만 공유할 수 있습니다.');
      return;
    }

    // 선택된 플랫폼이 내 플랫폼이 아닌 경우 공유 불가
    if (platform !== 'all' && myRank?.platform !== platform) {
      toast.error('선택한 플랫폼의 순위만 공유할 수 있습니다.');
      return;
    }
    
    if (!myRank) {
      toast.error('현재 조건에서의 순위 정보가 없습니다.');
      return;
    }

    if (
      myRank.rank !== undefined &&
      myRank.totalAmount !== undefined &&
      myRank.totalOrders !== undefined
    ) {
      // 동적 공유 메시지 생성
      const periodText = period === 'today' ? '오늘' : period === 'week' ? '이번 주' : '이번 달';
      const regionText = region === 'all' ? '전국' : region;
      const platformText = platform === 'all' ? '전체 플랫폼' : platform;
      shareRanking({
        rank: myRank.rank,
        totalAmount: myRank.totalAmount,
        deliveryCount: myRank.totalOrders,
        platform: platformText,
        period: periodText,
        region: regionText
      });
    } else {
      toast.error('순위 정보가 없습니다.');
    }
  };

  const handleUserClick = (ranker: RankingData) => {
    setSelectedUser(ranker);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const getVehicleIcon = (vehicle?: string) => {
    switch (vehicle) {
      case 'motorcycle':
        return <FaMotorcycle className="text-white" size={20} />;
      case 'bicycle':
        return <FaBicycle className="text-white" size={20} />;
      case 'car':
        return <FaCar className="text-white" size={20} />;
      case 'walk':
        return <FaWalking className="text-white" size={20} />;
      default:
        return <FaMotorcycle className="text-white" size={20} />;
    }
  };

  const getVehicleText = (vehicle?: string) => {
    switch (vehicle) {
      case 'motorcycle':
        return '오토바이';
      case 'bicycle':
        return '자전거';
      case 'car':
        return '자동차';
      case 'walk':
        return '도보';
      default:
        return '오토바이';
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* 통합된 랭킹 섹션 */}
        <section className="mb-4 mt-2">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            {/* 상단 타이틀 */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">실시간 랭킹</h2>
                <p className="text-blue-200 text-sm">
                  {rankings.length}명의 배달킹이 함께 달리는중!
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FaTrophy className="text-white" size={20} />
              </div>
            </div>

            {/* 내 순위 정보 */}
            {user && (
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm mb-1">내 순위</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">
                        {rankings.findIndex(r => r.userId === user.id) + 1 || '?'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-blue-200 text-sm mb-1">오늘 수익</p>
                      <p className="text-lg font-bold text-white">
                        {rankings.find(r => r.userId === user.id)?.totalAmount.toLocaleString() || '0'}원
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-200 text-sm mb-1">오늘 건수</p>
                      <p className="text-lg font-bold text-white">
                        {rankings.find(r => r.userId === user.id)?.totalOrders || '0'}건
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 자랑하기 버튼 */}
            {user && (
              <button
                onClick={handleShareMyRank}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-amber-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <FaShare size={16} />
                <span className="text-sm">내 순위 자랑하기</span>
              </button>
            )}
          </div>
        </section>

        {/* 광고 - 실시간 랭킹 하단으로 이동 */}
        <section className="mb-4">
          <KakaoAd page="ranking" index={0} />
        </section>

        {/* 통합된 필터 및 랭킹 섹션 */}
        <section className="mb-2">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            {/* 필터 섹션 */}
            <div className="space-y-3 mb-4">
              <div className="text-center mb-3">
                <h3 className="text-2xl font-bold text-white">전체 랭킹</h3>
              </div>
              {/* 기간 선택 */}
              <div className="flex gap-2">
                {[
                  { value: 'today', label: '일간', Icon: FaStar },
                  { value: 'week', label: '주간', Icon: FaFireAlt },
                  { value: 'month', label: '월간', Icon: FaCrown }
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPeriod(p.value)}
                    className={`
                      flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                      ${period === p.value
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg'
                        : 'bg-white/5 text-blue-200 hover:text-white hover:bg-white/10'}
                    `}
                  >
                    <p.Icon size={14} />
                    {p.label}
                  </button>
                ))}
              </div>

              {/* 정렬 기준 선택 */}
              <div className="flex gap-2">
                {[
                  { value: 'amount', label: '금액순', Icon: FaCoins },
                  { value: 'count', label: '건수순', Icon: FaList }
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSortBy(s.value)}
                    className={`
                      flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                      ${sortBy === s.value
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg'
                        : 'bg-white/5 text-blue-200 hover:text-white hover:bg-white/10'}
                    `}
                  >
                    <s.Icon size={14} />
                    {s.label}
                  </button>
                ))}
              </div>

              {/* 플랫폼 선택 */}
              <div className="flex gap-2">
                {[
                  { value: 'all', label: '전체', Icon: FaUsers },
                  { value: '배민커넥트', label: '배민커넥트' },
                  { value: '쿠팡이츠', label: '쿠팡이츠' }
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPlatform(p.value)}
                    className={`
                      flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                      ${platform === p.value
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg'
                        : 'bg-white/5 text-blue-200 hover:text-white hover:bg-white/10'}
                    `}
                  >
                    {p.Icon && <p.Icon size={14} />}
                    {p.label}
                  </button>
                ))}
              </div>

              {/* 지역 선택 - 필터 제일 하단으로 이동 */}
              <div className="relative">
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-white/5 text-white border border-white/20 focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 appearance-none cursor-pointer text-sm"
                >
                  <option value="all" className="bg-slate-900">전체 지역</option>
                  <option value="서울" className="bg-slate-900">서울</option>
                  <option value="부산" className="bg-slate-900">부산</option>
                  <option value="대구" className="bg-slate-900">대구</option>
                  <option value="인천" className="bg-slate-900">인천</option>
                  <option value="광주" className="bg-slate-900">광주</option>
                  <option value="대전" className="bg-slate-900">대전</option>
                  <option value="울산" className="bg-slate-900">울산</option>
                  <option value="세종" className="bg-slate-900">세종</option>
                  <option value="경기" className="bg-slate-900">경기</option>
                  <option value="강원" className="bg-slate-900">강원</option>
                  <option value="충북" className="bg-slate-900">충북</option>
                  <option value="충남" className="bg-slate-900">충남</option>
                  <option value="전북" className="bg-slate-900">전북</option>
                  <option value="전남" className="bg-slate-900">전남</option>
                  <option value="경북" className="bg-slate-900">경북</option>
                  <option value="경남" className="bg-slate-900">경남</option>
                  <option value="제주" className="bg-slate-900">제주</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <FaChevronDown className="w-3 h-3 text-blue-200" />
                </div>
              </div>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-white/10 my-4"></div>

            {/* 랭킹 목록 */}
            <div>
              <div className="grid grid-cols-1 gap-2">
                {rankings.slice(0, displayCount).map((ranker, index) => (
                  <button
                    key={ranker.rank}
                    onClick={() => handleUserClick(ranker)}
                    className={`
                      relative overflow-hidden rounded-xl text-left w-full
                      ${ranker.userId === user?.id 
                        ? 'bg-gradient-to-r from-amber-400/20 to-orange-500/20 border border-amber-400/30' 
                        : 'bg-white/5 hover:bg-white/10'}
                      transition-all
                    `}
                  >
                    {/* 순위 표시 */}
                    <div className={`
                      absolute top-0 left-0 w-10 h-10 flex items-center justify-center text-sm font-bold
                      ${index === 0 
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' 
                        : index === 1 
                        ? 'bg-gradient-to-br from-slate-400 to-slate-500 text-white'
                        : index === 2
                        ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white'
                        : 'bg-white/10 text-blue-200'}
                    `}>
                      {index + 1}
                    </div>

                    {/* 메인 컨텐츠 */}
                    <div className="p-2 pl-12">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-bold text-white">{ranker.nickname}</p>
                            <p className="text-xs text-blue-200/80">{ranker.region}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {sortBy === 'amount' ? (
                            <>
                              <p className="font-bold text-white">
                                {ranker.totalAmount.toLocaleString()}원
                              </p>
                              <p className="text-xs text-blue-200/80">
                                {ranker.totalOrders}건
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-white">
                                {ranker.totalOrders}건
                              </p>
                              <p className="text-xs text-blue-200/80">
                                {ranker.totalAmount.toLocaleString()}원
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* 더보기 버튼 */}
              {rankings.length > displayCount && displayCount < 50 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setDisplayCount(Math.min(displayCount + 10, 50))}
                    className="px-6 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-bold text-sm hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg"
                  >
                    더보기 ({displayCount}/{Math.min(rankings.length, 50)})
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* 사용자 상세 정보 모달 */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">라이더 정보</h3>
              <button
                onClick={closeUserModal}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* 프로필 이미지 */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <FaUser size={40} className="text-white/60" />
              </div>
            </div>

            {/* 닉네임과 순위 */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-1">{selectedUser.nickname}</h2>
              <div className="flex items-center justify-center gap-2">
                <FaTrophy className="text-yellow-400" size={16} />
                <span className="text-white">현재 {selectedUser.rank}위</span>
              </div>
            </div>

            {/* 상세 정보 */}
            <div className="space-y-3 mb-6">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-blue-300" size={16} />
                    <span className="text-blue-200 text-sm">지역</span>
                  </div>
                  <span className="text-white font-medium">{selectedUser.region}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getVehicleIcon(selectedUser.vehicle)}
                    <span className="text-blue-200 text-sm">운송수단</span>
                  </div>
                  <span className="text-white font-medium">{getVehicleText(selectedUser.vehicle)}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaCoins className="text-yellow-300" size={16} />
                    <span className="text-blue-200 text-sm">
                      {period === 'today' ? '오늘' : period === 'week' ? '이번 주' : '이번 달'} 수익
                    </span>
                  </div>
                  <span className="text-white font-medium">{selectedUser.totalAmount.toLocaleString()}원</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaList className="text-green-300" size={16} />
                    <span className="text-blue-200 text-sm">
                      {period === 'today' ? '오늘' : period === 'week' ? '이번 주' : '이번 달'} 건수
                    </span>
                  </div>
                  <span className="text-white font-medium">{selectedUser.totalOrders}건</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaCamera className="text-purple-300" size={16} />
                    <span className="text-blue-200 text-sm">플랫폼</span>
                  </div>
                  <span className="text-white font-medium">{selectedUser.platform}</span>
                </div>
              </div>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={closeUserModal}
              className="w-full bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 