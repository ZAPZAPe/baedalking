declare global {
  interface Window {
    Kakao: any;
  }
}

// 카카오 SDK 초기화
export const initKakaoShare = () => {
  if (typeof window === 'undefined') {
    console.log('서버 사이드에서 실행 중입니다.');
    return;
  }

  if (!window.Kakao) {
    console.error('Kakao SDK가 로드되지 않았습니다.');
    return;
  }

  // JavaScript 키로 초기화
  if (!window.Kakao.isInitialized()) {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    console.log('Kakao SDK 초기화 시도:', kakaoKey ? '키 있음' : '키 없음');
    
    if (kakaoKey) {
      window.Kakao.init(kakaoKey);
      console.log('Kakao SDK 초기화 완료');
    } else {
      console.error('NEXT_PUBLIC_KAKAO_JS_KEY가 설정되지 않았습니다.');
    }
  } else {
    console.log('Kakao SDK는 이미 초기화되었습니다.');
  }
};

// 기본 공유하기
export const shareToKakao = () => {
  if (!window.Kakao) {
    console.error('카카오 SDK가 로드되지 않았습니다.');
    return;
  }

  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '배달킹 - 실시간 배달 랭킹',
        description: '배달 라이더들의 실시간 랭킹을 확인하고 경쟁해보세요!',
        imageUrl: 'https://baedalking.vercel.app/baedalking-logo.png',
        link: {
          mobileWebUrl: 'https://baedalking.vercel.app',
          webUrl: 'https://baedalking.vercel.app',
        },
      },
      buttons: [
        {
          title: '앱으로 보기',
          link: {
            mobileWebUrl: 'https://baedalking.vercel.app',
            webUrl: 'https://baedalking.vercel.app',
          },
        },
      ],
    });
  } catch (error) {
    console.error('카카오 공유 중 오류 발생:', error);
    fallbackShare('배달킹 - 실시간 배달 랭킹', 'https://baedalking.vercel.app');
  }
};

// 친구 초대하기
export const inviteFriends = async (inviteCode?: string) => {
  if (!window.Kakao) {
    console.error('카카오 SDK가 로드되지 않았습니다.');
    const inviteUrl = inviteCode ? `https://baedalking.vercel.app?invite=${inviteCode}` : 'https://baedalking.vercel.app';
    fallbackShare('배달킹에서 진짜 배달왕에 도전하세요! 🚀', inviteUrl);
    return;
  }

  const inviteUrl = inviteCode ? `https://baedalking.vercel.app?invite=${inviteCode}` : 'https://baedalking.vercel.app';

  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '배달킹 함께 도전하세요! 👑',
        description: '가입하면 300P 즉시 지급! 함께 랭킹 경쟁해요!',
        imageUrl: 'https://k.kakaocdn.net/14/dn/btsOCCP8KCJ/uPlo3tMwq4eHi8USTFrLkk/o.jpg',
        link: {
          mobileWebUrl: inviteUrl,
          webUrl: inviteUrl,
        },
      },
      buttons: [
        {
          title: '지금 가입하고 300P 받기',
          link: {
            mobileWebUrl: inviteUrl,
            webUrl: inviteUrl,
          },
        },
      ],
    });
  } catch (error) {
    console.error('친구 초대 공유 중 오류 발생:', error);
    fallbackShare('배달킹에서 진짜 배달왕에 도전하세요! 🚀', inviteUrl);
  }
};

// 대체 공유 방법 (Web Share API 또는 클립보드 복사)
const fallbackShare = async (title: string, url: string) => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: title,
        text: '배달킹에서 친구들과 함께 배달 실적을 경쟁해보세요!',
        url: url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert('링크가 클립보드에 복사되었습니다!\n친구들에게 공유해보세요.');
    }
  } catch (error) {
    console.error('대체 공유 방법 실행 중 오류:', error);
    const shareText = `${title}\n\n${url}`;
    prompt('아래 링크를 복사해서 친구들에게 공유해보세요:', shareText);
  }
};

interface KakaoShareParams {
  rank: number;
  totalAmount: number;
  deliveryCount: number;
  platform: string;
  period: string;
  region: string;
}

export const shareRanking = ({ rank, totalAmount, deliveryCount, platform, period, region }: KakaoShareParams) => {
  console.log('shareRanking 함수 호출됨:', { rank, totalAmount, deliveryCount, platform, period, region });
  
  if (typeof window === 'undefined' || !window.Kakao) {
    console.error('Kakao SDK가 로드되지 않았습니다.');
    alert('카카오톡 공유 기능을 사용할 수 없습니다. 페이지를 새로고침 해주세요.');
    return;
  }

  if (!window.Kakao.isInitialized()) {
    console.error('Kakao SDK가 초기화되지 않았습니다. 초기화 시도...');
    initKakaoShare();
    
    // 초기화 후 다시 확인
    if (!window.Kakao.isInitialized()) {
      console.error('Kakao SDK 초기화 실패');
      alert('카카오톡 공유 기능을 사용할 수 없습니다.');
      return;
    }
  }

  // 랭킹에 따른 이모지와 메시지 설정
  let emoji = '🏆';
  let achievementText = '';
  
  if (rank === 1) {
    emoji = '👑';
    achievementText = '최고의 배달킹!';
  } else if (rank <= 3) {
    emoji = '🥇';
    achievementText = '상위 랭커!';
  } else if (rank <= 10) {
    emoji = '🏅';
    achievementText = 'TOP 10 진입!';
  } else {
    emoji = '🚀';
    achievementText = '배달킹 도전 중!';
  }

  const title = `${region} 랭킹 ${rank}위 달성! ${emoji}`;
  const description = `${achievementText}

배달킹에서 나도 도전해보세요!`;

  const currentUrl = 'https://baedalking.vercel.app';

  console.log('카카오톡 공유 시도:', { title, description });

  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: title,
        description: description,
        imageUrl: 'https://baedalking.vercel.app/baedalking-logo.png',
        link: {
          mobileWebUrl: currentUrl,
          webUrl: currentUrl,
        },
      },
      buttons: [
        {
          title: '내 순위 확인하기',
          link: {
            mobileWebUrl: currentUrl,
            webUrl: currentUrl,
          },
        },
      ],
      social: {
        likeCount: rank <= 3 ? 999 : Math.floor(Math.random() * 100) + 50,
        commentCount: rank <= 3 ? 99 : Math.floor(Math.random() * 20) + 5,
        sharedCount: rank <= 3 ? 99 : Math.floor(Math.random() * 20) + 5,
      },
    });
    console.log('카카오톡 공유 요청 완료');
  } catch (error) {
    console.error('카카오톡 공유 중 오류 발생:', error);
    alert('카카오톡 공유 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}; 