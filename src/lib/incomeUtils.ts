// 수입 관련 유틸리티 함수들
import { supabase } from './supabase'

export const handleIncomeSubmit = async (
  incomeCount: string,
  incomeAmount: string,
  missionAmount: string,
  selectedPlatform: string,
  incomeImage: File | null,
  setDailyIncomeData: any,
  setIncomeRecords: any,
  addPoints: (amount: number, reason: string) => void,
  setIsVerified: (verified: boolean) => void,
  setIncomeCount: (count: string) => void,
  setIncomeAmount: (amount: string) => void,
  setMissionAmount: (amount: string) => void,
  setIncomeImage: (image: File | null) => void
) => {
  try {
    if (incomeCount && (incomeAmount || missionAmount)) {
      const count = parseInt(incomeCount) || 0
      const deliveryAmount = parseInt(incomeAmount) || 0
      const mission = parseInt(missionAmount) || 0
      const totalIncome = deliveryAmount + mission
      const todayDate = new Date()
      const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`
      
      // 현재 로그인한 사용자 확인
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('사용자가 로그인되지 않았습니다.')
        return
      }

      // 이미지 업로드 (있는 경우)
      let screenshotUrl = ''
      if (incomeImage) {
        const fileName = `earnings/${user.id}/${Date.now()}_${incomeImage.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('earnings')
          .upload(fileName, incomeImage)
        
        if (uploadError) {
          console.error('이미지 업로드 오류:', uploadError)
        } else {
          const { data: urlData } = supabase.storage
            .from('earnings')
            .getPublicUrl(fileName)
          screenshotUrl = urlData.publicUrl
        }
      }

      // Supabase에 수입 기록 저장
      const { data: earningsData, error: earningsError } = await supabase
        .from('earnings')
        .insert({
          user_id: user.id,
          amount: totalIncome,
          date: today,
          screenshot_url: screenshotUrl || 'no-image',
          verified: !!incomeImage,
          points_awarded: 0,
          screenshot_text: '',
          verified_score: incomeImage ? 100 : 0,
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
          user_id: user.id,
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
          hasImage: false,
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
            hasImage: !!incomeImage || existingData.hasImage,
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
        date: today,
        hasImage: !!incomeImage,
        imageName: incomeImage?.name || null
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
      
      // 사진이 있으면 인증 상태로 설정
      setIsVerified(!!incomeImage)
      
      // 입력 필드 초기화
      setIncomeCount('')
      setIncomeAmount('')
      setMissionAmount('')
      setIncomeImage(null)
      
      console.log('수입 기록이 성공적으로 저장되었습니다!')
    }
  } catch (error) {
    console.error('수입 제출 중 오류 발생:', error)
  }
}
