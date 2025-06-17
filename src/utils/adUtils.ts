const AD_UNITS = [
  'DAN-cV8be5DKnSRmZrxZ',  // 홈 상단
  'DAN-veyUDOOMf8vvxxX3',  // 랭킹 상단
  'DAN-qfowyTHOc7r5oDwB',  // 업로드 상단
  'DAN-ooLQwoBQ9SyYTQkP',  // 상점 상단
] as const;

// 페이지별로 필요한 광고 개수를 정의
const AD_COUNTS = {
  home: 3,    // 홈페이지: 상단, 중간, 하단
  ranking: 2, // 랭킹페이지: 상단, 하단
  upload: 2,  // 업로드페이지: 상단, 하단
  shop: 2,    // 상점페이지: 상단, 하단
} as const;

type PageType = keyof typeof AD_COUNTS;

// 페이지별로 선택된 광고 단위를 저장하는 Map
const pageAdUnits = new Map<PageType, string[]>();

// 페이지에 필요한 광고 단위들을 가져오는 함수
export const getAdUnitsForPage = (page: PageType): string[] => {
  // 이미 선택된 광고 단위가 있다면 그대로 반환
  if (pageAdUnits.has(page)) {
    return pageAdUnits.get(page)!;
  }

  // 페이지에 필요한 광고 개수만큼 랜덤하게 광고 단위 선택
  const count = AD_COUNTS[page];
  const availableUnits = [...AD_UNITS];
  const selectedUnits: string[] = [];

  // 필요한 개수만큼 랜덤하게 선택
  for (let i = 0; i < count; i++) {
    if (availableUnits.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * availableUnits.length);
    const selectedUnit = availableUnits.splice(randomIndex, 1)[0];
    selectedUnits.push(selectedUnit);
  }

  // 선택된 광고 단위 저장
  pageAdUnits.set(page, selectedUnits);
  return selectedUnits;
};

// 페이지가 언마운트될 때 해당 페이지의 광고 단위 초기화
export const resetPageAdUnits = (page: PageType) => {
  pageAdUnits.delete(page);
};

// 모든 페이지의 광고 단위 초기화
export const resetAllAdUnits = () => {
  pageAdUnits.clear();
}; 