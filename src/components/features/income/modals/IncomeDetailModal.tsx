import React from 'react'
import { Platform } from '@/types'
import PixelModal from '@/components/ui/PixelModal'
import PixelButton from '@/components/ui/PixelButton'
import PixelCard from '@/components/ui/PixelCard'

interface IncomeDetailModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string | null
  allRecords: any[]
  platforms: Platform[]
  onEdit?: (date: string, records: any[]) => void
}

export default function IncomeDetailModal({
  isOpen,
  onClose,
  selectedDate,
  allRecords,
  platforms,
  onEdit
}: IncomeDetailModalProps) {
  if (!isOpen) return null
  if (!selectedDate) {
    onClose()
    return null
  }

  const dayRecords = allRecords.filter(record => record.date === selectedDate)
  const dayTotal = dayRecords.reduce((sum, record) => sum + (record.amount || 0) + (record.missionAmount || 0), 0)
  const dayCount = dayRecords.reduce((sum, record) => sum + record.count, 0)
  const dayDelivery = dayRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
  const dayMission = dayRecords.reduce((sum, record) => sum + (record.missionAmount || 0), 0)

  return (
    <PixelModal
      isOpen={isOpen}
      onClose={onClose}
      title="INCOME DETAIL"
      maxWidth="md"
    >
      {/* 날짜 정보 */}
      <PixelCard title="DATE" variant="primary">
        <div className="text-center">
          <div className="text-white font-bold text-sm font-mono mb-2">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'short'
            })}
          </div>
        </div>
      </PixelCard>

            {/* 수입 요약 */}
      <div className="mt-4">
        <PixelCard title="INCOME SUMMARY" variant="secondary">
          {/* 총 수입 - 박스 없이 위쪽에 배치 */}
          <div className="text-center mb-3">
            <div className="text-white text-xs font-mono font-bold mb-1">총 수입</div>
            <div className="text-lg font-bold font-mono text-[#00d4ff]">
              ₩{dayTotal.toLocaleString()}
            </div>
          </div>
          
          {/* 하단 세 개 카드 */}
          <div className="grid grid-cols-3 gap-2">
            {/* 건수 */}
            <div className="bg-[#1a202c]/50 p-2 rounded-lg text-center border"
                 style={{borderColor: '#9c88ff30', borderRadius: '4px'}}>
              <div className="text-white text-xs font-mono font-bold mb-1">건수</div>
              <div className="text-xs font-bold font-mono text-[#9c88ff]">
                {dayCount}건
              </div>
            </div>
            
            {/* 배달비 */}
            <div className="bg-[#1a202c]/50 p-2 rounded-lg text-center border"
                 style={{borderColor: '#00ff8830', borderRadius: '4px'}}>
              <div className="text-white text-xs font-mono font-bold mb-1">배달비</div>
              <div className="text-xs font-bold font-mono text-[#00ff88]">
                ₩{dayDelivery.toLocaleString()}
              </div>
            </div>
            
            {/* 미션비 */}
            <div className="bg-[#1a202c]/50 p-2 rounded-lg text-center border"
                 style={{borderColor: '#ffd93d30', borderRadius: '4px'}}>
              <div className="text-white text-xs font-mono font-bold mb-1">미션비</div>
              <div className="text-xs font-bold font-mono text-[#ffd93d]">
                ₩{dayMission.toLocaleString()}
              </div>
            </div>
          </div>
        </PixelCard>
      </div>

            {/* 상세 기록 */}
      <div className="mt-4">
        <PixelCard title="DETAIL RECORDS" variant="info">
          <div className="space-y-2">
            {dayRecords.length > 0 ? (
              dayRecords.map((record, index) => {
                const platform = platforms.find(p => p.id === record.platform)
                const platformName = platform?.name || record.platform
                const platformColor = platform?.color || '#9c88ff'
                
                return (
                  <div 
                    key={index}
                    className="bg-[#1a202c]/50 p-3 rounded-lg border"
                    style={{borderColor: `${platformColor}30`, borderRadius: '4px'}}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {/* 플랫폼 아이콘/로고 */}
                        <div className="flex items-center gap-2">
                          {platform?.id === 'baemin' ? (
                            <img 
                              src="/baemin-logo.svg" 
                              alt="배민" 
                              className="w-5 h-5 object-contain"
                            />
                          ) : platform?.id === 'coupang' ? (
                            <img 
                              src="/coupang-logo.svg" 
                              alt="쿠팡" 
                              className="w-5 h-5 object-contain"
                            />
                          ) : (
                            <div 
                              className="w-5 h-5 rounded-sm border-2"
                              style={{
                                backgroundColor: platformColor,
                                borderColor: platformColor
                              }}
                            />
                          )}
                          <div 
                            className={`px-2 py-1 rounded text-xs font-mono font-bold`}
                            style={{
                              backgroundColor: `${platformColor}20`,
                              color: platformColor,
                              border: `1px solid ${platformColor}50`,
                              borderRadius: '4px'
                            }}
                          >
                            {platformName}
                          </div>
                        </div>
                      </div>
                      <div className="text-white text-sm font-bold font-mono">
                        ₩{((record.amount || 0) + (record.missionAmount || 0)).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {/* 건수 */}
                      <div className="bg-[#1a202c]/50 p-2 rounded-lg text-center border"
                           style={{borderColor: `${platformColor}30`}}>
                        <div className="text-white text-xs font-mono font-bold mb-1">건수</div>
                        <div className="text-xs font-bold font-mono"
                             style={{color: platformColor}}>
                          {record.count}건
                        </div>
                      </div>
                      
                      {/* 배달비 */}
                      <div className="bg-[#1a202c]/50 p-2 rounded-lg text-center border"
                           style={{borderColor: `${platformColor}30`}}>
                        <div className="text-white text-xs font-mono font-bold mb-1">배달비</div>
                        <div className="text-xs font-bold font-mono text-white">
                          ₩{(record.amount || 0).toLocaleString()}
                        </div>
                      </div>
                      
                      {/* 미션비 */}
                      <div className="bg-[#1a202c]/50 p-2 rounded-lg text-center border"
                           style={{borderColor: `${platformColor}30`}}>
                        <div className="text-white text-xs font-mono font-bold mb-1">미션비</div>
                        <div className="text-xs font-bold font-mono"
                             style={{color: platformColor}}>
                          ₩{(record.missionAmount || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-gray-400 py-4 font-mono">
                해당 날짜에 수입 기록이 없습니다.
              </div>
            )}
          </div>
        </PixelCard>
      </div>

      {/* 버튼 영역 */}
      <div className="mt-4">
        <div className="flex gap-2">
        {onEdit && dayRecords.length > 0 && (
          <PixelButton
            variant="secondary"
            fullWidth
            onClick={() => onEdit(selectedDate, dayRecords)}
          >
            EDIT
          </PixelButton>
        )}
        <PixelButton
          variant="primary"
          fullWidth
          onClick={onClose}
        >
          CLOSE
        </PixelButton>
      </div>
      </div>
    </PixelModal>
  )
}