import React, { useState, useEffect } from 'react'
import { Platform } from '@/hooks/useAppState'

interface IncomeEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
  records: any[]
  platforms: Platform[]
  onSave: (date: string, updatedRecords: any[]) => void
  onDeleteRecord?: (recordId: string) => void
}

export default function IncomeEditModal({
  isOpen,
  onClose,
  selectedDate,
  records,
  platforms,
  onSave,
  onDeleteRecord
}: IncomeEditModalProps) {
  const [editedRecords, setEditedRecords] = useState<any[]>([])

  useEffect(() => {
    if (isOpen && records) {
      // 깊은 복사로 초기 데이터 설정
      setEditedRecords(JSON.parse(JSON.stringify(records)))
    }
  }, [isOpen, records])

  const handleRecordChange = (index: number, field: string, value: any) => {
    const updatedRecords = [...editedRecords]
    updatedRecords[index] = { ...updatedRecords[index], [field]: value }
    setEditedRecords(updatedRecords)
  }

  const handleDeleteRecord = (index: number) => {
    if (confirm('이 수입 기록을 삭제하시겠습니까?')) {
      const recordToDelete = editedRecords[index]
      if (onDeleteRecord && recordToDelete.id) {
        onDeleteRecord(recordToDelete.id)
      }
      const updatedRecords = editedRecords.filter((_, i) => i !== index)
      setEditedRecords(updatedRecords)
    }
  }

  const handleSave = () => {
    onSave(selectedDate, editedRecords)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* 전체 화면을 덮는 블랙 배경 */}
      <div 
        className="fixed inset-0 z-[999999] bg-black"
        onClick={onClose}
      />
      
      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto pointer-events-none">
        <div 
          className="w-full max-w-2xl bg-gradient-to-b from-[#0a0a23] via-[#16213e] to-[#1a1a2e] border-2 sm:border-4 border-[#00ff88]/50 shadow-2xl relative max-h-[calc(100vh-32px)] overflow-y-auto pointer-events-auto"
          style={{
            borderRadius: '6px',
            fontFamily: 'monospace',
            imageRendering: 'pixelated',
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.2), inset 0 0 15px rgba(0, 255, 136, 0.05)'
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          
          {/* 네온 글로우 테두리 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00ff88]/20 via-[#00d4ff]/20 to-[#00ff88]/20 blur-sm -z-10" 
               style={{borderRadius: '12px'}}></div>
          
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-[#0a0a23] to-[#16213e] p-3 sm:p-4 border-b-2 border-[#00ff88]/30 relative">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#00d4ff] to-[#9c88ff] border border-[#00ff88]" 
                     style={{borderRadius: '3px'}}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white" style={{borderRadius: '1px'}}></div>
                  </div>
                </div>
                <h3 className="text-[#00ff88] font-bold text-sm sm:text-lg font-mono tracking-wide" 
                    style={{textShadow: '0 0 8px rgba(0, 255, 136, 0.5)'}}>
                  INCOME EDIT
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] font-bold transition-all duration-200 hover:scale-110 text-sm sm:text-base"
                style={{borderRadius: '4px'}}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4 space-y-4">
            {/* 날짜 표시 */}
            <div className="bg-gradient-to-r from-[#00d4ff]/20 to-[#9c88ff]/20 border border-[#00d4ff]/50 p-3 relative flex items-center justify-center"
                 style={{borderRadius: '4px'}}>
              <h4 className="text-[#00d4ff] text-center font-bold text-sm font-mono tracking-wide" 
                  style={{textShadow: '0 0 6px rgba(0, 212, 255, 0.5)'}}>
                {new Date(selectedDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h4>
              {/* 모서리 픽셀 도트 */}
              <div className="absolute top-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute top-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00d4ff]" style={{borderRadius: '1px'}}></div>
            </div>

            {/* 수정할 수익 기록들 */}
            <div className="space-y-3">
              <h5 className="text-white text-center font-bold text-sm font-mono mb-3" 
                  style={{textShadow: '0 0 6px rgba(255, 255, 255, 0.5)'}}>
                EDIT INCOME RECORDS
              </h5>
              
              {editedRecords.map((record, index) => {
                // 플랫폼별 설정을 위한 헬퍼 함수
                const getPlatformConfig = (platformId: string) => {
                  if (platformId === 'baemin') {
                    return { 
                      name: '배민',
                      icon: '/baemin-logo.svg', 
                      color: '#00C851',
                      showLogo: true 
                    }
                  } else if (platformId === 'coupang') {
                    return { 
                      name: '쿠팡',
                      icon: '/coupang-logo.svg', 
                      color: '#E4002B',
                      showLogo: true 
                    }
                  } else {
                    // 커스텀 플랫폼은 platforms 배열에서 찾기
                    const customPlatform = platforms.find(p => p.id === platformId)
                    if (customPlatform) {
                      return { 
                        name: customPlatform.name,
                        icon: '', 
                        color: customPlatform.color,
                        showLogo: false 
                      }
                    } else {
                      // 플랫폼을 찾을 수 없는 경우 기본값
                      return { 
                        name: platformId,
                        icon: '', 
                        color: '#9c88ff',
                        showLogo: false 
                      }
                    }
                  }
                }
                
                const config = getPlatformConfig(record.platform)
                
                return (
                  <div key={index} className="bg-[#1a202c]/60 border-2 border-[#00ff88]/30 p-3 relative"
                       style={{borderRadius: '4px'}}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 overflow-hidden`}
                             style={{
                               backgroundColor: `${config.color}20`,
                               borderColor: `${config.color}60`
                             }}>
                          {config.showLogo ? (
                            <img 
                              src={config.icon} 
                              alt={config.name}
                              className="w-4 h-4 object-contain"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          ) : (
                            <div 
                              className="w-3 h-3"
                              style={{
                                backgroundColor: config.color,
                                borderRadius: '1px'
                              }}
                            />
                          )}
                        </div>
                        <div className="text-white font-bold text-sm font-mono">{config.name}</div>
                      </div>
                      
                      {/* 삭제 버튼 - 쓰레기통 아이콘 */}
                      <button
                        onClick={() => handleDeleteRecord(index)}
                        className="w-8 h-8 bg-gradient-to-br from-[#ff6b6b]/20 to-[#ff4757]/20 border border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-[#ff4757] transition-all duration-200 hover:scale-110 flex items-center justify-center"
                        style={{borderRadius: '4px'}}
                        title="삭제"
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="currentColor"
                          style={{ imageRendering: 'pixelated' }}
                        >
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {/* 건수 */}
                      <div className="space-y-1">
                        <label className="text-white text-xs font-mono font-bold">건수</label>
                        <input
                          type="number"
                          value={record.count || 0}
                          onChange={(e) => handleRecordChange(index, 'count', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#1a202c] border border-[#00d4ff]/50 text-white text-sm font-mono p-2 rounded"
                          style={{borderRadius: '4px'}}
                        />
                      </div>
                      
                      {/* 배달금액 */}
                      <div className="space-y-1">
                        <label className="text-white text-xs font-mono font-bold">배달금액</label>
                        <input
                          type="number"
                          value={record.amount || 0}
                          onChange={(e) => handleRecordChange(index, 'amount', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#1a202c] border border-[#9c88ff]/50 text-white text-sm font-mono p-2 rounded"
                          style={{borderRadius: '4px'}}
                        />
                      </div>
                      
                      {/* 미션비 */}
                      <div className="space-y-1">
                        <label className="text-white text-xs font-mono font-bold">미션비</label>
                        <input
                          type="number"
                          value={record.missionAmount || 0}
                          onChange={(e) => handleRecordChange(index, 'missionAmount', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#1a202c] border border-[#ff6b6b]/50 text-white text-sm font-mono p-2 rounded"
                          style={{borderRadius: '4px'}}
                        />
                      </div>
                    </div>

                    {/* 픽셀 장식 요소들 */}
                    <div className="absolute top-1 left-1 w-1 h-1 rounded-sm"
                         style={{backgroundColor: config.color}}></div>
                    <div className="absolute top-1 right-1 w-1 h-1 rounded-sm"
                         style={{backgroundColor: config.color}}></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 rounded-sm"
                         style={{backgroundColor: config.color}}></div>
                    <div className="absolute bottom-1 right-1 w-1 h-1 rounded-sm"
                         style={{backgroundColor: config.color}}></div>
                  </div>
                )
              })}
            </div>

            {/* 버튼들 */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border-2 border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
                style={{
                  borderRadius: '6px',
                  textShadow: '0 0 6px rgba(0, 255, 136, 0.5)',
                  boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)'
                }}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00ff88] border border-white" style={{borderRadius: '1px'}}></div>
                  <span className="text-sm sm:text-base">SAVE</span>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00ff88] border border-white" style={{borderRadius: '1px'}}></div>
                </div>
                
                {/* 버튼 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff88]" style={{borderRadius: '1px'}}></div>
              </button>
              
              <button
                onClick={onClose}
                className="flex-1 bg-gradient-to-r from-[#ff6b6b]/20 to-[#ff4757]/20 border-2 border-[#ff6b6b]/50 hover:border-[#ff6b6b] text-[#ff6b6b] hover:text-white font-bold py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-lg relative font-mono tracking-wide"
                style={{
                  borderRadius: '6px',
                  textShadow: '0 0 6px rgba(255, 107, 107, 0.5)',
                  boxShadow: '0 0 15px rgba(255, 107, 107, 0.2)'
                }}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ff6b6b] border border-white" style={{borderRadius: '1px'}}></div>
                  <span className="text-sm sm:text-base font-mono tracking-wider">CANCEL</span>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ff6b6b] border border-white" style={{borderRadius: '1px'}}></div>
                </div>
                
                {/* 버튼 모서리 픽셀 도트 */}
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                <div className="absolute top-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-[#ff6b6b]" style={{borderRadius: '1px'}}></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
