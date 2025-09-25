// PIXI.js 기반 상점 패널 (Animal Crossing 스타일 하단 슬라이드업)
import * as PIXI from 'pixi.js'
import { GameUIManagerConfig } from './GameUIManager'

export interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  sub_category: string
  pixel_data?: any
}

export class ShopPanel {
  private container: PIXI.Container
  private config: GameUIManagerConfig
  
  // 패널 요소들
  private background: PIXI.Graphics | null = null
  private handleBar: PIXI.Graphics | null = null
  private handleBarWrapper: PIXI.Container | null = null
  private connectedHandleLabel: PIXI.Text | null = null
  private connectedHandleHit: PIXI.Graphics | null = null
  private itemsContainer: PIXI.Container | null = null
  private itemsMask: PIXI.Graphics | null = null
  private scrollViewport: PIXI.Container | null = null
  private scrollMask: PIXI.Graphics | null = null
  private viewportBackground: PIXI.Graphics | null = null
  // 닫기 버튼 제거 (핸들바 토글 사용)
  
  // 탭 관련
  private activeTab: 'interior' | 'decoration' | 'vehicle' = 'interior'
  private tabs: Map<string, PIXI.Container> = new Map()
  
  // 아이템 관련
  private items: ShopItem[] = []
  private ownedItemIds: Set<string> = new Set()
  private itemSlots: PIXI.Container[] = []
  private selectedItem: ShopItem | null = null
  private purchasingItemId: string | null = null
  
  // PIXI 토스트 관련
  private toastContainer: PIXI.Container | null = null
  private toastText: PIXI.Text | null = null
  private toastBackground: PIXI.Graphics | null = null
  private toastTimer: number | null = null
  
  // PIXI 토스트 알림 표시
  private showToast(message: string) {
    // 기존 토스트 제거
    this.hideToast()
    
    // 토스트 컨테이너 생성
    this.toastContainer = new PIXI.Container()
    this.toastContainer.zIndex = 1000
    
    // 토스트 배경
    this.toastBackground = new PIXI.Graphics()
    this.toastBackground.fill({ color: 0x1a1a2e, alpha: 0.95 })
    this.toastBackground.stroke({ color: 0x00ff88, width: 2 })
    this.toastBackground.roundRect(0, 0, 200, 40, 8)
    this.toastBackground.fill()
    this.toastBackground.stroke()
    
    // 토스트 텍스트
    this.toastText = new PIXI.Text({
      text: message,
      style: {
        fontSize: 14,
        fill: 0xffffff,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        align: 'center'
      }
    })
    this.toastText.anchor.set(0.5, 0.5)
    this.toastText.x = 100
    this.toastText.y = 20
    
    // 컨테이너에 추가
    this.toastContainer.addChild(this.toastBackground)
    this.toastContainer.addChild(this.toastText)
    
    // 패널 중앙 상단에 위치
    this.toastContainer.x = (this.panelWidth - 200) / 2
    this.toastContainer.y = 20
    
    // 패널에 추가
    this.container.addChild(this.toastContainer)
    
    // 1.5초 후 자동 제거
    this.toastTimer = window.setTimeout(() => {
      this.hideToast()
    }, 1500)
  }
  
  // 토스트 숨기기
  private hideToast() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer)
      this.toastTimer = null
    }
    
    if (this.toastContainer) {
      this.container.removeChild(this.toastContainer)
      this.toastContainer.destroy()
      this.toastContainer = null
      this.toastText = null
      this.toastBackground = null
    }
  }
  
  // 애니메이션 관련
  private isVisible = false
  private targetY = 0
  private currentY = 0
  private animationSpeed = 0.15
  
  // 스타일 설정
  private panelHeight = 300
  private panelWidth = 800
  private readonly itemSlotSize = 80 // 정사각형 아이템 영역 (정돈된 기준치)
  private readonly itemSlotHeight = 132 // 전체 슬롯 높이 (이름 + 아이템 + 가격, 여유 공간 확보)
  private itemsPerRow = 2 // 동적으로 계산됨
  private expectedContentWidth = 0 // 예상 컨텐츠 너비
  private readonly backgroundColor = 0x2a1810 // 따뜻한 브라운
  private readonly borderColor = 0xd4a574     // 골드 브라운
  private readonly tabColor = 0x1a0f08        // 다크 브라운
  private readonly activeTabColor = 0x3d2817  // 밝은 브라운
  private readonly handleColor = 0xd4a574     // 골드 브라운
  
  constructor(parentContainer: PIXI.Container, config: GameUIManagerConfig) {
    this.container = new PIXI.Container()
    this.config = config
    parentContainer.addChild(this.container)
    
    // 핸들바 전용 컨테이너 제거 - 패널과 일체형으로 만들기
    
    this.createPanel()
    this.loadOwnedItems().finally(() => this.loadItems())
    
    // 초기 상태 설정
    this.container.visible = true
    this.isVisible = false
    
    // 안전한 화면 크기 계산
    const screenHeight = this.config.app?.screen?.height || window.innerHeight
    const screenWidth = this.config.app?.screen?.width || window.innerWidth
    
    console.log('ShopPanel 생성 - 화면 크기:', screenWidth, 'x', screenHeight)
    
    // 패널 초기 위치 설정 (핸들바만 보이도록)
    this.container.x = 0
    this.container.y = -this.panelHeight + 20 // 상단에서 핸들바만 보이도록
    this.currentY = this.container.y
    this.targetY = this.container.y
  }
  
  private createPanel() {
    // 패널 배경
    this.background = new PIXI.Graphics()
    this.container.addChild(this.background)
    this.redrawBackground()
    
    // 상단 핸들바 (패널과 일체형)
    this.createHandleBar()
    
    // 탭 시스템 추가
    this.createTabs()
    
    // 아이템 컨테이너 생성
    this.createItemsContainer()
    
    // 초기 위치 설정
    this.updatePosition()
  }

  // 핸들바 생성 (주황색)
  private createHandleBar() {
    this.handleBarWrapper = new PIXI.Container()
    this.handleBarWrapper.eventMode = 'static'
    ;(this.handleBarWrapper as any).cursor = 'pointer'
    
    this.handleBar = new PIXI.Graphics()
    this.handleBar.fill({ color: this.handleColor, alpha: 1.0 })
    this.handleBar.roundRect(0, 0, 200, 20, 3)
    this.handleBar.fill()
    this.handleBarWrapper.addChild(this.handleBar)
    
    const label = new PIXI.Text({
      text: 'Shop',
      style: { fontSize: 8, fill: 0xffffff, fontWeight: 'normal', fontFamily: 'monospace' }
    })
    label.anchor.set(0.5, 0.5)
    label.x = 100
    label.y = 10
    this.handleBarWrapper.addChild(label)
    
    // 패널 하단에 위치 (패널과 일체형)
    this.handleBarWrapper.x = (this.panelWidth - 200) / 2
    this.handleBarWrapper.y = this.panelHeight - 20
    
    this.handleBarWrapper.on('pointerdown', (e) => {
      if (this.config.toggleShop) {
        this.config.toggleShop()
      } else {
        if (this.isVisible) this.hide(); else this.show()
      }
      e.stopPropagation() // 카메라 컨트롤 차단
    })
    
    // 핸들바에서도 wheel 이벤트 차단
    this.handleBarWrapper.on('wheel', (e: PIXI.FederatedWheelEvent) => {
      e.stopPropagation()
    })
    
    // 패널 컨테이너에 직접 추가
    this.container.addChild(this.handleBarWrapper)
    
    console.log('핸들바 생성됨 - 패널과 일체형')
  }

  // 배경 그리기 (클래시오브클랜 스타일)
  private redrawBackground() {
    if (!this.background) return
    
    this.background.clear()
    
    // 외부 테두리 (골드)
    this.background.fill({ color: 0x8b6914, alpha: 1.0 })
    this.background.roundRect(-2, -2, this.panelWidth + 4, this.panelHeight - 18, 12)
    this.background.fill()
    
    // 패널 본체
    this.background.fill({ color: this.backgroundColor, alpha: 0.98 })
    this.background.roundRect(0, 0, this.panelWidth, this.panelHeight - 20, 10)
    this.background.fill()
    
    // 상단 하이라이트 제거 (카테고리 탭 배경 없애기)
  }

  // 캔버스 화면 크기에 맞춰 위치 업데이트 - 완전 반응형 해결책
  private updatePosition() {
    // PIXI.js 캔버스 크기 사용 (완전 반응형) - 안전 체크 추가
    const screenWidth = this.config.app?.screen?.width || window.innerWidth
    const screenHeight = this.config.app?.screen?.height || window.innerHeight
    
    console.log(`ShopPanel 위치 업데이트 (캔버스 반응형): ${screenWidth}x${screenHeight}`)
    
    // 상단 HUD 박스와 동일한 방식으로 캔버스 내부에 딱 맞게 조정
    const maxWidth = screenWidth
    // 최소 패널 높이를 넉넉히 잡아 아이템 하단이 잘리지 않도록 보장
    const minPanelHeight = 20 /*handle*/ + 48 /*tabs+top padding*/ + this.itemSlotHeight + 56 /*bottom padding*/
    const maxHeight = Math.max(minPanelHeight, Math.floor(screenHeight * 0.7))
    
    // 패널 크기 조정
    if (maxWidth !== this.panelWidth || maxHeight !== this.panelHeight) {
      this.panelWidth = maxWidth
      this.panelHeight = maxHeight
      
      // 배경 다시 그리기
      this.redrawBackground()
      // 마스크도 갱신
      if (this.itemsMask) {
        this.itemsMask.clear()
        this.itemsMask.fill({ color: 0xffffff, alpha: 1 })
        this.itemsMask.rect(0, 0, this.panelWidth - 24, this.panelHeight - 60) // 하단 여백 축소로 표시 영역 확대
        this.itemsMask.fill()
      }
      // 핸들바 위치 재조정
      if (this.handleBarWrapper) {
        this.handleBarWrapper.x = (this.panelWidth - 200) / 2
        this.handleBarWrapper.y = this.panelHeight - 20
      }
      // 탭 위치 재조정 (반응형)
      this.updateTabPositions()
    }
    
    // 위에서 아래로 슬라이드 (상단 기준)
    const targetX = 0
    const targetY = this.isVisible ? 0 : -this.panelHeight + 20 // 핸들바만 보이도록
    
    this.container.x = targetX
    this.container.y = targetY
    this.currentY = this.container.y
    this.targetY = this.container.y
    
    // 디버그 로그 추가
    console.log(`ShopPanel 위치: ${targetX}, ${targetY}, visible: ${this.isVisible}`)
  }
  
  // 탭 시스템 생성
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
    
    // 탭 위치 설정 (패널 상단)
    tab.y = 8 // 패널 상단
    
    // 탭 배경
    bg.fill({ color: isActive ? this.activeTabColor : this.tabColor, alpha: 0.9 })
    bg.roundRect(0, 0, width, height, 6)
    bg.fill()
    
    // 탭 테두리
    bg.stroke({ color: 0xd4a574, width: isActive ? 2 : 1, alpha: isActive ? 1 : 0.6 })
    bg.roundRect(0, 0, width, height, 6)
    bg.stroke()
    
    tab.addChild(bg)
    
    // 탭 텍스트
    const text = new PIXI.Text({
      text: label,
      style: {
        fontSize: 10,
        fill: isActive ? 0xffd700 : 0xc0c0c0,
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
    tab.on('pointerdown', (e) => {
      this.switchTab(key as any)
      e.stopPropagation() // 카메라 컨트롤 차단
    })
    
    // 탭에서도 wheel 이벤트 차단
    tab.on('wheel', (e: PIXI.FederatedWheelEvent) => {
      e.stopPropagation()
    })
    
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
    console.log('🔄 탭 변경:', { 이전탭: this.activeTab, 새탭: tab })
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
      bg.fill({ color: isActive ? this.activeTabColor : this.tabColor, alpha: 0.9 })
      bg.roundRect(0, 0, 80, 24, 6) // 탭 크기 통일
      bg.fill()
      bg.stroke({ color: 0xd4a574, width: isActive ? 2 : 1, alpha: isActive ? 1 : 0.6 })
      bg.roundRect(0, 0, 80, 24, 6)
      bg.stroke()
      
      // 텍스트 스타일 업데이트
      text.style.fill = isActive ? 0xffd700 : 0xc0c0c0
      text.style.fontWeight = isActive ? 'bold' : 'normal'
    })
  }
  
  private createItemsContainer() {
    // 스크롤 전용 뷰포트 컨테이너와 마스크 생성
    this.scrollViewport = new PIXI.Container()
    this.scrollViewport.x = 12 // 패널 테두리와 시각적 여백 확보
    this.scrollViewport.y = 56 // 탭 아래로 충분한 간격(탭 높이 24 + 여백 확대)
    
    this.scrollMask = new PIXI.Graphics()
    this.updateScrollMask() // 현재 패널 크기에 맞춘 마스크 적용
    this.scrollViewport.mask = this.scrollMask

    // 시각적 영역 표시용 배경
    this.viewportBackground = new PIXI.Graphics()
    this.updateViewportBackground()
    this.scrollViewport.addChild(this.viewportBackground)
    
    // 실제 아이템들을 담는 내부 컨테이너 (스크롤 대상)
    this.itemsContainer = new PIXI.Container()
    this.itemsContainer.x = 0
    this.itemsContainer.y = 0
    
    // 계층 추가: 마스크 -> 뷰포트 -> 아이템컨테이너
    this.container.addChild(this.scrollMask)
    this.scrollViewport.addChild(this.itemsContainer)
    this.container.addChild(this.scrollViewport)
    
    // 가로 스크롤 이벤트 추가
    this.attachHorizontalScroll()
    
    // 카메라 컨트롤 차단
    this.blockCameraControls()
  }
  
  // 가로 스크롤 기능 추가 (PIXI.js 올바른 드래그 스크롤 패턴)
  private attachHorizontalScroll() {
    if (!this.itemsContainer || !this.scrollViewport) return
    
    let isDragging = false
    let startX = 0
    let containerStartX = 0
    let dragThreshold = 5 // 드래그 시작 임계값 (픽셀)
    let hasMoved = false
    
    // 아이템 컨테이너를 인터랙티브하게 설정
    this.scrollViewport.eventMode = 'static'
    this.scrollViewport.cursor = 'grab'
    // 뷰포트 크기에 맞춘 hitArea 설정 (마스크 영역과 동일)
    const viewportWidth = Math.max(0, (this.panelWidth - 24))
    const viewportHeight = Math.max(0, this.panelHeight - 96)
    this.scrollViewport.hitArea = new PIXI.Rectangle(0, 0, viewportWidth, viewportHeight)
    
    console.log('📦 아이템 컨테이너 설정:', {
      eventMode: this.itemsContainer.eventMode,
      cursor: this.itemsContainer.cursor,
      hitArea: this.itemsContainer.hitArea,
      interactive: this.itemsContainer.eventMode === 'static'
    })
    
    // 드래그 시작 (itemsContainer에서)
    const startDrag = (e: PIXI.FederatedPointerEvent) => {
      isDragging = true
      hasMoved = false
      startX = e.global.x
      containerStartX = this.itemsContainer!.x
      this.scrollViewport!.cursor = 'grabbing'
      
      console.log('🎯 상점패널 드래그 시작!', { startX, containerStartX, 예상너비: this.expectedContentWidth })
      e.stopPropagation()
    }
    
    // 드래그 중 (전역에서 처리 - 중요!)
    const onDragMove = (e: PIXI.FederatedPointerEvent) => {
      if (!isDragging || !this.itemsContainer) return
      
      const dx = e.global.x - startX
      
      // 드래그 임계값 체크
      if (!hasMoved && Math.abs(dx) < dragThreshold) return
      hasMoved = true
      
      const newX = containerStartX + dx
      
      // 스크롤 범위 계산 (예상 너비 사용)
      const containerWidth = this.expectedContentWidth || this.itemsContainer.width
      const viewportWidthLocal = this.panelWidth - 24 // 마스크 너비
      
      console.log('스크롤 계산:', { 
        실제컨테이너너비: this.itemsContainer.width,
        예상컨테이너너비: this.expectedContentWidth,
        사용너비: containerWidth,
        viewportWidth, 
        newX 
      })
      
      if (containerWidth > viewportWidthLocal) {
        const maxScroll = containerWidth - viewportWidthLocal
        const minX = -maxScroll   // 왼쪽 한계: 컨텐츠가 왼쪽으로만 이동
        const maxX = 0            // 오른쪽 한계: 0을 넘지 않음
        const clampedX = Math.max(minX, Math.min(maxX, newX))
        this.itemsContainer.x = clampedX
        
        console.log('스크롤 적용:', { minX, maxX, clampedX })
      } else {
        this.itemsContainer.x = 0
        console.log('스크롤 불필요 - 기본 위치 유지')
      }
      
      e.stopPropagation()
    }
    
    // 드래그 종료 (전역에서 처리)
    const stopDrag = (e?: PIXI.FederatedPointerEvent) => {
      if (!isDragging) return
      
      isDragging = false
      hasMoved = false
      this.itemsContainer!.cursor = 'grab'
      
      console.log('드래그 종료')
      if (e) e.stopPropagation()
    }
    
    // 이벤트 바인딩 - 더 강력하게
    this.scrollViewport.on('pointerdown', startDrag)
    
    // 전역 이벤트로 처리 (더 넓은 범위)
    this.container.on('pointermove', onDragMove)
    this.container.on('pointerup', stopDrag)
    this.container.on('pointerupoutside', stopDrag)
    this.container.on('pointercancel', stopDrag)
    
    // 추가: 패널 배경에서도 드래그 가능하게
    if (this.background) {
      this.background.on('pointermove', onDragMove)
      this.background.on('pointerup', stopDrag)
    }
    
    console.log('🔧 드래그 이벤트 바인딩 완료!')
    
    // 간단한 클릭 테스트
    this.scrollViewport.on('click', () => {
      console.log('✅ 아이템 컨테이너 클릭 감지됨!')
    })
    
    // wheel 이벤트 차단
    this.scrollViewport.on('wheel', (e: PIXI.FederatedWheelEvent) => {
      e.stopPropagation()
    })
  }

  // 현재 패널 크기에 맞춰 스크롤 마스크 갱신
  private updateScrollMask() {
    const horizontalPadding = 24
    const verticalPadding = 96 // 상단/하단 여백을 넉넉히 확보
    const maskWidth = Math.max(0, this.panelWidth - horizontalPadding)
    const maskHeight = Math.max(0, this.panelHeight - verticalPadding)
    if (!this.scrollMask) this.scrollMask = new PIXI.Graphics()
    this.scrollMask.clear()
    this.scrollMask.fill({ color: 0xffffff, alpha: 1 })
    this.scrollMask.rect(this.scrollViewport ? this.scrollViewport.x : 12, this.scrollViewport ? this.scrollViewport.y : 34, maskWidth, maskHeight)
    this.scrollMask.fill()
  }

  // 스크롤 뷰포트 배경 갱신 (영역 가시화)
  private updateViewportBackground() {
    if (!this.scrollViewport) return
    const width = Math.max(0, this.panelWidth - 24)
    const height = Math.max(0, this.panelHeight - 96)
    if (!this.viewportBackground) this.viewportBackground = new PIXI.Graphics()
    this.viewportBackground.clear()
    // 반투명 다크 브라운 배경 + 골드 라인으로 영역 가시화
    this.viewportBackground.fill({ color: 0x1f120c, alpha: 0.35 })
    this.viewportBackground.roundRect(0, 0, width, height, 8)
    this.viewportBackground.fill()
    this.viewportBackground.stroke({ color: 0x8b6914, width: 1, alpha: 0.6 })
    this.viewportBackground.roundRect(0.5, 0.5, width - 1, height - 1, 8)
    this.viewportBackground.stroke()
    // 배경은 아이템 아래로 깔리도록 맨 아래에 유지
    if (this.itemsContainer && this.scrollViewport.children.indexOf(this.viewportBackground) > this.scrollViewport.children.indexOf(this.itemsContainer)) {
      this.scrollViewport.setChildIndex(this.viewportBackground, 0)
    }
  }
  
  // 닫기 버튼 제거 (핸들바로 대체)
  
  private async loadItems() {
    try {
      // 탭에 따라 서브카테고리 변경 (실제 DB 구조에 맞춤)
      const subCategoryMap = {
        'interior': '가구',
        'decoration': '장식품', 
        'vehicle': '운송수단'
      }
      const subCategory = subCategoryMap[this.activeTab]
      
      console.log('🏪 상점 아이템 로드:', {
        activeTab: this.activeTab,
        subCategory: subCategory,
        url: `/api/items?sub_category=${encodeURIComponent(subCategory)}`
      })
      
      // 모든 인테리어 아이템을 가져온 후 프론트엔드에서 필터링
      const response = await fetch('/api/items?category=인테리어')
      
      if (response.ok) {
        const data = await response.json()
        const allItems = data.items || []
        
        // 서브카테고리로 필터링
        this.items = allItems.filter((item: any) => item.sub_category === subCategory)
        
        console.log('📦 로드된 아이템:', {
          서브카테고리: subCategory,
          전체아이템수: allItems.length,
          필터링된아이템수: this.items.length,
          아이템목록: this.items.map(item => ({ name: item.name, category: item.category, sub_category: item.sub_category }))
        })
        
        this.renderItems()
      } else {
        console.error('API 응답 실패:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('아이템 로드 실패:', error)
    }
  }

  // 보유 아이템 로드 (중복 구매 방지/표시용)
  private async loadOwnedItems() {
    try {
      if (!this.config.userId) return
      const base = `/api/user-owned-items?userId=${encodeURIComponent(this.config.userId)}`
      const categories = ['인테리어', '장식품', '운송수단']
      const reqs = categories.map((c) =>
        fetch(`${base}&category=${encodeURIComponent(c)}`)
          .then((r) => (r.ok ? r.json() : { items: [] }))
          .catch(() => ({ items: [] }))
      )
      const results = await Promise.all(reqs)
      const merged = results.flatMap((r: any) => r.items || []) as { id: string }[]
      this.ownedItemIds = new Set(merged.map((it) => it.id))
    } catch (_) {
      // 실패해도 표시는 계속 진행
    }
  }
  
  private renderItems() {
    // 기존 아이템 슬롯 제거
    this.itemsContainer?.removeChildren()
    this.itemSlots = []
    
    if (!this.itemsContainer) return
    
    // 중앙 정렬: 전체 컨텐츠 너비를 계산 후 가운데 배치
    // 큐브 시각 균형을 위한 여백/간격
    const spacingX = 14
    const itemWidth = this.itemSlotSize + spacingX
    const maskWidth = this.panelWidth - 24
    const totalContentWidth = (this.items.length * itemWidth)
    const startX = Math.max(10, Math.floor((maskWidth - totalContentWidth) / 2)) // 좌우 중앙 정렬, 최소 10px 보장
    const startY = 16 // 탭과 첫 줄 아이템 간격
    const spacingY = 18 // 아이템 줄 간 세로 간격
    
    // 수평 스크롤을 위해 모든 아이템을 1줄로 배치
    this.itemsPerRow = this.items.length // 모든 아이템을 1줄에
    
    // 스크롤 필요성 계산을 위해 재사용
    
    // 예상 너비 저장
    this.expectedContentWidth = Math.max(totalContentWidth, maskWidth)
    
    console.log('수평 스크롤 계산:', {
      panelWidth: this.panelWidth,
      maskWidth,
      itemWidth,
      아이템수: this.items.length,
      totalContentWidth,
      스크롤필요: totalContentWidth > maskWidth
    })
    
    this.items.forEach((item, index) => {
      const row = Math.floor(index / this.itemsPerRow)
      const col = index % this.itemsPerRow
      
      const x = startX + col * (this.itemSlotSize + spacingX)
      const y = startY + row * (this.itemSlotHeight + spacingY)
      
      console.log(`아이템 ${index} 위치:`, {
        col,
        x,
        y,
        계산된_오른쪽끝: x + this.itemSlotSize
      })
      
      const itemSlot = this.createItemSlot(item, x, y)
      this.itemSlots.push(itemSlot)
      this.itemsContainer!.addChild(itemSlot)
    })
    
    // 스크롤 디버그 정보
    setTimeout(() => {
      if (this.itemsContainer) {
        const containerWidth = this.itemsContainer.width
        const viewportWidth = this.panelWidth - 24
        
        // 강제로 컨테이너 너비 설정 (PIXI.js 자동 계산이 잘못될 수 있음)
        const expectedWidth = Math.max(totalContentWidth, maskWidth)
        
        console.log('상점 패널 스크롤 정보:', {
          아이템수: this.items.length,
          컨테이너너비: containerWidth,
          예상너비: expectedWidth,
          뷰포트너비: viewportWidth,
          스크롤필요_현재: containerWidth > viewportWidth,
          스크롤필요_예상: expectedWidth > viewportWidth,
          itemsPerRow: this.itemsPerRow
        })
        
        // 컨테이너 너비가 예상보다 작으면 강제 설정
        if (containerWidth < expectedWidth) {
          console.log('컨테이너 너비 강제 설정:', expectedWidth)
          // 투명한 사각형을 추가해서 컨테이너 크기 확장
          const expandRect = new PIXI.Graphics()
          expandRect.fill({ color: 0x000000, alpha: 0 })
          expandRect.rect(0, 0, expectedWidth, 1)
          expandRect.fill()
          this.itemsContainer.addChild(expandRect)
        }
      }
    }, 100)
  }
  
  private createItemSlot(item: ShopItem, x: number, y: number): PIXI.Container {
    const slot = new PIXI.Container()
    const bg = new PIXI.Graphics()
    
    // 클래시오브클랜 스타일 슬롯 배경
    // 외부 골드 테두리
    bg.fill({ color: 0x8b6914, alpha: 0.8 })
    bg.roundRect(-2, -2, this.itemSlotSize + 4, this.itemSlotHeight + 4, 8)
    bg.fill()
    
    // 내부 배경
    bg.fill({ color: 0x3d2817, alpha: 0.95 })
    bg.roundRect(0, 0, this.itemSlotSize, this.itemSlotHeight, 6)
    bg.fill()
    
    // 상단 하이라이트 (이름 영역)
    bg.fill({ color: 0xffffff, alpha: 0.1 })
    bg.roundRect(2, 2, this.itemSlotSize - 4, 25, 4)
    bg.fill()
    
    slot.addChild(bg)
    
    slot.x = x
    slot.y = y
    
    // 아이템 이름 (상단)
    const nameText = new PIXI.Text({
      text: item.name,
      style: {
        fontSize: 11,
        fill: 0xffffff,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        wordWrap: true,
        wordWrapWidth: this.itemSlotSize - 12,
        align: 'center'
      }
    })
    nameText.anchor.set(0.5, 0.5)
    nameText.x = this.itemSlotSize / 2
    nameText.y = 14
    slot.addChild(nameText)
    
    // 아이템 이미지 (중앙)
    this.loadItemTexture(item, slot, bg)
    
    // 가격 표시 (하단 버튼 스타일)
    const priceButton = new PIXI.Graphics()
    const isOwned = this.ownedItemIds.has(item.id)
    const buttonY = this.itemSlotHeight - 36
    
    if (isOwned) {
      // 소유중 표시
      priceButton.fill({ color: 0x4a4a4a, alpha: 0.9 })
      priceButton.roundRect(5, buttonY, this.itemSlotSize - 10, 25, 12)
      priceButton.fill()
      
      const ownedText = new PIXI.Text({
        text: 'Owned',
        style: {
          fontSize: 12,
          fill: 0xaaaaaa,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }
      })
      ownedText.anchor.set(0.5, 0.5)
      ownedText.x = this.itemSlotSize / 2
      ownedText.y = buttonY + 12.5
      slot.addChild(priceButton)
      slot.addChild(ownedText)
      
      slot.eventMode = 'none'
    } else {
      // 구매 버튼
      const isProcessing = this.purchasingItemId === item.id
      const buttonColor = isProcessing ? 0x6b6b6b : 0x4caf50
      const buttonAlpha = isProcessing ? 0.85 : 0.92
      priceButton.fill({ color: buttonColor, alpha: buttonAlpha })
      priceButton.roundRect(5, buttonY, this.itemSlotSize - 10, 25, 12)
      priceButton.fill()
      
      // 버튼 하이라이트 (로딩 중에는 제거)
      if (!isProcessing) {
        priceButton.fill({ color: 0xffffff, alpha: 0.2 })
        priceButton.roundRect(7, buttonY + 2, this.itemSlotSize - 14, 10, 10)
        priceButton.fill()
      }
      
      const priceText = new PIXI.Text({
        text: isProcessing ? '구매중…' : `📦 ${item.price}`,
        style: {
          fontSize: 12,
          fill: 0xffffff,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          stroke: { color: isProcessing ? 0x444444 : 0x2e7d32, width: 1 }
        }
      })
      priceText.anchor.set(0.5, 0.5)
      priceText.x = this.itemSlotSize / 2
      priceText.y = buttonY + 12.5
      // 구매 버튼을 별도 컨테이너로 만들어서 클릭 이벤트 처리
      const buyButtonContainer = new PIXI.Container()
      buyButtonContainer.addChild(priceButton)
      buyButtonContainer.addChild(priceText)
      buyButtonContainer.x = 0
      buyButtonContainer.y = 0
      
      // 구매 버튼만 클릭 가능하게 설정 (로딩 중 비활성화)
      if (isProcessing) {
        buyButtonContainer.eventMode = 'none'
        buyButtonContainer.cursor = 'default'
      } else {
        buyButtonContainer.eventMode = 'static'
        buyButtonContainer.cursor = 'pointer'
        buyButtonContainer.on('pointerdown', (e) => {
          console.log('구매 버튼 클릭:', item.name)
          this.selectItem(item)
          e.stopPropagation() // 드래그 방지
        })
      }
      
      slot.addChild(buyButtonContainer)
      
      // 슬롯 전체는 드래그 가능하게 설정 (구매 버튼 제외)
      slot.eventMode = 'static'
      slot.cursor = 'grab' // 드래그 가능 표시
      
      // wheel 이벤트 차단
      slot.on('wheel', (e: PIXI.FederatedWheelEvent) => {
        e.stopPropagation()
      })
      
      // 더블클릭은 제거 (구매 버튼만 사용)
      
      // 호버 효과
      slot.on('pointerover', () => {
        bg.clear()
        // 호버시 밝은 배경
        bg.fill({ color: 0xb8860b, alpha: 0.9 })
        bg.roundRect(-2, -2, this.itemSlotSize + 4, this.itemSlotHeight + 4, 8)
        bg.fill()
        bg.fill({ color: 0x4d3827, alpha: 0.95 })
        bg.roundRect(0, 0, this.itemSlotSize, this.itemSlotHeight, 6)
        bg.fill()
        bg.fill({ color: 0xffffff, alpha: 0.15 })
        bg.roundRect(2, 2, this.itemSlotSize - 4, 25, 4)
        bg.fill()
        
        slot.scale.set(1.05)
      })
      
      slot.on('pointerout', () => {
        bg.clear()
        // 기본 상태로 복원
        bg.fill({ color: 0x8b6914, alpha: 0.8 })
        bg.roundRect(-2, -2, this.itemSlotSize + 4, this.itemSlotHeight + 4, 8)
        bg.fill()
        bg.fill({ color: 0x3d2817, alpha: 0.95 })
        bg.roundRect(0, 0, this.itemSlotSize, this.itemSlotHeight, 6)
        bg.fill()
        bg.fill({ color: 0xffffff, alpha: 0.1 })
        bg.roundRect(2, 2, this.itemSlotSize - 4, 25, 4)
        bg.fill()
        
        slot.scale.set(1.0)
      })
    }
    
    return slot
  }
  
  private async loadItemTexture(item: ShopItem, slot: PIXI.Container, bg: PIXI.Graphics) {
    try {
      if (item.image_url) {
        const texture = await PIXI.Assets.load(item.image_url)
        const sprite = new PIXI.Sprite(texture)
        
        // 큐브 형태로 이미지 표시 (일정 비율 유지)
    const cubeSize = 56 // 큐브 크기
    const cubeY = 34 // 아래 버튼과 간격 확보 위해 살짝 위로
        
        // 큐브 배경 그리기
        const cubeBg = new PIXI.Graphics()
        cubeBg.fill({ color: 0x2a1a10, alpha: 0.8 })
        cubeBg.roundRect((this.itemSlotSize - cubeSize) / 2, cubeY, cubeSize, cubeSize, 4)
        cubeBg.fill()
        cubeBg.stroke({ color: 0x8b6914, width: 1 })
        cubeBg.roundRect((this.itemSlotSize - cubeSize) / 2, cubeY, cubeSize, cubeSize, 4)
        cubeBg.stroke()
        slot.addChild(cubeBg)
        
        // 이미지를 큐브 안에 맞춤 (비율 유지, 확대 없음)
        const padding = 6
        const maxSize = cubeSize - padding * 2
        const scale = Math.min(maxSize / texture.width, maxSize / texture.height, 1) // 1보다 크면 확대하지 않음
        sprite.scale.set(scale)
        
        // 중앙 정렬
        sprite.anchor.set(0.5, 0.5)
        sprite.x = this.itemSlotSize / 2
        sprite.y = cubeY + cubeSize / 2
        
        slot.addChild(sprite)
      }
    } catch (error) {
      // 이미지 로드 실패시 기본 아이콘 표시
      this.createDefaultItemIcon(slot, item)
    }
  }
  
  private createDefaultItemIcon(slot: PIXI.Container, item: ShopItem) {
    // 큐브 형태로 기본 아이콘 표시
    const cubeSize = 50
    const cubeY = 35
    
    // 큐브 배경
    const cubeBg = new PIXI.Graphics()
    cubeBg.fill({ color: 0x2a1a10, alpha: 0.8 })
    cubeBg.roundRect((this.itemSlotSize - cubeSize) / 2, cubeY, cubeSize, cubeSize, 4)
    cubeBg.fill()
    cubeBg.stroke({ color: 0x8b6914, width: 1 })
    cubeBg.roundRect((this.itemSlotSize - cubeSize) / 2, cubeY, cubeSize, cubeSize, 4)
    cubeBg.stroke()
    slot.addChild(cubeBg)
    
    const iconText = new PIXI.Text({
      text: this.getItemIcon(item.name),
      style: {
        fontSize: 28,
        fill: 0xd4a574,
        align: 'center',
        fontWeight: 'bold'
      }
    })
    iconText.anchor.set(0.5, 0.5)
    iconText.x = this.itemSlotSize / 2
    iconText.y = cubeY + cubeSize / 2
    slot.addChild(iconText)
  }

  private getItemIcon(name: string): string {
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
      '커튼': '🪟',
      '그림': '🖼️',
      '시계': '🕐',
      '꽃': '🌸',
      '나무': '🌳',
      '자동차': '🚗',
      '오토바이': '🏍️',
      '자전거': '🚲',
      '트럭': '🚚'
    }
    
    // 아이템 이름에서 키워드 찾기
    for (const [key, icon] of Object.entries(iconMap)) {
      if (name.includes(key)) {
        return icon
      }
    }
    
    // 카테고리별 기본 아이콘
    if (this.activeTab === 'vehicle') return '🚗'
    if (this.activeTab === 'decoration') return '🎨'
    return '🏠' // 인테리어 기본
  }
  
  private selectItem(item: ShopItem) {
    this.selectedItem = item
    // 중복 클릭 방지 및 로딩 상태 표시
    if (this.purchasingItemId) return
    this.purchasingItemId = item.id
    this.renderItems()

    // 구매 처리 (GameUIManager로 위임)
    if (this.config.onItemPurchase) {
      // 중복 구매 방지
      if (this.ownedItemIds.has(item.id)) return
      this.config.onItemPurchase(item)
        ?.then((ok) => {
          if (ok) {
            // 성공 시 즉시 소유 상태 반영
            this.ownedItemIds.add(item.id)
          } else {
            this.showToast('포인트 박스가 부족합니다')
          }
        })
        .finally(() => {
          this.purchasingItemId = null
          this.renderItems()
        })
    }
  }
  
  // 상점 아이템 새로고침 (구매 후 호출)
  public async refreshItems() {
    await this.loadOwnedItems()
    this.loadItems()
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
    this.targetY = 0 // 화면 상단에 완전히 표시
    
    console.log('상점 패널 열림')
  }
  
  public hide() {
    this.isVisible = false
    this.targetY = -this.panelHeight + 20 // 핸들바만 보이도록
    
    console.log('상점 패널 닫힘')
  }

  // 화면 크기 변경시 호출
  public resize() {
    this.updatePosition()
    // 마스크 업데이트
    this.updateScrollMask()
    this.updateViewportBackground()
    
    // 현재 상태에 따라 위치 재설정
    if (this.isVisible) {
      this.targetY = 0
    } else {
      this.targetY = -this.panelHeight + 20
    }
  }
  
  public update(deltaTime: number) {
    // 슬라이드 애니메이션
    if (Math.abs(this.currentY - this.targetY) > 1) {
      this.currentY += (this.targetY - this.currentY) * this.animationSpeed
      this.container.y = this.currentY
    } else {
      this.container.y = this.targetY
      if (!this.isVisible && this.container.y <= -this.panelHeight) {
        this.container.visible = false
      }
    }
  }
  
  public destroy() {
    // 토스트 정리
    this.hideToast()
    this.container.removeChildren()
  }
}
