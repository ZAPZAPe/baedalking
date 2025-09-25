// PIXI.js 기반 인벤토리 패널 (The Sims 스타일 우측 사이드바)
import * as PIXI from 'pixi.js'
import { GameUIManagerConfig } from './GameUIManager'

export interface InventoryItem {
  id: string
  name: string
  description: string
  image_url: string
  category: string
  sub_category: string
  pixel_data: {
    voxelData: any[]
    dimensions: { width: number, height: number, depth: number }
  }
  quantity: number
  purchased_at: string
  isPlaced?: boolean // 배치 상태 (선택적)
}

export class InventoryPanel {
  private container: PIXI.Container
  private config: GameUIManagerConfig
  
  // 패널 요소들
  private background: PIXI.Graphics | null = null
  private titleText: PIXI.Text | null = null
  private itemsContainer: PIXI.Container | null = null
  private itemsMask: PIXI.Graphics | null = null
  // 닫기 버튼 제거 (핸들바로 토글)
  private filterButtons: PIXI.Graphics[] = []
  
  // 탭 관련
  private activeTab: 'interior' | 'decoration' | 'vehicle' = 'interior'
  private tabs: Map<string, PIXI.Container> = new Map()
  
  // 아이템 관련
  private items: InventoryItem[] = []
  private itemSlots: PIXI.Container[] = []
  private selectedItem: InventoryItem | null = null
  private placedItemIds: Set<string> = new Set() // 배치된 아이템 ID 추적 (문자열로 통일)
  private activeFilter: string = '인테리어'
  private handleBar: PIXI.Graphics | null = null // 드로어 핸들 바 (도형)
  private handleBarWrapper: PIXI.Container | null = null // 핸들바(그래픽+텍스트) 래퍼 컨테이너
  private handleBarContainer: PIXI.Container | null = null // 핸들바 전용 컨테이너
  private interactionBlocker: PIXI.Graphics | null = null // 패널 상단에서 캔버스 이벤트 차단
  private connectedHandleLabel: PIXI.Text | null = null // 일체형 상태 핸들 텍스트
  private connectedHandleHit: PIXI.Graphics | null = null // 일체형 상태 핸들 클릭 히트영역
  
  // 가로 스크롤 상태
  private isDragging = false
  private dragStartX = 0
  private dragStartContainerX = 0
  private scrollX = 0
  
  // 애니메이션 관련 (상하 슬라이드)
  private isVisible = false
  private targetY = 0
  private currentY = 0
  private animationSpeed = 0.15
  private isPlacementMode = false  // 배치 모드 상태
  
  // 스타일 설정 (1줄 표시용)
  private panelWidth = 300
  public panelHeight = 180 // 아이템 큐브를 위한 충분한 공간 확보 - 외부 접근 가능
  private readonly itemSlotSize = 45 // 아이템 슬롯 크기 더 줄임
  private readonly itemsPerRow = 8 // 한 줄에 더 많은 아이템 표시 (캔버스 전체 너비 활용)
  private readonly backgroundColor = 0x1a1a2e
  private readonly borderColor = 0x3a8dff
  private readonly slotColor = 0x34495e
  private readonly selectedSlotColor = 0x3498db
  
  constructor(parentContainer: PIXI.Container, config: GameUIManagerConfig) {
    this.container = new PIXI.Container()
    this.config = config
    parentContainer.addChild(this.container)
    
    // 핸들바 전용 컨테이너 제거 - 패널과 일체형으로 만들기
    
    this.createPanel()
    this.loadItems()
    
    // 초기 상태 설정
    this.container.visible = true
    this.isVisible = false
    
    // 안전한 화면 크기 계산
    const screenHeight = this.config.app?.screen?.height || window.innerHeight
    const screenWidth = this.config.app?.screen?.width || window.innerWidth
    
    console.log('InventoryPanel 생성 - 화면 크기:', screenWidth, 'x', screenHeight)
    
    // 패널 초기 위치 설정 (핸들바만 보이도록)
    this.container.x = 0
    this.container.y = screenHeight - 20 // 핸들바 높이만큼만 보이도록
    this.currentY = this.container.y
    this.targetY = this.container.y
  }
  
  private createPanel() {
    // 패널 배경 생성
    this.background = new PIXI.Graphics()
    this.redrawBackground()
    this.container.addChild(this.background)

    // 패널 전체에 이벤트 차단 레이어 추가 (투명)
    this.interactionBlocker = new PIXI.Graphics()
    this.interactionBlocker.clear()
    this.interactionBlocker.rect(0, 0, this.panelWidth, this.panelHeight)
    this.interactionBlocker.fill({ color: 0x000000, alpha: 0.001 }) // 거의 투명
    this.interactionBlocker.eventMode = 'static'
    this.interactionBlocker.on('pointerdown', (e: PIXI.FederatedPointerEvent) => e.stopPropagation())
    this.interactionBlocker.on('pointermove', (e: PIXI.FederatedPointerEvent) => e.stopPropagation())
    this.interactionBlocker.on('pointerup', (e: PIXI.FederatedPointerEvent) => e.stopPropagation())
    this.interactionBlocker.on('pointerupoutside', (e: PIXI.FederatedPointerEvent) => e.stopPropagation())
    this.interactionBlocker.on('wheel', (e: any) => {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
    })
    this.container.addChild(this.interactionBlocker)
    
    // 핸들 바 생성 (패널 상단에 붙임)
    this.createHandleBar()
    
    // 탭 시스템 추가
    this.createTabs()
    
    // 아이템 컨테이너 생성
    this.createItemsContainer()
    
    // 초기 위치 설정
    this.updatePosition()
  }

  // 패널 배경 그리기 (핸들바 아래만 그리기)
  private redrawBackground() {
    if (!this.background) return
    
    this.background.clear()
    
    // 핸들바 아래부터 패널 본체 그리기 (1px 더 아래로)
    this.background.fill({ color: 0x0f1624, alpha: 0.95 })
    this.background.roundRect(0, 20, this.panelWidth, this.panelHeight - 20, 12)
    this.background.fill()
    
    // 외곽 테두리 (핸들바 아래만)
    this.background.stroke({ color: this.borderColor, width: 2, alpha: 0.9 })
    this.background.roundRect(0, 20, this.panelWidth, this.panelHeight - 20, 12)
    this.background.stroke()
    
    // 내부 얕은 하이라이트
    this.background.fill({ color: 0x3a8dff, alpha: 0.06 })
    this.background.roundRect(2, 22, this.panelWidth - 4, this.panelHeight - 24, 10)
    this.background.fill()
  }

  // 캔버스 화면 크기에 맞춰 위치 업데이트 - 완전 반응형 해결책
  private updatePosition() {
    // PIXI.js 캔버스 크기 사용 (완전 반응형) - 안전 체크 추가
    const screenWidth = this.config.app?.screen?.width || window.innerWidth
    const screenHeight = this.config.app?.screen?.height || window.innerHeight
    
    console.log(`InventoryPanel 위치 업데이트 (캔버스 반응형): ${screenWidth}x${screenHeight}`)
    
    // 상단 HUD 박스와 동일한 방식으로 캔버스 내부에 딱 맞게 조정
    const maxWidth = this.config.app.screen.width // 상단 HUD와 정확히 동일한 방식
    
    // 패널 높이 동적 계산: 핸들바(20) + 탭(24) + 탭 아래 간격(작게) + 아이템 슬롯(45) + 하단 여백(작게)
    const handlebarHeight = 20
    const tabHeight = 24
    const gapUnderTabs = 8
    const itemHeight = this.itemSlotSize // 45 기본
    const bottomPadding = 24
    const desiredHeight = handlebarHeight + tabHeight + gapUnderTabs + itemHeight + bottomPadding
    
    // 화면 높이의 45%를 넘지 않도록 제한 (너무 작아지는 현상 방지)
    const maxAllowed = Math.floor(screenHeight * 0.45)
    const maxHeight = Math.min(desiredHeight, maxAllowed)
    
    // 패널 크기 조정
    if (maxWidth !== this.panelWidth || maxHeight !== this.panelHeight) {
      this.panelWidth = maxWidth
      this.panelHeight = maxHeight
      
      // 배경 다시 그리기
      this.redrawBackground()
      // 인터랙션 차단 레이어 갱신
      if (this.interactionBlocker) {
        this.interactionBlocker.clear()
        this.interactionBlocker.rect(0, 0, this.panelWidth, this.panelHeight)
        this.interactionBlocker.fill({ color: 0x000000, alpha: 0.001 })
      }
      // 마스크도 갱신 - 아이템이 정확히 들어가도록
      if (this.itemsMask) {
        this.itemsMask.clear()
        this.itemsMask.fill({ color: 0xffffff, alpha: 1 })
        // 마스크 크기를 정확히 계산: 패널 폭 - 좌우 패딩(12), 아이템 슬롯 높이 + 축소 여백
        const maskWidth = this.panelWidth - 12
        const maskHeight = this.itemSlotSize + 56 // 아이템 하단이 짤리지 않도록 여백 확대
        this.itemsMask.rect(0, 0, maskWidth, maskHeight)
        this.itemsMask.fill()
      }
      // 핸들바 위치 재조정
      if (this.handleBarWrapper) {
        this.handleBarWrapper.x = (this.panelWidth - 200) / 2
      }
      // 탭 위치 재조정 (반응형)
      this.updateTabPositions()
    }
    
    // 패널 위치 설정
    const targetX = 0 // 좌측에 딱 맞게
    let targetY: number
    
    if (this.isPlacementMode) {
      // 배치 모드일 때는 더 아래로 내림 (핸들바만 살짝 보이게)
      targetY = this.isVisible ? screenHeight - 30 : screenHeight - 20
    } else {
      // 일반 모드일 때는 기존 위치
      targetY = this.isVisible ? screenHeight - this.panelHeight : screenHeight - 20
    }
    
    this.container.x = targetX
    this.container.y = targetY
    this.currentY = this.container.y
    this.targetY = this.container.y
    
    // 디버그 로그 추가
    console.log(`InventoryPanel 위치: ${targetX}, ${targetY}, visible: ${this.isVisible}`)
  }
  
  private createTitle() {
    // 제목 제거됨 - 아이템창 큐브만 표시
  }
  
  private createHandleBar() {
    // 래퍼 컨테이너 (v8에서 addChild 경고 방지)
    this.handleBarWrapper = new PIXI.Container()
    this.handleBarWrapper.eventMode = 'static'
    ;(this.handleBarWrapper as any).cursor = 'pointer'
    
    // 핸들 바 그래픽
    this.handleBar = new PIXI.Graphics()
    this.handleBar.fill({ color: 0x3a8dff, alpha: 1.0 })
    this.handleBar.roundRect(0, 0, 200, 20, 3)
    this.handleBar.fill()
    
    // 핸들바 텍스트
    const handleText = new PIXI.Text({
      text: 'Inventory',
      style: {
        fontSize: 8,
        fill: 0xffffff,
        fontWeight: 'normal',
        fontFamily: 'monospace'
      }
    })
    handleText.anchor.set(0.5, 0.5)
    handleText.x = 100
    handleText.y = 10
    
    // 래퍼에 자식 추가
    this.handleBarWrapper.addChild(this.handleBar)
    this.handleBarWrapper.addChild(handleText)
    
    // 패널 상단에 위치 (패널과 일체형)
    this.handleBarWrapper.x = (this.panelWidth - 200) / 2
    this.handleBarWrapper.y = 0
    
    // 인터랙션 (토글)
    this.handleBarWrapper.on('pointerdown', () => {
      if (this.config.toggleInventory) {
        this.config.toggleInventory()
      } else {
        this.toggleInventory()
      }
    })
    this.handleBarWrapper.on('pointerover', () => {
      this.handleBarWrapper!.alpha = 0.9
      this.handleBarWrapper!.scale.set(1.03)
    })
    this.handleBarWrapper.on('pointerout', () => {
      this.handleBarWrapper!.alpha = 1.0
      this.handleBarWrapper!.scale.set(1.0)
    })
    
    // 패널 컨테이너에 직접 추가
    this.container.addChild(this.handleBarWrapper)
    
    // 🗑️ 전체 삭제 버튼 추가
    this.createClearAllButton()
    
    console.log('핸들바 생성됨 - 패널과 일체형')
  }

  // 핸들바를 패널과 하나로 보이게 붙이기 - 제거
  // 핸들바를 화면 하단(패널 외부)로 복귀 - 제거
  
  private createFilterButtons() {
    // 필터 버튼 제거됨 - 인테리어 아이템만 표시
  }
  
  private createTabs() {
    const tabData = [
      { key: 'interior', label: '🏠 인테리어' },
      { key: 'decoration', label: '🎨 장식' },
      { key: 'vehicle', label: '🚗 운송' }
    ]
    
    // 탭 버튼 생성 및 저장 (컨테이너 없이 직접 배치)
    tabData.forEach((tab, index) => {
      const tabButton = this.createTabButton(tab.key, tab.label, index)
      this.tabs.set(tab.key, tabButton)
      this.container.addChild(tabButton)
    })
    
    this.updateActiveTab()
    this.updateTabPositions() // 초기 위치 설정
  }
  
  private createTabButton(key: string, label: string, index: number): PIXI.Container {
    const tab = new PIXI.Container()
    ;(tab as any).tabIndex = index // 인덱스 저장
    
    const bg = new PIXI.Graphics()
    const isActive = this.activeTab === key
    
    const width = 80
    const height = 24
    
    // 탭 위치 설정 (핸들바 아래)
    tab.y = 28 // 핸들바 아래
    
    // 탭 배경
    bg.fill({ color: isActive ? 0x1a2a44 : 0x0a1220, alpha: 0.9 })
    bg.roundRect(0, 0, width, height, 6)
    bg.fill()
    
    // 탭 테두리
    bg.stroke({ color: 0x3a8dff, width: isActive ? 2 : 1, alpha: isActive ? 1 : 0.6 })
    bg.roundRect(0, 0, width, height, 6)
    bg.stroke()
    
    tab.addChild(bg)
    
    // 탭 텍스트
    const text = new PIXI.Text({
      text: label,
      style: {
        fontSize: 10,
        fill: isActive ? 0x62a7ff : 0x6080a0,
        fontWeight: isActive ? 'bold' : 'normal',
        fontFamily: 'Arial, sans-serif'
      }
    })
    text.anchor.set(0.5, 0.5)
    text.x = width / 2
    text.y = height / 2
    tab.addChild(text)
    
    // 인터랙션
    tab.eventMode = 'static'
    tab.cursor = 'pointer'
    tab.on('pointerdown', () => this.switchTab(key as any))
    
    return tab
  }
  
  // 탭 위치 업데이트 (반응형)
  private updateTabPositions() {
    const tabWidth = 80
    const tabSpacing = 5
    const tabCount = this.tabs.size
    const totalWidth = (tabWidth * tabCount) + (tabSpacing * (tabCount - 1))
    const startX = (this.panelWidth - totalWidth) / 2 // 중앙 정렬
    
    this.tabs.forEach((tab) => {
      const index = (tab as any).tabIndex || 0
      tab.x = startX + (index * (tabWidth + tabSpacing))
    })
  }
  
  private switchTab(tab: 'interior' | 'decoration' | 'vehicle') {
    console.log('🔄 인벤토리 탭 변경:', { 이전탭: this.activeTab, 새탭: tab })
    this.activeTab = tab
    this.updateActiveTab()
    this.loadItems()
  }
  
  private updateActiveTab() {
    this.tabs.forEach((tab, key) => {
      const bg = tab.children[0] as PIXI.Graphics
      const text = tab.children[1] as PIXI.Text
      const isActive = key === this.activeTab
      
      // 배경 업데이트
      bg.clear()
      bg.fill({ color: isActive ? 0x1a2a44 : 0x0a1220, alpha: 0.9 })
      bg.roundRect(0, 0, 80, 24, 6)
      bg.fill()
      bg.stroke({ color: 0x3a8dff, width: isActive ? 2 : 1, alpha: isActive ? 1 : 0.6 })
      bg.roundRect(0, 0, 80, 24, 6)
      bg.stroke()
      
      // 텍스트 스타일 업데이트
      text.style.fill = isActive ? 0x62a7ff : 0x6080a0
      text.style.fontWeight = isActive ? 'bold' : 'normal'
    })
  }
  
  private createItemsContainer() {
    this.itemsContainer = new PIXI.Container()
    // 탭 아래 위치 (정확한 위치 계산)
    this.itemsContainer.x = 6
    this.itemsContainer.y = 56 // 탭(28)+탭높이(24)=52 기준, 여백 4px 확보
    
    // 마스크 생성: 패널 영역 밖 렌더링 차단
    this.itemsMask = new PIXI.Graphics()
    this.itemsMask.fill({ color: 0xffffff, alpha: 1 })
    // 마스크 크기를 정확히 계산: 패널 폭 - 좌우 패딩(12), 아이템 슬롯 높이 + 축소 여백
    const maskWidth = this.panelWidth - 12
    const maskHeight = this.itemSlotSize + 56 // 아이템 하단이 짤리지 않도록 여백 확대
    this.itemsMask.rect(0, 0, maskWidth, maskHeight)
    this.itemsMask.fill()
    this.itemsMask.x = 6
    this.itemsMask.y = 56
    
    this.itemsContainer.mask = this.itemsMask
    
    this.container.addChild(this.itemsMask)
    this.container.addChild(this.itemsContainer)
  }
  
  // close button removed
  
  // 🏠 간단한 1개 아이템 = 1개 배치 시스템
  private async loadItems() {
    if (!this.config.userId) return
    
    try {
      const subCategoryMap = {
        'interior': '가구',
        'decoration': '장식품',
        'vehicle': '운송수단'
      }
      const subCategory = subCategoryMap[this.activeTab]
      
      console.log(`📦 인벤토리 로드:`, {
        activeTab: this.activeTab,
        subCategory: subCategory,
        userId: this.config.userId
      })
      
      // 소유 + 배치 아이템을 동시에 로드
      const [ownedResponse, placedResponse] = await Promise.all([
        fetch(`/api/user-owned-items?userId=${encodeURIComponent(this.config.userId)}&category=인테리어`),
        fetch(`/api/garage-placements?userId=${encodeURIComponent(this.config.userId)}`)
      ])
      
      const ownedItems: InventoryItem[] = []
      const placedItemIds = new Set()
      
      // 소유 아이템 로드
      if (ownedResponse.ok) {
        const ownedData = await ownedResponse.json()
        ownedItems.push(...(ownedData.items || []))
      }
      
      // 배치된 아이템 데이터 처리 (한 번만 json() 호출)
      let placedData = null
      if (placedResponse.ok) {
        placedData = await placedResponse.json()
      }
      
      if (placedData?.success && placedData.placements) {
        placedData.placements.forEach((placement: any) => {
          if (placement.shop_items) {
            // 배치된 아이템 ID 수집
            placedItemIds.add(placement.shop_items.id)
            
            // 완전히 배치된 아이템들 추가 (소유하지 않지만 배치된 경우)
            const item = placement.shop_items
            if (item && !ownedItems.find(owned => owned.id === item.id)) {
              ownedItems.push({
                ...item,
                quantity: 0 // 완전히 배치된 상태
              })
            }
          }
        })
      }
      
      // 아이템 배치 상태 설정
      this.items = ownedItems
        .filter(item => item.sub_category === subCategory)
        .map(item => ({
          ...item,
          isPlaced: placedItemIds.has(item.id)
        }))
      
      console.log(`✅ 인벤토리 로드 완료:`, {
        서브카테고리: subCategory,
        총아이템수: this.items.length,
        배치된수: this.items.filter(item => item.isPlaced).length,
        사용가능수: this.items.filter(item => !item.isPlaced).length
      })
      
      this.renderItems()
    } catch (error) {
      console.error('인벤토리 로드 실패:', error)
    }
  }
  
  private renderItems() {
    // 기존 아이템 슬롯 제거
    this.itemsContainer?.removeChildren()
    this.itemSlots = []
    
    if (!this.itemsContainer) return
    
    // 이미 loadItems에서 필터링된 아이템들 사용
    const filteredItems = this.items
    
    const subCategoryMap = {
      'interior': '가구',
      'decoration': '장식품',
      'vehicle': '운송수단'
    }
    const currentSubCategory = subCategoryMap[this.activeTab]
    
    console.log(`🎨 렌더링: ${filteredItems.length}개 아이템 (서브카테고리: ${currentSubCategory})`)
    
    // 아이템을 마스크 영역 내에 정확히 배치
    const startY = 8 // 상단 여백 축소
    const spacing = 8 // 아이템 간격도 약간 축소
    const padding = 10 // 좌우 패딩 일정하게
    
    // 사용 가능한 폭 계산 (마스크 폭 - 좌우 패딩)
    const availableWidth = this.panelWidth - 12 - (padding * 2)
    const perItem = this.itemSlotSize + spacing
    const dynamicPerRow = Math.max(1, Math.floor((availableWidth + spacing) / perItem))
    const maxItemsToShow = Math.min(filteredItems.length, dynamicPerRow)
    
    const startX = padding // 좌측 패딩 적용
    
    const itemCount = filteredItems.length
    if (itemCount <= maxItemsToShow) {
      // 아이템이 한 줄 수 이하인 경우: 왼쪽부터 채우고 나머지는 빈칸 표시
      for (let i = 0; i < maxItemsToShow; i++) {
        const x = startX + i * (this.itemSlotSize + spacing)
        const y = startY
        if (i < itemCount) {
          const itemSlot = this.createItemSlot(filteredItems[i], x, y)
          this.itemSlots.push(itemSlot)
          this.itemsContainer!.addChild(itemSlot)
        } else {
          const emptySlot = this.createEmptySlot(x, y)
          this.itemsContainer!.addChild(emptySlot)
        }
      }
    } else {
      // 아이템이 더 많은 경우: 모든 아이템을 가로로 배치(드래그 스크롤로 탐색)
      filteredItems.forEach((item, index) => {
        const x = startX + index * (this.itemSlotSize + spacing)
        const y = startY
        const itemSlot = this.createItemSlot(item, x, y)
        this.itemSlots.push(itemSlot)
        this.itemsContainer!.addChild(itemSlot)
      })
    }

    // 컨텐츠 폭을 저장하고 스크롤 초기화
    const contentWidth = Math.max(
      maxItemsToShow * this.itemSlotSize + (maxItemsToShow - 1) * spacing + (padding * 2),
      itemCount * this.itemSlotSize + Math.max(0, itemCount - 1) * spacing + (padding * 2)
    )
    this.scrollX = 0
    this.itemsContainer!.x = 6
    // 드래그 스크롤 이벤트 연결
    this.attachDragScroll(contentWidth, availableWidth)

    // 레이아웃 변경 사항을 즉시 패널 크기에 반영
    this.updatePosition()
  }

  private createEmptySlot(x: number, y: number): PIXI.Graphics {
    const slot = new PIXI.Graphics()
    // 비어있는 슬롯: 연한 테두리만 표시
    slot.stroke({ color: 0x555555, width: 1, alpha: 0.8 })
    slot.rect(0, 0, this.itemSlotSize, this.itemSlotSize)
    slot.stroke()
    slot.x = x
    slot.y = y
    // 비활성 상태(인터랙션 없음)
    slot.eventMode = 'none'
    return slot
  }

  // 가로 드래그 스크롤(모바일/데스크탑 공통)
  private attachDragScroll(contentWidth: number, viewportWidth: number) {
    if (!this.itemsContainer) return
    const maxScroll = Math.max(0, contentWidth - viewportWidth)
    const onPointerDown = (e: PIXI.FederatedPointerEvent) => {
      this.isDragging = true
      this.dragStartX = e.global.x
      this.dragStartContainerX = this.itemsContainer!.x
      e.stopPropagation() // 카메라 컨트롤 차단
    }
    const onPointerMove = (e: PIXI.FederatedPointerEvent) => {
      if (!this.isDragging) return
      const delta = e.global.x - this.dragStartX
      let nextX = this.dragStartContainerX + delta
      // 좌우 경계 클램프 (마스크 좌표 6 기준, 패딩 고려)
      const minX = 6 - maxScroll
      const maxX = 6
      nextX = Math.max(minX, Math.min(maxX, nextX))
      this.itemsContainer!.x = nextX
      e.stopPropagation() // 카메라 컨트롤 차단
    }
    const onPointerUp = (e?: PIXI.FederatedPointerEvent) => {
      this.isDragging = false
      if (e) e.stopPropagation() // 카메라 컨트롤 차단
    }
    // 이벤트 바인딩 (컨테이너 자체에 바인딩)
    this.itemsContainer.eventMode = 'static'
    this.itemsContainer.on('pointerdown', onPointerDown)
    this.itemsContainer.on('pointermove', onPointerMove)
    this.itemsContainer.on('pointerup', onPointerUp)
    this.itemsContainer.on('pointerupoutside', onPointerUp)
    this.itemsContainer.on('pointercancel', onPointerUp)
    // 터치 스크롤 자연스러움 향상: passive 불필요(Pixi 내부 처리)
    
    // 패널 전체에서 카메라 컨트롤 차단
    this.blockCameraControls()
  }
  
  // 🎨 간단한 배치 상태 슬롯 (1개 아이템 = 1개 배치)
  private createItemSlot(item: any, x: number, y: number): PIXI.Container {
    const slot = new PIXI.Container()
    const bg = new PIXI.Graphics()
    
    const isPlaced = item.isPlaced || false
    
    if (isPlaced) {
      // 배치된 아이템: 골드 톤
      bg.fill({ color: 0x3d2f1f, alpha: 0.9 })
      bg.roundRect(0, 0, this.itemSlotSize, this.itemSlotSize, 8)
      bg.fill()
      
      bg.stroke({ color: 0xffd700, width: 2, alpha: 0.8 })
      bg.roundRect(0, 0, this.itemSlotSize, this.itemSlotSize, 8)
      bg.stroke()
      
      bg.fill({ color: 0xffd700, alpha: 0.15 })
      bg.roundRect(2, 2, this.itemSlotSize - 4, this.itemSlotSize - 4, 6)
      bg.fill()
      
    } else {
      // 배치 안된 아이템: 블루 톤
      bg.fill({ color: 0x1e2a44, alpha: 0.95 })
      bg.roundRect(0, 0, this.itemSlotSize, this.itemSlotSize, 8)
      bg.fill()
      
      bg.stroke({ color: 0x3a8dff, width: 2, alpha: 0.9 })
      bg.roundRect(0, 0, this.itemSlotSize, this.itemSlotSize, 8)
      bg.stroke()
      
      bg.fill({ color: 0x3a8dff, alpha: 0.12 })
      bg.roundRect(2, 2, this.itemSlotSize - 4, this.itemSlotSize - 4, 6)
      bg.fill()
      
      // 코너 하이라이트
      bg.fill({ color: 0x3a8dff, alpha: 0.28 })
      bg.circle(4, 4, 2)
      bg.fill()
      bg.circle(this.itemSlotSize - 4, 4, 2)
      bg.fill()
      bg.circle(4, this.itemSlotSize - 4, 2)
      bg.fill()
      bg.circle(this.itemSlotSize - 4, this.itemSlotSize - 4, 2)
      bg.fill()
    }
    
    slot.addChild(bg)
    
    slot.x = x
    slot.y = y
    
    // 🖼️ 아이템 이미지 로드
    this.loadItemTexture(item, slot, isPlaced)
    
    // 🏷️ 배치 상태는 색상으로만 구분
    
    // 슬롯 내부 마스크 추가 (호버 확대로 넘침 방지)
    const slotMask = new PIXI.Graphics()
    slotMask.fill({ color: 0xffffff, alpha: 1 })
    slotMask.rect(0, 0, this.itemSlotSize, this.itemSlotSize)
    slotMask.fill()
    slot.addChild(slotMask)
    slot.mask = slotMask
    
    // 수량 표시 (1개 이상일 때만) - 사이트 디자인 스타일
    if (item.quantity > 1) {
      const quantityText = new PIXI.Text({
        text: item.quantity.toString(),
        style: {
          fontSize: 12, // 사이트 스타일로 더 크게
          fill: 0x00ff88, // 네온 그린 색상
          align: 'right',
          stroke: { color: 0x000000, width: 2 }, // 픽셀 아트 테두리
          fontWeight: 'bold',
          fontFamily: 'monospace' // 픽셀 아트 스타일
        }
      })
      quantityText.anchor.set(1, 0)
      quantityText.x = this.itemSlotSize - 3
      quantityText.y = 3
      
      slot.addChild(quantityText)
    }
    
    // 슬롯 이벤트 (배치된 아이템도 클릭 가능 - 회수용)
    slot.eventMode = 'static'
    if (isPlaced) {
      slot.cursor = 'pointer' // 회수 가능하다는 의미로 포인터 커서
    } else {
      slot.cursor = 'pointer'
    }
    
    // 모든 아이템에 클릭 이벤트 (배치/회수 모두 selectItem에서 처리)
    slot.on('pointerdown', async () => {
      await this.selectItem(item)
    })
    
    // 사이트 디자인 스타일 호버 효과 (활성화된 아이템만)
    if (!isPlaced) {
      slot.on('pointerover', () => {
      bg.clear()
      
      // 호버 시 밝은 배경 (블루 톤)
      bg.fill({ color: 0x243a66, alpha: 0.98 })
      bg.roundRect(0, 0, this.itemSlotSize, this.itemSlotSize, 8)
      bg.fill()
      
      // 호버 시 내부 하이라이트(블루)
      bg.fill({ color: 0x3a8dff, alpha: 0.2 })
      bg.roundRect(2, 2, this.itemSlotSize - 4, this.itemSlotSize - 4, 6)
      bg.fill()
      
      // 호버 시 테두리 (더 밝게)
      bg.stroke({ color: 0x62a7ff, width: 3, alpha: 1.0 })
      bg.roundRect(0, 0, this.itemSlotSize, this.itemSlotSize, 8)
      bg.stroke()
      
      // 호버 시 코너 하이라이트 (더 밝게, 블루)
      bg.fill({ color: 0x62a7ff, alpha: 0.45 })
      bg.circle(4, 4, 2)
      bg.fill()
      bg.circle(this.itemSlotSize - 4, 4, 2)
      bg.fill()
      bg.circle(4, this.itemSlotSize - 4, 2)
      bg.fill()
      bg.circle(this.itemSlotSize - 4, this.itemSlotSize - 4, 2)
      bg.fill()
      
      // 수량 텍스트 다시 추가
      if (item.quantity > 1) {
        const quantityText = new PIXI.Text({
          text: item.quantity.toString(),
          style: {
            fontSize: 12, // 사이트 스타일로 더 크게
            fill: 0x00ff88, // 네온 그린 색상
            align: 'right',
            stroke: { color: 0x000000, width: 2 },
            fontWeight: 'bold',
            fontFamily: 'monospace' // 픽셀 아트 스타일
          }
        })
        quantityText.anchor.set(1, 0)
        quantityText.x = this.itemSlotSize - 3
        quantityText.y = 3
        slot.addChild(quantityText)
      }
    })
    
      slot.on('pointerout', () => {
      bg.clear()
      
      // 기본 상태 복원(블루 톤)
      bg.fill({ color: 0x1e2a44, alpha: 0.95 })
      bg.roundRect(0, 0, this.itemSlotSize, this.itemSlotSize, 8)
      bg.fill()
      
      // 블루 테두리 효과
      bg.stroke({ color: 0x3a8dff, width: 2, alpha: 0.9 })
      bg.roundRect(0, 0, this.itemSlotSize, this.itemSlotSize, 8)
      bg.stroke()
      
      // 내부 하이라이트(블루)
      bg.fill({ color: 0x3a8dff, alpha: 0.12 })
      bg.roundRect(2, 2, this.itemSlotSize - 4, this.itemSlotSize - 4, 6)
      bg.fill()
      
      // 코너 하이라이트 (블루)
      bg.fill({ color: 0x3a8dff, alpha: 0.28 })
      bg.circle(4, 4, 2)
      bg.fill()
      bg.circle(this.itemSlotSize - 4, 4, 2)
      bg.fill()
      bg.circle(4, this.itemSlotSize - 4, 2)
      bg.fill()
      bg.circle(this.itemSlotSize - 4, this.itemSlotSize - 4, 2)
      bg.fill()
      
      // 수량 텍스트 다시 추가
      if (item.quantity > 1) {
        const quantityText = new PIXI.Text({
          text: item.quantity.toString(),
          style: {
            fontSize: 12, // 사이트 스타일로 더 크게
            fill: 0x00ff88, // 네온 그린 색상
            align: 'right',
            stroke: { color: 0x000000, width: 2 }, // 픽셀 아트 테두리
            fontWeight: 'bold',
            fontFamily: 'monospace' // 픽셀 아트 스타일
          }
        })
        quantityText.anchor.set(1, 0)
        quantityText.x = this.itemSlotSize - 3
        quantityText.y = 3
        slot.addChild(quantityText)
      }
    })
    }
    
    return slot
  }
  
  private async loadItemTexture(item: InventoryItem, parent: PIXI.Container, isPlaced: boolean = false) {
    try {
      if (item.image_url) {
        const texture = await PIXI.Assets.load(item.image_url)
        const sprite = new PIXI.Sprite(texture)
        
        // 클래시오브클랜 스타일 이미지 크기 조정
        const maxSize = this.itemSlotSize - 12 // 클래시오브클랜 스타일 여백
        const scale = Math.min(maxSize / texture.width, maxSize / texture.height)
        sprite.scale.set(scale)
        
        // 중앙 정렬
        sprite.anchor.set(0.5, 0.5)
        sprite.x = this.itemSlotSize / 2
        sprite.y = this.itemSlotSize / 2
        
        // 배치 상태에 따른 시각적 효과
        if (isPlaced) {
          // 배치된 아이템: 회색 톤으로 비활성화
          sprite.tint = 0x666666
          sprite.alpha = 0.5
        } else {
          // 활성화된 아이템: 밝고 선명하게
          sprite.tint = 0xffffff
          sprite.alpha = 1.0
        }
        
        parent.addChild(sprite)
      }
    } catch (error) {
      // 이미지 로드 실패시 기본 아이콘 표시
      this.createDefaultItemIcon(parent, item)
    }
  }
  
  private createDefaultItemIcon(parent: PIXI.Container, item: InventoryItem) {
    // 사이트 디자인 스타일 기본 아이콘 (픽셀 아트)
    const iconText = new PIXI.Text({
      text: this.getItemIcon(item.name),
      style: {
        fontSize: 32, // 사이트 스타일로 더 크게
        fill: 0x3a8dff, // 블루 색상
        align: 'center',
        stroke: { color: 0x000000, width: 2 }, // 픽셀 아트 테두리
        fontWeight: 'bold',
        fontFamily: 'monospace' // 픽셀 아트 스타일
      }
    })
    iconText.anchor.set(0.5, 0.5)
    iconText.x = this.itemSlotSize / 2
    iconText.y = this.itemSlotSize / 2
    parent.addChild(iconText)
  }
  
  private getItemIcon(itemName: string): string {
    // 아이템 이름에 따른 아이콘 매핑
    const iconMap: { [key: string]: string } = {
      '침대': '🛏️',
      '의자': '🪑',
      '테이블': '🪑',
      '소파': '🛋️',
      '책장': '📚',
      '화분': '🪴',
      '램프': '💡',
      '거울': '🪞',
      '카펫': '🟫',
      '커튼': '🪟'
    }
    
    // 아이템 이름에서 키워드 찾기
    for (const [key, icon] of Object.entries(iconMap)) {
      if (itemName.includes(key)) {
        return icon
      }
    }
    
    return '📦' // 기본 아이콘
  }
  
  private setFilter(filterKey: string) {
    this.activeFilter = filterKey
    this.updateActiveFilter()
    this.renderItems()
  }
  
  private updateActiveFilter() {
    // 현재 필터 UI 미사용. v8 경고 방지를 위해 아무 작업도 하지 않음.
    if (!this.filterButtons || this.filterButtons.length === 0) return
  }
  
  // 🎮 간단한 아이템 선택 로직 (1개 배치)
  private async selectItem(item: any): Promise<void> {
    const isPlaced = item.isPlaced || false
    
    if (isPlaced) {
      // 배치된 아이템 → 회수
      console.log('🏠 배치된 아이템 회수:', item.name)
      this.recallPlacedItem(item)
    } else {
      // 배치 안된 아이템 → 배치 모드
      console.log('🔵 아이템 배치 모드:', item.name)
      this.selectedItem = item
      
      if ((this.config as any).onItemSelect) {
        await (this.config as any).onItemSelect(item)
        // 배치 모드 진입 시 인벤토리 패널 자동 닫기
        if (this.isVisible) {
          this.hide()
        }
      }
    }
  }
  
  public async refreshItems() {
    await this.loadItems()
  }
  
  // 배치 모드 설정
  public setPlacementMode(isPlacementMode: boolean) {
    this.isPlacementMode = isPlacementMode
    this.updatePosition() // 위치 즉시 업데이트
  }
  
  // 패널 전체에서 카메라 컨트롤 차단
  private blockCameraControls() {
    // 패널 배경에서 이벤트 차단
    if (this.background) {
      this.background.eventMode = 'static'
      this.background.on('pointerdown', (event) => event.stopPropagation())
      this.background.on('pointermove', (event) => event.stopPropagation())
      this.background.on('pointerup', (event) => event.stopPropagation())
      this.background.on('wheel', (event) => event.stopPropagation())
    }
    
    // 컨테이너 전체에서 이벤트 차단
    this.container.eventMode = 'static'
    this.container.on('pointerdown', (event) => event.stopPropagation())
    this.container.on('pointermove', (event) => event.stopPropagation())
    this.container.on('pointerup', (event) => event.stopPropagation())
    this.container.on('wheel', (event) => event.stopPropagation())
  }
  
  public show() {
    this.isVisible = true
    // 패널 높이/마스크 등 최신 상태 반영
    this.updatePosition()
    const screenHeight = this.config.app?.screen?.height || window.innerHeight
    this.targetY = screenHeight - this.panelHeight
    
    console.log('인벤토리 패널 열림')
  }
  
  public hide() {
    this.isVisible = false
    const screenHeight = this.config.app?.screen?.height || window.innerHeight
    this.targetY = screenHeight - 20 // 핸들바만 보이도록
    
    console.log('인벤토리 패널 닫힘')
  }

  // 내부 토글 메서드 (핸들바에서 호출)
  private toggleInventory() {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  // 화면 크기 변경시 호출
  public resize() {
    this.updatePosition()
    
    // 현재 상태에 따라 위치 재설정
    const screenHeight = this.config.app?.screen?.height || window.innerHeight
    if (this.isVisible) {
      this.targetY = screenHeight - this.panelHeight
    } else {
      this.targetY = screenHeight - 20
    }
  }
  
  public update(deltaTime: number) {
    // 상하 슬라이드 애니메이션
    if (Math.abs(this.currentY - this.targetY) > 1) {
      this.currentY += (this.targetY - this.currentY) * this.animationSpeed
      this.container.y = this.currentY
    } else {
      this.container.y = this.targetY
      if (!this.isVisible && this.container.y >= this.config.app.screen.height) {
        this.container.visible = false
      }
    }
  }
  
  // 아이템 배치 상태 관리
  public markItemAsPlaced(itemId: number | string) {
    const id = String(itemId) // 문자열로 통일
    console.log('📦 아이템 배치됨:', { 원본ID: itemId, 변환ID: id, 타입: typeof itemId })
    this.placedItemIds.add(id)
    console.log('📦 현재 배치된 아이템들:', Array.from(this.placedItemIds))
    this.renderItems() // 인벤토리 재렌더링
  }

  public markItemAsRemoved(itemId: number | string) {
    const id = String(itemId) // 문자열로 통일
    console.log('📦 아이템 제거됨:', { 원본ID: itemId, 변환ID: id, 타입: typeof itemId })
    this.placedItemIds.delete(id)
    console.log('📦 현재 배치된 아이템들:', Array.from(this.placedItemIds))
    this.renderItems() // 인벤토리 재렌더링
  }

  public isItemPlaced(itemId: number | string): boolean {
    const id = String(itemId) // 문자열로 통일
    const isPlaced = this.placedItemIds.has(id)
    console.log('🔍 배치 여부 확인:', { 원본ID: itemId, 변환ID: id, 타입: typeof itemId, 배치됨: isPlaced })
    return isPlaced
  }

  // 🏠 간단한 아이템 회수
  private async recallPlacedItem(item: any) {
    console.log('🏠 아이템 회수:', item.name)
    
    if ((this.config as any).onItemRecall) {
      await (this.config as any).onItemRecall(item)
      await this.loadItems() // 회수 후 새로고침
      console.log('✅ 아이템 회수 완료')
      // 즉시 UI 반영
      await this.refreshItems()
    } else {
      console.log('⚠️ onItemRecall 콜백 없음')
      this.markItemAsRemoved(item.id)
    }
  }

  /**
   * 🗑️ 전체 삭제 버튼 생성
   */
  private createClearAllButton() {
    const clearButton = new PIXI.Container()
    
    // 버튼 배경
    const buttonBg = new PIXI.Graphics()
    buttonBg.fill({ color: 0xff4444, alpha: 0.8 })
    buttonBg.roundRect(0, 0, 24, 18, 3)
    buttonBg.fill()
    
    buttonBg.stroke({ color: 0xff8888, width: 1, alpha: 0.8 })
    buttonBg.roundRect(0, 0, 24, 18, 3)
    buttonBg.stroke()
    
    // 삭제 아이콘
    const deleteText = new PIXI.Text({
      text: '🗑️',
      style: {
        fontSize: 10,
        fill: 0xffffff
      }
    })
    deleteText.anchor.set(0.5, 0.5)
    deleteText.x = 12
    deleteText.y = 9
    
    clearButton.addChild(buttonBg, deleteText)
    
    // 위치 (핸들바 오른쪽 끝)
    clearButton.x = this.panelWidth - 30
    clearButton.y = 2
    
    // 이벤트 설정
    clearButton.eventMode = 'static'
    clearButton.cursor = 'pointer'
    
    clearButton.on('pointerdown', async (e: PIXI.FederatedPointerEvent) => {
      e.stopPropagation()
      await this.clearAllPlacements()
    })
    
    clearButton.on('pointerover', () => {
      clearButton.alpha = 1.0
      clearButton.scale.set(1.1)
    })
    
    clearButton.on('pointerout', () => {
      clearButton.alpha = 0.8
      clearButton.scale.set(1.0)
    })
    
    this.container.addChild(clearButton)
    console.log('🗑️ 전체 삭제 버튼 생성 완료')
  }

  /**
   * 🗑️ 모든 배치된 아이템 삭제
   */
  private async clearAllPlacements() {
    if (!this.config.userId) {
      console.error('❌ 사용자 ID가 없어서 삭제할 수 없습니다')
      return
    }

    console.log('🗑️ 모든 배치된 아이템 삭제 시작:', this.config.userId)

    try {
      const response = await fetch(`/api/clear-garage-placements?userId=${encodeURIComponent(this.config.userId)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ 전체 삭제 API 실패:', errorText)
        return
      }

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ 전체 삭제 완료:', result.message, '- 삭제된 개수:', result.deletedCount)
        
        // 인벤토리 새로고침
        await this.loadItems()
        
        // 성공 피드백
        this.showFeedback('모든 배치된 아이템이 인벤토리로 회수되었습니다!', 0x00ff88)
      } else {
        console.error('❌ 전체 삭제 실패:', result.error)
        this.showFeedback('삭제 중 오류가 발생했습니다.', 0xff4444)
      }

    } catch (error) {
      console.error('❌ 전체 삭제 처리 중 오류:', error)
      this.showFeedback('삭제 중 오류가 발생했습니다.', 0xff4444)
    }
  }

  /**
   * 💬 사용자 피드백 표시
   */
  private showFeedback(message: string, color: number) {
    console.log(`💬 ${message}`)
    // TODO: 실제 UI 피드백 추가
  }

  public destroy() {
    this.container.removeChildren()
  }
}
