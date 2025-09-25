// PIXI.js 기반 게임 내부 UI 매니저
import * as PIXI from 'pixi.js'
import { ShopPanel } from './ShopPanel'
import { InventoryPanel } from './InventoryPanel'
import { HUDManager } from './HUDManager'

export interface GameUIManagerConfig {
  app: PIXI.Application
  userId?: string
  // 방문자 모드에서는 인벤토리/상점 패널을 숨김
  visitorMode?: boolean
  onItemPurchase?: (item: any) => Promise<boolean>
  onItemEquip?: (item: any) => Promise<boolean>
  onItemPlace?: (item: any, x: number, y: number) => Promise<boolean>
  onItemSelect?: (item: any) => Promise<void>  // 아이템 선택 시 콜백 추가
  onItemRecall?: (item: any) => Promise<void>  // 🔄 아이템 회수 시 콜백 추가 (async)
  toggleShop?: () => void
  toggleInventory?: () => void
  onFullscreenToggle?: (isFullscreen: boolean) => void  // 🖥️ 전체화면 토글 콜백 추가
}

export class GameUIManager {
  private app: PIXI.Application
  private uiContainer: PIXI.Container
  private shopPanel: ShopPanel | null = null
  public inventoryPanel: InventoryPanel | null = null  // 🏠 새로운 시스템에서 접근 가능하도록 public
  private hudManager: HUDManager | null = null
  private config: GameUIManagerConfig
  
  // UI 상태
  private isShopVisible = false
  private isInventoryVisible = false
  private selectedItem: any = null  // 선택된 아이템 저장
  
  constructor(config: GameUIManagerConfig) {
    this.config = config
    this.app = config.app
    
    // UI 컨테이너 생성 (최상위 레이어)
    this.uiContainer = new PIXI.Container()
    this.uiContainer.zIndex = 100000 // 가장 위에 렌더링
    this.uiContainer.sortableChildren = true
    this.app.stage.sortableChildren = true
    this.app.stage.addChild(this.uiContainer)
    
    this.initializeUI()
  }
  
  private async initializeUI() {
    // HUD 매니저 초기화 (항상 표시되는 UI) - 콜백 함수 전달
    this.hudManager = new HUDManager(
      this.uiContainer, 
      this.config,
      () => this.toggleShop(), // 상점 버튼 클릭 콜백
      () => this.toggleInventory(), // 인벤토리 버튼 클릭 콜백
      (isFullscreen: boolean) => this.handleFullscreenToggle(isFullscreen) // 🖥️ 전체화면 콜백
    )
    
    // 패널 공통 설정: 토글 위임 콜백 주입
    const panelConfig: GameUIManagerConfig = {
      ...this.config,
      toggleShop: () => this.toggleShop(),
      toggleInventory: () => this.toggleInventory(),
      onItemSelect: (item: any) => this.handleItemSelect(item),
      onItemPurchase: (item: any) => this.handleItemPurchase(item)
    }
    
    // 방문자 모드가 아닌 경우에만 패널 생성
    if (!this.config.visitorMode) {
      this.inventoryPanel = new InventoryPanel(this.uiContainer, panelConfig)
      this.shopPanel = new ShopPanel(this.uiContainer, panelConfig)
    }
    
    // 초기 리사이즈 반영
    this.handleResize()
    
    this.setupEvents()
  }
  
  private setupEvents() {
    // 키보드 단축키 설정
    const keyHandler = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'i':
          this.toggleInventory()
          break
        case 's':
          this.toggleShop()
          break
        case 'escape':
          this.closeAllPanels()
          break
      }
    }
    
    // 화면 크기 변경 이벤트
    const resizeHandler = () => {
      this.handleResize()
    }
    
    window.addEventListener('keydown', keyHandler)
    window.addEventListener('resize', resizeHandler)
    
    // 정리 함수에 이벤트 리스너 제거 추가
    this.cleanup = () => {
      window.removeEventListener('keydown', keyHandler)
      window.removeEventListener('resize', resizeHandler)
    }
  }

  // 화면 크기 변경 처리 - 컨테이너 제한 해제 완전 재작성
  private handleResize() {
    // PIXI.js 캔버스 크기 사용 (완전 반응형) - 안전 체크 추가
    const width = this.app?.screen?.width || window.innerWidth
    const height = this.app?.screen?.height || window.innerHeight
    
    console.log(`GameUIManager 화면 크기 변경 (캔버스 반응형): ${width}x${height}`)
    
    // HUD 리사이즈
    if (this.hudManager) {
      this.hudManager.resize(width, height)
    }
    
    // 상점 패널 리사이즈
    if (this.shopPanel) {
      this.shopPanel.resize()
    }
    
    // 인벤토리 패널 리사이즈
    if (this.inventoryPanel) {
      this.inventoryPanel.resize()
    }
  }
  
  // 상점 패널 토글
  public toggleShop() {
    if (this.config.visitorMode) return
    if (this.isShopVisible) {
      this.closeShop()
    } else {
      this.openShop()
    }
  }
  
  // 상점 패널 열기
  public openShop() {
    if (this.config.visitorMode) return
    if (!this.shopPanel) {
      this.shopPanel = new ShopPanel(this.uiContainer, this.config)
    }
    
    this.shopPanel.show()
    this.isShopVisible = true
    
    // 인벤토리가 열려있으면 닫기
    if (this.isInventoryVisible) {
      this.closeInventory()
    }
  }
  
  // 상점 패널 닫기
  public closeShop() {
    if (this.shopPanel) {
      this.shopPanel.hide()
      this.isShopVisible = false
    }
  }
  
  // 인벤토리 패널 토글
  public toggleInventory() {
    if (this.config.visitorMode) return
    if (this.isInventoryVisible) {
      this.closeInventory()
    } else {
      this.openInventory()
    }
  }
  
  // 인벤토리 패널 열기
  public openInventory() {
    if (this.config.visitorMode) return
    if (!this.inventoryPanel) {
      this.inventoryPanel = new InventoryPanel(this.uiContainer, this.config)
    }
    
    this.inventoryPanel.show()
    this.isInventoryVisible = true
    
    // 상점이 열려있으면 닫기
    if (this.isShopVisible) {
      this.closeShop()
    }
    
  }
  
  // 인벤토리 패널 닫기
  public closeInventory() {
    if (this.inventoryPanel) {
      this.inventoryPanel.hide()
      this.isInventoryVisible = false
      
          // 하단 화살표 버튼 관련 코드 제거됨 - 핸들바가 토글 버튼 역할
    }
  }
  
  // 모든 패널 닫기
  public closeAllPanels() {
    this.closeShop()
    this.closeInventory()
  }
  
  // 아이템 구매 처리
  public async handleItemPurchase(item: any): Promise<boolean> {
    if (this.config.onItemPurchase) {
      const success = await this.config.onItemPurchase(item)
      if (success) {
        console.log('✅ 구매 성공! UI 업데이트 중...', item.name)
        
        // 구매 성공시 인벤토리와 상점 모두 새로고침
        const refreshPromises = []
        
        if (this.inventoryPanel) {
          refreshPromises.push(this.inventoryPanel.refreshItems())
        }
        
        if (this.shopPanel) {
          refreshPromises.push(this.shopPanel.refreshItems())
        }
        
        // 두 패널을 동시에 새로고침
        await Promise.all(refreshPromises)
        
        console.log('✅ UI 업데이트 완료!')
      }
      return success
    }
    return false
  }
  
  // 아이템 장착 처리
  public async handleItemEquip(item: any): Promise<boolean> {
    if (this.config.onItemEquip) {
      return await this.config.onItemEquip(item)
    }
    return false
  }
  
  // 아이템 배치 처리
  public async handleItemPlace(item: any, x: number, y: number): Promise<boolean> {
    if (this.config.onItemPlace) {
      const success = await this.config.onItemPlace(item, x, y)
      if (success && this.inventoryPanel) {
        console.log('✅ 아이템 배치 성공, 인벤토리 새로고침:', item.name)
        // 아이템 배치 성공 시 인벤토리 새로고침 (1개 배치 시스템)
        await this.inventoryPanel.refreshItems()
      }
      return success
    }
    return false
  }

  // 아이템 제거 처리
  public handleItemRemove(item: any) {
    if (this.inventoryPanel) {
      // 아이템 제거 시 인벤토리에서 다시 활성화
      this.inventoryPanel.markItemAsRemoved(item.id)
    }
  }

  // 🔄 아이템 회수 처리 (인벤토리에서 비활성화된 아이템 클릭 시)
  public async handleItemRecall(item: any) {
    console.log('🔄 GameUIManager 아이템 회수 처리:', item.name)
    
    if (this.config.onItemRecall) {
      await this.config.onItemRecall(item)
    } else {
      console.log('⚠️ onItemRecall 콜백이 설정되지 않음')
    }
  }

  // 아이템 선택 처리
  public async handleItemSelect(item: any): Promise<void> {
    this.selectedItem = item
    console.log('배치 모드 활성화 - 아이템:', item.name)
    
    // MiniGameEngine에 배치 모드 활성화 알림
    if (this.config.onItemSelect) {
      await this.config.onItemSelect(item)
    }
    
    // 인벤토리 패널 자동 닫기 (선택적)
    // this.closeInventory()
  }
  
  // 선택된 아이템 가져오기
  public getSelectedItem(): any {
    return this.selectedItem
  }
  
  // 인벤토리 패널 배치 모드 설정
  public setInventoryPlacementMode(isPlacementMode: boolean) {
    if (this.inventoryPanel) {
      this.inventoryPanel.setPlacementMode(isPlacementMode)
    }
  }
  
  // 배치 모드 취소
  public cancelPlacementMode() {
    this.selectedItem = null
    console.log('배치 모드 취소됨')
  }
  
  // 업데이트 (애니메이션 등)
  public update(deltaTime: number) {
    if (this.shopPanel) {
      this.shopPanel.update(deltaTime)
    }
    if (this.inventoryPanel) {
      this.inventoryPanel.update(deltaTime)
    }
    if (this.hudManager) {
      this.hudManager.update(deltaTime)
    }
  }
  
  // 정리 함수
  private cleanup?: () => void
  
  public destroy() {
    if (this.cleanup) {
      this.cleanup()
    }
    
    if (this.shopPanel) {
      this.shopPanel.destroy()
    }
    if (this.inventoryPanel) {
      this.inventoryPanel.destroy()
    }
    if (this.hudManager) {
      this.hudManager.destroy()
    }
    
    this.uiContainer.removeChildren()
    this.app.stage.removeChild(this.uiContainer)
  }
  
  // 게터들
  public getShopPanel(): ShopPanel | null {
    return this.shopPanel
  }
  
  public getInventoryPanel(): InventoryPanel | null {
    return this.inventoryPanel
  }
  
  public getHUDManager(): HUDManager | null {
    return this.hudManager
  }
  
  public isShopOpen(): boolean {
    return this.isShopVisible
  }
  
  public isInventoryOpen(): boolean {
    return this.isInventoryVisible
  }

  // 🖥️ 전체화면 토글 처리
  private handleFullscreenToggle(isFullscreen: boolean) {
    console.log('🖥️ GameUIManager - 전체화면 상태:', isFullscreen ? '활성화' : '비활성화')
    
    // 전체화면 상태에 따른 UI 최적화
    if (isFullscreen) {
      // 전체화면 모드: UI 요소들을 더 큰 화면에 맞게 조정
      this.optimizeUIForFullscreen()
    } else {
      // 일반 모드: 기본 UI 크기로 복원
      this.restoreUIFromFullscreen()
    }
    
    // MiniGameEngine에게 전체화면 상태 전달
    if (this.config.onFullscreenToggle) {
      this.config.onFullscreenToggle(isFullscreen)
    }
  }

  // 🖥️ 전체화면 모드 UI 최적화
  private optimizeUIForFullscreen() {
    // 전체화면에서는 UI 요소들이 더 넓은 공간을 활용할 수 있도록 조정
    if (this.shopPanel && typeof (this.shopPanel as any).setFullscreenMode === 'function') {
      // 상점 패널을 더 넓게 표시
      (this.shopPanel as any).setFullscreenMode(true)
    }
    
    if (this.inventoryPanel && typeof (this.inventoryPanel as any).setFullscreenMode === 'function') {
      // 인벤토리 패널을 더 넓게 표시
      (this.inventoryPanel as any).setFullscreenMode(true)
    }
    
    console.log('🖥️ 전체화면 UI 최적화 완료')
  }

  // 🖥️ 전체화면에서 일반 모드로 UI 복원
  private restoreUIFromFullscreen() {
    if (this.shopPanel && typeof (this.shopPanel as any).setFullscreenMode === 'function') {
      (this.shopPanel as any).setFullscreenMode(false)
    }
    
    if (this.inventoryPanel && typeof (this.inventoryPanel as any).setFullscreenMode === 'function') {
      (this.inventoryPanel as any).setFullscreenMode(false)
    }
    
    console.log('🖥️ 일반 모드 UI 복원 완료')
  }
}
