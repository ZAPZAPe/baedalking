export default function KakaoAdGlobal() {
  return (
    <div className="w-full flex justify-center py-2 bg-transparent">
      {/* 실제 광고 스크립트/iframe은 운영 시 삽입 */}
      <div style={{ width: 320, height: 100, background: '#eee', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#888' }}>
        카카오애드핏 광고 영역 (320x100)
      </div>
    </div>
  );
} 