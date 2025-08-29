import React from 'react'
import PixelModal from '@/components/ui/PixelModal'
import PixelButton from '@/components/ui/PixelButton'
import PixelCard from '@/components/ui/PixelCard'

interface GradeDetailModalProps {
  isOpen: boolean
  onClose: () => void
  grade: {
    name: string
    minIncome: number
    maxIncome: number
    color: string
    description: string
  }
  userIncome: number
  userRank: number
  totalUsers: number
}

export default function GradeDetailModal({
  isOpen,
  onClose,
  grade,
  userIncome,
  userRank,
  totalUsers
}: GradeDetailModalProps) {
  if (!isOpen) return null

  const gradeProgress = grade.maxIncome > 0 
    ? Math.min(((userIncome - grade.minIncome) / (grade.maxIncome - grade.minIncome)) * 100, 100)
    : 0

  return (
    <PixelModal
      isOpen={isOpen}
      onClose={onClose}
      title="GRADE DETAIL"
      maxWidth="md"
    >
      {/* 등급 정보 */}
      <PixelCard title="CURRENT GRADE" variant="primary">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-lg"
               style={{backgroundColor: `${grade.color}20`, border: `2px solid ${grade.color}50`}}>
            <div className="text-3xl font-bold font-mono" style={{color: grade.color}}>
              {grade.name.charAt(0)}
            </div>
          </div>
          <h3 className="text-white font-bold text-xl font-mono mb-2">
            {grade.name}
          </h3>
          <p className="text-gray-300 text-sm font-mono leading-relaxed">
            {grade.description}
          </p>
        </div>
      </PixelCard>

      {/* 현재 상태 */}
      <PixelCard title="CURRENT STATUS" variant="secondary">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
               style={{borderColor: '#00d4ff30', borderRadius: '4px'}}>
            <div className="text-white text-xs font-mono font-bold mb-1">현재 수입</div>
            <div className="text-sm font-bold font-mono text-[#00d4ff]">
              ₩{userIncome.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
               style={{borderColor: '#9c88ff30', borderRadius: '4px'}}>
            <div className="text-white text-xs font-mono font-bold mb-1">현재 순위</div>
            <div className="text-sm font-bold font-mono text-[#9c88ff]">
              {userRank}위 / {totalUsers}명
            </div>
          </div>
        </div>
      </PixelCard>

      {/* 등급 조건 */}
      <PixelCard title="GRADE REQUIREMENTS" variant="success">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white text-sm font-mono">최소 수입:</span>
            <span className="text-[#00ff88] text-sm font-bold font-mono">
              ₩{grade.minIncome.toLocaleString()}
            </span>
          </div>
          
          {grade.maxIncome > 0 ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-white text-sm font-mono">최대 수입:</span>
                <span className="text-[#00ff88] text-sm font-bold font-mono">
                  ₩{grade.maxIncome.toLocaleString()}
                </span>
              </div>
              
              {/* 진행률 바 */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white text-xs font-mono">등급 진행률</span>
                  <span className="text-[#00ff88] text-xs font-bold font-mono">
                    {gradeProgress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-[#1a202c] rounded-full h-3 border border-[#00ff88]/30">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${gradeProgress}%`,
                      background: `linear-gradient(90deg, ${grade.color}80, ${grade.color})`
                    }}
                  ></div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <span className="text-[#ffd93d] text-sm font-bold font-mono">
                🏆 최고 등급입니다!
              </span>
            </div>
          )}
        </div>
      </PixelCard>

      {/* 다음 등급 정보 */}
      {grade.maxIncome > 0 && userIncome < grade.maxIncome && (
        <PixelCard title="NEXT LEVEL" variant="info">
          <div className="text-center">
            <div className="text-white text-sm font-mono mb-2">
              다음 등급까지 필요한 수입:
            </div>
            <div className="text-[#9c88ff] text-lg font-bold font-mono">
              ₩{(grade.maxIncome - userIncome).toLocaleString()}
            </div>
          </div>
        </PixelCard>
      )}

      {/* 닫기 버튼 */}
      <PixelButton
        variant="primary"
        fullWidth
        onClick={onClose}
      >
        CLOSE
      </PixelButton>
    </PixelModal>
  )
}