'use client'

import React, { useState } from 'react'
import PixelModal from '@/components/ui/PixelModal'

interface RegionSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentRegion: string
  onSave: (region: string) => void
}

// 시/도 및 구 정보
const regionData = {
  '서울특별시': [
    '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', 
    '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', 
    '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
  ],
  '부산광역시': [
    '강서구', '금정구', '남구', '동구', '동래구', '부산진구', '북구', '사상구', 
    '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구', '기장군'
  ],
  '대구광역시': [
    '남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'
  ],
  '인천광역시': [
    '계양구', '남구', '남동구', '동구', '부평구', '서구', '연수구', '중구', '강화군', '옹진군'
  ],
  '광주광역시': [
    '광산구', '남구', '동구', '북구', '서구'
  ],
  '대전광역시': [
    '대덕구', '동구', '서구', '유성구', '중구'
  ],
  '울산광역시': [
    '남구', '동구', '북구', '중구', '울주군'
  ],
  '세종특별자치시': [
    '세종특별자치시'
  ],
  '경기도': [
    '수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '과천시', 
    '오산시', '시흥시', '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', 
    '안성시', '김포시', '화성시', '광주시', '여주시', '양평군', '고양시', '구리시', 
    '남양주시', '동두천시', '안산시', '가평군', '연천군'
  ],
  '강원도': [
    '춘천시', '원주시', '강릉시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', 
    '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'
  ],
  '충청북도': [
    '청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'
  ],
  '충청남도': [
    '천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', 
    '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'
  ],
  '전라북도': [
    '전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', 
    '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'
  ],
  '전라남도': [
    '목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', 
    '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', 
    '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'
  ],
  '경상북도': [
    '포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', 
    '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', 
    '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'
  ],
  '경상남도': [
    '창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', 
    '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', 
    '거창군', '합천군'
  ],
  '제주특별자치도': [
    '제주시', '서귀포시'
  ]
}

export default function RegionSettingsModal({
  isOpen,
  onClose,
  currentRegion,
  onSave
}: RegionSettingsModalProps) {
  const [selectedProvince, setSelectedProvince] = useState<string>('')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // 현재 지역을 시/도와 구로 분리
  React.useEffect(() => {
    if (currentRegion) {
      // "서울특별시 강남구" 형태에서 분리
      const parts = currentRegion.split(' ')
      if (parts.length >= 2) {
        setSelectedProvince(parts[0])
        setSelectedDistrict(parts.slice(1).join(' '))
      } else {
        // 시/도만 있는 경우
        setSelectedProvince(currentRegion)
        setSelectedDistrict('')
      }
    }
  }, [currentRegion])

  // 검색어로 필터링된 시/도 목록
  const filteredProvinces = Object.keys(regionData).filter(province =>
    province.includes(searchQuery) || 
    province.replace(/특별시|광역시|도|특별자치시/g, '').includes(searchQuery)
  )

  // 선택된 시/도의 구 목록
  const districts = selectedProvince ? regionData[selectedProvince as keyof typeof regionData] || [] : []

  const handleSave = () => {
    if (selectedProvince && selectedDistrict) {
      onSave(`${selectedProvince} ${selectedDistrict}`)
    } else if (selectedProvince) {
      onSave(selectedProvince)
    }
    onClose()
  }

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province)
    setSelectedDistrict('')
  }

  return (
    <PixelModal
      isOpen={isOpen}
      onClose={onClose}
      title="지역 설정"
    >
      <div className="space-y-4">
        {/* 검색 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            시/도 검색
          </label>
          <input
            type="text"
            placeholder="시/도명을 입력하세요..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a202c] border border-[#00ff88]/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-[#00ff88] focus:outline-none font-mono"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 시/도 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              시/도 선택
            </label>
            <div className="max-h-60 overflow-y-auto bg-[#1a202c] border border-[#00ff88]/30 rounded-lg">
              {filteredProvinces.map((province) => (
                <button
                  key={province}
                  onClick={() => handleProvinceSelect(province)}
                  className={`w-full text-left px-3 py-2 hover:bg-[#00ff88]/20 transition-colors ${
                    selectedProvince === province 
                      ? 'bg-[#00ff88]/30 text-[#00ff88]' 
                      : 'text-white hover:text-[#00ff88]'
                  }`}
                >
                  {province}
                </button>
              ))}
            </div>
          </div>

          {/* 구 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              구 선택
            </label>
            <div className="max-h-60 overflow-y-auto bg-[#1a202c] border border-[#00ff88]/30 rounded-lg">
              {districts.map((district) => (
                <button
                  key={district}
                  onClick={() => setSelectedDistrict(district)}
                  className={`w-full text-left px-3 py-2 hover:bg-[#00ff88]/20 transition-colors ${
                    selectedDistrict === district 
                      ? 'bg-[#00ff88]/30 text-[#00ff88]' 
                      : 'text-white hover:text-[#00ff88]'
                  }`}
                >
                  {district}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 선택된 지역 표시 */}
        {selectedProvince && (
          <div className="bg-[#1a202c]/50 p-3 rounded-lg border border-[#00ff88]/30">
            <div className="text-sm text-gray-300">선택된 지역:</div>
            <div className="text-lg font-bold text-[#00ff88]">
              {selectedProvince} {selectedDistrict && selectedDistrict}
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedProvince}
            className={`flex-1 font-bold py-2 px-4 rounded-lg transition-colors ${
              selectedProvince
                ? 'bg-[#00ff88] hover:bg-[#00cc6a] text-black'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            저장
          </button>
        </div>
      </div>
    </PixelModal>
  )
}
