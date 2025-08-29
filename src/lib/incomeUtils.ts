// 수입 관련 유틸리티 함수들
import { supabase } from './supabase'

export const handleIncomeSubmit = async (
  incomeCount: string,
  incomeAmount: string,
  missionAmount: string,
  selectedPlatform: string,
  setDailyIncomeData: any,
  setIncomeRecords: any,
  addPoints: (amount: number, reason: string) => void,
  setIncomeCount: (count: string) => void,
  setIncomeAmount: (amount: string) => void,
  setMissionAmount: (amount: string) => void,
  userId?: string
) => {
  try {
    if (incomeCount && (incomeAmount || missionAmount)) {
      const count = parseInt(incomeCount) || 0
      const deliveryAmount = parseInt(incomeAmount) || 0
      const mission = parseInt(missionAmount) || 0
      const totalIncome = deliveryAmount + mission
      const todayDate = new Date()
      const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`
      
      // 실제 사용자 ID 사용
      if (!userId) {
        console.error('사용자 ID가 필요합니다.')
        return
      }
      
      // Supabase에 수입 기록 저장
      // 참고: RLS 정책 오류가 발생한다면 Supabase 대시보드에서 RLS를 비활성화하세요
      const { data: earningsData, error: earningsError } = await supabase
        .from('earnings')
        .insert({
          user_id: userId,
          amount: totalIncome,
          date: today,
          screenshot_url: 'no-image',
          verified: false,
          points_awarded: 0,
          screenshot_text: '',
          verified_score: 0,
          source: selectedPlatform
        })
        .select()
        .single()

      if (earningsError) {
        console.error('수입 기록 저장 오류:', earningsError)
        return
      }

      // 포인트 획득 (배달 1건당 5포인트 + 금액의 1%)
      const earnedPoints = (count * 5) + Math.floor(totalIncome * 0.01)
      
      // 포인트를 Supabase에 저장
      const { error: pointsError } = await supabase
        .from('points')
        .insert({
          user_id: userId,
          amount: earnedPoints,
          type: 'earn'
        })

      if (pointsError) {
        console.error('포인트 저장 오류:', pointsError)
      }

      // 로컬 상태 업데이트 (기존 로직 유지)
      setDailyIncomeData((prev: any) => {
        const existingData = prev[today] || {
          date: today,
          platforms: {
            baemin: { count: 0, deliveryAmount: 0, missionAmount: 0 },
            coupang: { count: 0, deliveryAmount: 0, missionAmount: 0 },
            other: { count: 0, deliveryAmount: 0, missionAmount: 0 }
          },
          totalCount: 0,
          totalAmount: 0
        }
        
        // 선택된 플랫폼의 데이터를 덮어쓰기
        const updatedPlatforms = {
          ...existingData.platforms,
          [selectedPlatform]: {
            count: count,
            deliveryAmount: deliveryAmount,
            missionAmount: mission
          }
        }
        
        // 전체 합계 재계산
        const newTotalCount = Object.values(updatedPlatforms).reduce((sum: number, platform: any) => sum + platform.count, 0)
        const newTotalAmount = Object.values(updatedPlatforms).reduce((sum: number, platform: any) => sum + platform.deliveryAmount + platform.missionAmount, 0)
        
        return {
          ...prev,
          [today]: {
            date: today,
            platforms: updatedPlatforms,
            totalCount: newTotalCount,
            totalAmount: newTotalAmount
          }
        }
      })
      
      // 기존 incomeRecords도 업데이트 (덮어쓰기)
      const newRecord = {
        id: earningsData.id,
        platform: selectedPlatform,
        count: count,
        deliveryAmount: deliveryAmount,
        missionAmount: mission,
        amount: totalIncome,
        date: today
      }
      
      setIncomeRecords((prev: any) => {
        // 같은 날짜, 같은 플랫폼의 기존 기록 찾기
        const existingRecordIndex = prev.findIndex((record: any) => 
          record.date === newRecord.date && record.platform === selectedPlatform
        )
        
        if (existingRecordIndex !== -1) {
          // 기존 기록 덮어쓰기
          const updatedRecords = [...prev]
          updatedRecords[existingRecordIndex] = newRecord
          return updatedRecords
        } else {
          // 새로운 기록 추가
          return [...prev, newRecord]
        }
      })
      
      // 포인트 획득 알림
      addPoints(earnedPoints, `배달 ${count}건 완료`)
      
      // 입력 필드 초기화
      setIncomeCount('')
      setIncomeAmount('')
      setMissionAmount('')
      
      console.log('수입 기록이 성공적으로 저장되었습니다!')
    }
  } catch (error) {
    console.error('수입 제출 중 오류 발생:', error)
  }
}
