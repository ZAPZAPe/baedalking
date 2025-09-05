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

  // 등급 구별 기준 정의
  const gradeCriteria = [
    { name: '브론즈', minIncome: 0, maxIncome: 50000, color: '#cd7f32', description: '신입 배달러' },
    { name: '실버', minIncome: 50000, maxIncome: 100000, color: '#c0c0c0', description: '경험 배달러' },
    { name: '골드', minIncome: 100000, maxIncome: 200000, color: '#ffd700', description: '전문 배달러' },
    { name: '플래티넘', minIncome: 200000, maxIncome: 300000, color: '#e5e4e2', description: '마스터 배달러' },
    { name: '다이아몬드', minIncome: 300000, maxIncome: 0, color: '#b9f2ff', description: '레전드 배달러' }
  ]

  return (
    <PixelModal
      isOpen={isOpen}
      onClose={onClose}
      title="GRADE DETAIL"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* 내 등급 정보 */}
        <PixelCard title="MY GRADE" variant="primary">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                 style={{borderColor: grade.color + '30', borderRadius: '4px'}}>
              <div className="text-white text-xs font-mono font-bold mb-1">내 등급</div>
              <div className="text-lg font-bold font-mono" style={{color: grade.color}}>
                {grade.name}
              </div>
            </div>
            
            <div className="bg-[#1a202c]/50 p-3 rounded-lg text-center border"
                 style={{borderColor: '#00d4ff30', borderRadius: '4px'}}>
              <div className="text-white text-xs font-mono font-bold mb-1">내 수입</div>
              <div className="text-lg font-bold font-mono text-[#00d4ff]">
                ₩{userIncome.toLocaleString()}
              </div>
            </div>
          </div>
        </PixelCard>

        {/* 등급 구별 기준 */}
        <PixelCard title="등급 구별 기준" variant="secondary">
          <div className="space-y-1">
            {gradeCriteria.map((criteria, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg border"
                   style={{
                     borderColor: criteria.color + '30',
                     backgroundColor: criteria.color + '10'
                   }}>
                <div>
                  <div className="text-white text-sm font-bold font-mono">{criteria.name}</div>
                  <div className="text-gray-400 text-xs font-mono">{criteria.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-white text-xs font-mono">
                    {criteria.minIncome.toLocaleString()}원
                    {criteria.maxIncome > 0 ? ` ~ ${criteria.maxIncome.toLocaleString()}원` : ' 이상'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PixelCard>



        {/* 닫기 버튼 */}
        <PixelButton
          variant="primary"
          fullWidth
          onClick={onClose}
        >
          CLOSE
        </PixelButton>
      </div>
    </PixelModal>
  )
}