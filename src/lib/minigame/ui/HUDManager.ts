// PIXI.js 기반 HUD 매니저 (상단 UI 요소들)
import * as PIXI from 'pixi.js'
import { GameUIManagerConfig } from './GameUIManager'

export class HUDManager {
  private container: PIXI.Container
  private config: GameUIManagerConfig
  
  // HUD 요소들
  private topBar: PIXI.Container | null = null
  private shopButton: PIXI.Container | null = null
  private inventoryButton: PIXI.Container | null = null
  private moneyDisplay: PIXI.Text | null = null
  // 🖥️ 전체화면 버튼 (DOM 기반으로 변경)
  private fullscreenDOMButton: HTMLButtonElement | null = null
  private isFullscreen: boolean = false
  
  // 콜백 함수들
  private onShopClick?: () => void
  private onInventoryClick?: () => void
  private onFullscreenToggle?: (isFullscreen: boolean) => void
  
  // 스타일 설정
  private readonly buttonSize = 60
  private readonly buttonSpacing = 10
  private readonly topBarHeight = 80
  private readonly backgroundColor = 0x1a1a2e
  private readonly buttonColor = 0x00ff88
  private readonly textColor = 0xffffff
  
  // Material Design 스타일 화살표 버튼 설정
  private readonly arrowButtonSize = 40
  private readonly arrowButtonRadius = 20
  
  constructor(
    parentContainer: PIXI.Container, 
    config: GameUIManagerConfig, 
    onShopClick?: () => void, 
    onInventoryClick?: () => void,
    onFullscreenToggle?: (isFullscreen: boolean) => void
  ) {
    this.container = new PIXI.Container()
    this.config = config
    this.onShopClick = onShopClick
    this.onInventoryClick = onInventoryClick
    this.onFullscreenToggle = onFullscreenToggle
    parentContainer.addChild(this.container)
    
    this.createHUD()
    this.initializeFullscreenAPI()
  }
  
  private createHUD() {
    // 🖥️ DOM 기반 전체화면 버튼 생성
    this.createDOMFullscreenButton()
  }
  
  private createTopBar() {
    this.topBar = new PIXI.Container()
    
    // 배경 생성
    const background = new PIXI.Graphics()
    background.fill({ color: this.backgroundColor, alpha: 0.9 })
    background.rect(0, 0, this.config.app.screen.width, this.topBarHeight)
    background.fill()
    
    // 테두리 생성
    const border = new PIXI.Graphics()
    border.stroke({ color: this.buttonColor, width: 2 })
    border.rect(0, 0, this.config.app.screen.width, this.topBarHeight)
    border.stroke()
    
    this.topBar.addChild(background)
    this.topBar.addChild(border)
    this.topBar.zIndex = 1
    
    this.container.addChild(this.topBar)
  }
  
  private createButtons() {
    const buttonY = (this.topBarHeight - this.buttonSize) / 2
    
    // 상점 버튼 제거 (상단 핸들바로 대체)
    this.shopButton = null
    
    // 인벤토리 버튼 생성 (하단 화살표 버튼으로 대체되므로 숨김)
    this.inventoryButton = this.createButton('🎒', 0x2ecc71)
    this.inventoryButton.x = this.buttonSpacing + this.buttonSize + this.buttonSpacing
    this.inventoryButton.y = buttonY
    this.inventoryButton.zIndex = 2
    this.inventoryButton.visible = false // 하단 화살표 버튼으로 대체되므로 숨김
    
    // 인벤토리 버튼 이벤트 (비활성화)
    this.inventoryButton.eventMode = 'static'
    ;(this.inventoryButton as any).cursor = 'pointer'
    this.inventoryButton.on('pointerdown', () => {
      this.onInventoryButtonClick()
    })
    
    // 상점 버튼은 추가하지 않음
    this.container.addChild(this.inventoryButton)
  }
  
  private createButton(icon: string, color: number): PIXI.Container {
    const container = new PIXI.Container()
    container.eventMode = 'static'
    
    // 버튼 배경과 테두리는 Graphics로 그리되, Container의 자식으로 추가
    const background = new PIXI.Graphics()
    background.fill({ color: color, alpha: 0.8 })
    background.rect(0, 0, this.buttonSize, this.buttonSize)
    background.fill()
    
    const border = new PIXI.Graphics()
    border.stroke({ color: this.buttonColor, width: 2 })
    border.rect(0, 0, this.buttonSize, this.buttonSize)
    border.stroke()
    
    // 아이콘 텍스트 (Pixi v8 권장 방식)
    const iconText = new PIXI.Text({
      text: icon,
      style: {
        fontSize: 24,
        fill: this.textColor,
        align: 'center'
      }
    })
    iconText.anchor.set(0.5, 0.5)
    iconText.x = this.buttonSize / 2
    iconText.y = this.buttonSize / 2
    
    container.addChild(background)
    container.addChild(border)
    container.addChild(iconText)
    
    // 호버 효과: 배경/테두리만 재그리기
    container.on('pointerover', () => {
      background.clear()
      background.fill({ color: color, alpha: 1.0 })
      background.rect(0, 0, this.buttonSize, this.buttonSize)
      background.fill()
      border.clear()
      border.stroke({ color: this.buttonColor, width: 3 })
      border.rect(0, 0, this.buttonSize, this.buttonSize)
      border.stroke()
    })
    
    container.on('pointerout', () => {
      background.clear()
      background.fill({ color: color, alpha: 0.8 })
      background.rect(0, 0, this.buttonSize, this.buttonSize)
      background.fill()
      border.clear()
      border.stroke({ color: this.buttonColor, width: 2 })
      border.rect(0, 0, this.buttonSize, this.buttonSize)
      border.stroke()
    })
    
    return container
  }
  
  private createMoneyDisplay() {
    // 돈 표시 텍스트
    this.moneyDisplay = new PIXI.Text({
      text: '💰 0',
      style: {
        fontSize: 20,
        fill: this.textColor,
        align: 'right',
        stroke: { color: 0x000000, width: 1 }
      }
    })
    this.moneyDisplay.anchor.set(1, 0.5)
    this.moneyDisplay.x = this.config.app.screen.width - this.buttonSpacing
    this.moneyDisplay.y = this.topBarHeight / 2
    this.moneyDisplay.zIndex = 2
    
    this.container.addChild(this.moneyDisplay)
  }
  
  private onShopButtonClick() {
    // 시각적 피드백
    this.animateButtonClick(this.shopButton!)
    
    // 콜백 함수 호출
    if (this.onShopClick) {
      this.onShopClick()
    }
  }
  
  private onInventoryButtonClick() {
    // 시각적 피드백
    this.animateButtonClick(this.inventoryButton!)
    
    // 콜백 함수 호출
    if (this.onInventoryClick) {
      this.onInventoryClick()
    }
  }
  
  private animateButtonClick(button: PIXI.Container) {
    // 클릭 애니메이션
    const originalScale = button.scale.x
    button.scale.set(originalScale * 0.9)
    
    setTimeout(() => {
      button.scale.set(originalScale)
    }, 100)
  }
  
  // 하단 화살표 버튼 생성
  // 하단 화살표 버튼 제거됨 - 핸들바가 토글 버튼 역할
  
  // 돈 표시 업데이트
  public updateMoney(amount: number) {
    if (this.moneyDisplay) {
      this.moneyDisplay.text = `💰 ${amount.toLocaleString()}`
    }
  }
  
  // 하단 화살표 버튼 관련 메서드 제거됨 - 핸들바가 토글 버튼 역할
  
  // 화면 크기 변경시 리사이즈
  public resize(width: number, height: number) {
    if (this.topBar) {
      // 상단 바 크기 조정
      const background = this.topBar.children[0] as PIXI.Graphics
      const border = this.topBar.children[1] as PIXI.Graphics
      
      background.clear()
      background.fill({ color: this.backgroundColor, alpha: 0.9 })
      background.rect(0, 0, width, this.topBarHeight)
      background.fill()
      
      border.clear()
      border.stroke({ color: this.buttonColor, width: 2 })
      border.rect(0, 0, width, this.topBarHeight)
      border.stroke()
    }
    
    if (this.moneyDisplay) {
      // 돈 표시가 화면을 벗어나지 않도록 조정
      this.moneyDisplay.x = Math.max(this.buttonSpacing, width - this.buttonSpacing - 100)
    }
    
    // 하단 화살표 버튼 관련 코드 제거됨 - 핸들바가 토글 버튼 역할

    // 버튼들이 화면을 벗어나지 않도록 조정
    if (this.shopButton && this.inventoryButton) {
      const totalButtonWidth = this.buttonSize * 2 + this.buttonSpacing
      const availableWidth = width - (this.buttonSpacing * 2)
      
      if (totalButtonWidth > availableWidth) {
        // 버튼 크기 축소 (최소 50% 크기 유지)
        const scale = Math.max(0.5, availableWidth / totalButtonWidth)
        this.shopButton.scale.set(scale)
        this.inventoryButton.scale.set(scale)
        
        // 위치 재조정 (화면 경계 내에서)
        this.shopButton.x = this.buttonSpacing
        this.inventoryButton.x = Math.min(
          width - this.buttonSpacing - (this.buttonSize * scale),
          this.buttonSpacing + (this.buttonSize * scale) + this.buttonSpacing
        )
      } else {
        // 원래 크기 유지
        this.shopButton.scale.set(1)
        this.inventoryButton.scale.set(1)
        
        this.shopButton.x = this.buttonSpacing
        this.inventoryButton.x = this.buttonSpacing + this.buttonSize + this.buttonSpacing
      }
    }
    
    // 🖥️ DOM 전체화면 버튼 위치 업데이트
    this.updateDOMButtonPosition()
  }
  
  public update(deltaTime: number) {
    // HUD 업데이트 로직 (필요시)
  }
  
  // 🖥️ DOM 기반 전체화면 버튼 생성 (사용자 제스처 보장)
  private createDOMFullscreenButton() {
    try {
      // DOM 버튼 생성
      this.fullscreenDOMButton = document.createElement('button')
      this.fullscreenDOMButton.innerHTML = '⛶'
      
      // 🎮 게임 전용 버튼 스타일링
      Object.assign(this.fullscreenDOMButton.style, {
        position: 'absolute',  // fixed에서 absolute로 변경
        bottom: '5px',
        right: '5px',
        width: '25px',
        height: '25px',
        backgroundColor: 'rgba(26, 26, 46, 0.95)', // 약간 더 불투명하게
        border: '1px solid #00ff88',
        borderRadius: '4px',
        color: 'white',
        fontSize: '10px',
        fontWeight: 'bold',
        cursor: 'pointer',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)', // 게임에서 더 잘 보이도록
        outline: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        pointerEvents: 'auto' // 게임 위에서도 클릭 가능하도록
      })
      
      // 호버 효과
      this.fullscreenDOMButton.addEventListener('mouseenter', () => {
        if (this.fullscreenDOMButton) {
          this.fullscreenDOMButton.style.backgroundColor = 'rgba(42, 42, 62, 1.0)'
          this.fullscreenDOMButton.style.borderWidth = '1px'
          this.fullscreenDOMButton.style.transform = 'scale(1.05)'
        }
      })
      
      this.fullscreenDOMButton.addEventListener('mouseleave', () => {
        if (this.fullscreenDOMButton) {
          this.fullscreenDOMButton.style.backgroundColor = 'rgba(26, 26, 46, 0.9)'
          this.fullscreenDOMButton.style.borderWidth = '1px'
          this.fullscreenDOMButton.style.transform = 'scale(1.0)'
        }
      })
      
      // 클릭 이벤트 (네이티브 DOM 이벤트로 사용자 제스처 보장)
      this.fullscreenDOMButton.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        this.handleFullscreenClick()
      })
      
      // 터치 이벤트 지원 (모바일)
      this.fullscreenDOMButton.addEventListener('touchstart', (event) => {
        event.preventDefault()
        if (this.fullscreenDOMButton) {
          this.fullscreenDOMButton.style.backgroundColor = 'rgba(42, 42, 62, 1.0)'
          this.fullscreenDOMButton.style.transform = 'scale(0.95)'
        }
      })
      
      this.fullscreenDOMButton.addEventListener('touchend', (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (this.fullscreenDOMButton) {
          this.fullscreenDOMButton.style.backgroundColor = 'rgba(26, 26, 46, 0.9)'
          this.fullscreenDOMButton.style.transform = 'scale(1.0)'
        }
        this.handleFullscreenClick()
      })
      
      // 🎮 게임 캔버스 컨테이너에 추가
      const canvasElement = this.config.app.canvas
      const canvasParent = canvasElement?.parentElement
      
      if (canvasParent) {
        // 캔버스 부모 요소를 relative로 설정하여 absolute positioning이 작동하도록
        if (canvasParent.style.position !== 'absolute' && canvasParent.style.position !== 'fixed') {
          canvasParent.style.position = 'relative'
        }
        canvasParent.appendChild(this.fullscreenDOMButton)
        console.log('🎮 게임 캔버스 컨테이너에 전체화면 버튼 추가 완료')
      } else {
        // fallback: body에 추가하고 fixed positioning 사용
        this.fullscreenDOMButton.style.position = 'fixed'
        document.body.appendChild(this.fullscreenDOMButton)
        console.log('🖥️ Document body에 전체화면 버튼 추가 완료 (fallback)')
      }
      
    } catch (error) {
      console.error('❌ DOM 전체화면 버튼 생성 실패:', error)
    }
  }

  // 🎮 게임 캔버스 전체화면 버튼 위치 업데이트
  private updateDOMButtonPosition() {
    if (!this.fullscreenDOMButton) return
    
    // 캔버스 컨테이너에 있는 경우 relative positioning 사용
    const canvasElement = this.config.app.canvas
    const canvasParent = canvasElement?.parentElement
    
    if (canvasParent && this.fullscreenDOMButton.parentElement === canvasParent) {
      // 캔버스 컨테이너 내부에서 상대적 위치 (이미 absolute로 설정됨)
      this.fullscreenDOMButton.style.bottom = '5px'
      this.fullscreenDOMButton.style.right = '5px'
      console.log('🎮 게임 캔버스 내부 버튼 위치 업데이트')
    } else {
      // fallback: fixed positioning으로 절대 위치 계산
      if (canvasElement) {
        const canvasRect = canvasElement.getBoundingClientRect()
        this.fullscreenDOMButton.style.position = 'fixed'
        this.fullscreenDOMButton.style.left = `${canvasRect.right - 75}px`
        this.fullscreenDOMButton.style.top = `${canvasRect.bottom - 60}px`
        console.log('🖥️ Fixed positioning으로 버튼 위치 업데이트')
      }
    }
  }

  // 🖥️ Fullscreen API 초기화 (DOM 버튼용)
  private initializeFullscreenAPI() {
    // 전체화면 상태 변경 감지 (모든 브라우저 지원)
    const fullscreenChangeEvents = [
      'fullscreenchange',
      'webkitfullscreenchange', 
      'mozfullscreenchange',
      'MSFullscreenChange'
    ]
    
    fullscreenChangeEvents.forEach(eventName => {
      document.addEventListener(eventName, () => {
        const currentFullscreen = this.isCurrentlyFullscreen()
        this.isFullscreen = currentFullscreen
        this.updateDOMFullscreenIcon()
        
        // 🎮 게임 캔버스 전체화면 상태에 따른 최적화/복원
        if (currentFullscreen) {
          // 전체화면으로 변경됨 - 캔버스 최적화
          setTimeout(() => this.optimizeCanvasForFullscreen(), 100)
        } else {
          // 전체화면에서 나옴 - 캔버스 복원
          setTimeout(() => this.restoreCanvasFromFullscreen(), 100)
        }
        
        if (this.onFullscreenToggle) {
          this.onFullscreenToggle(currentFullscreen)
        }
        
        console.log('🎮 게임 캔버스 전체화면 상태 변경:', currentFullscreen ? '활성화' : '비활성화')
      })
    })
    
    // 모바일 방향 변경 감지
    if (typeof window !== 'undefined' && 'orientation' in window) {
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.handleOrientationChange()
        }, 100)
      })
    }
  }

  // 🖥️ 전체화면 클릭 핸들러 (DOM 이벤트로 사용자 제스처 완전 보장)
  private handleFullscreenClick() {
    console.log('🖥️ 전체화면 버튼 클릭 감지')
    
    // 전체화면 API 지원 확인
    if (!this.isFullscreenSupported()) {
      console.warn('⚠️ 이 브라우저는 전체화면 API를 지원하지 않습니다')
      this.showUserFeedback('전체화면이 지원되지 않는 브라우저입니다')
      return
    }

    // Document 상태 확인
    if (!document || !document.documentElement) {
      console.error('❌ Document가 준비되지 않음')
      return
    }

    // 즉시 실행으로 사용자 제스처 보장
    try {
      const isCurrentlyFullscreen = this.isCurrentlyFullscreen()
      
      if (!isCurrentlyFullscreen) {
        console.log('🖥️ 전체화면 진입 시도')
        this.enterFullscreenSafely()
      } else {
        console.log('🖥️ 전체화면 종료 시도')
        this.exitFullscreenSafely()
      }
    } catch (error) {
      console.error('❌ 전체화면 처리 중 예외:', error)
      this.showUserFeedback('전체화면 전환에 실패했습니다')
    }
  }

  // 🖥️ 전체화면 API 지원 확인 (강화된 버전)
  private isFullscreenSupported(): boolean {
    if (!document || !document.documentElement) return false
    
    const element = document.documentElement as any
    const hasFullscreenAPI = !!(
      element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.mozRequestFullScreen ||
      element.msRequestFullscreen
    )
    
    const hasExitAPI = !!(
      document.exitFullscreen ||
      (document as any).webkitExitFullscreen ||
      (document as any).mozCancelFullScreen ||
      (document as any).msExitFullscreen
    )
    
    return hasFullscreenAPI && hasExitAPI
  }

  // 🎮 게임 캔버스가 전체화면인지 확인 (브라우저별 호환)
  private isCurrentlyFullscreen(): boolean {
    const canvasElement = this.config.app.canvas
    if (!canvasElement) return false
    
    const fullscreenElement = 
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    
    // 게임 캔버스가 전체화면 요소인지 확인
    return fullscreenElement === canvasElement
  }

  // 🖥️ 사용자 피드백 표시
  private showUserFeedback(message: string) {
    // 간단한 Toast 알림 (3초 후 자동 사라짐)
    const toast = document.createElement('div')
    toast.textContent = message
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '80px',
      right: '12px',
      backgroundColor: 'rgba(255, 100, 100, 0.9)',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 'bold',
      zIndex: '10001',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      animation: 'fadeInOut 3s ease-in-out'
    })
    
    // CSS 애니메이션 스타일 추가
    if (!document.getElementById('fullscreen-toast-style')) {
      const style = document.createElement('style')
      style.id = 'fullscreen-toast-style'
      style.textContent = `
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: translateY(20px); }
          10%, 90% { opacity: 1; transform: translateY(0); }
        }
      `
      document.head.appendChild(style)
    }
    
    document.body.appendChild(toast)
    
    // 3초 후 제거
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 3000)
  }

  // 🎮 게임 캔버스만 전체화면 진입 (권한 체크 강화)
  private enterFullscreenSafely() {
    // 🎮 게임 캔버스 요소를 전체화면으로 만들기
    const canvasElement = this.config.app.canvas as any
    
    if (!canvasElement) {
      console.error('❌ 게임 캔버스를 찾을 수 없습니다')
      this.showUserFeedback('게임 캔버스를 찾을 수 없습니다')
      return
    }
    
    // 사용자 제스처 내에서 즉시 실행
    try {
      if (canvasElement.requestFullscreen) {
        const promise = canvasElement.requestFullscreen({ navigationUI: 'hide' })
        if (promise) {
          promise
            .then(() => {
              console.log('✅ 게임 캔버스 전체화면 진입 성공')
              this.showUserFeedback('🎮 게임 전체화면 모드 활성화!')
              this.optimizeCanvasForFullscreen()
            })
            .catch((error: any) => {
              console.error('❌ 게임 캔버스 전체화면 진입 실패:', error.name, error.message)
              this.handleFullscreenError(error)
            })
        }
      } else if (canvasElement.webkitRequestFullscreen) {
        // Safari/WebKit 지원
        canvasElement.webkitRequestFullscreen()
        console.log('✅ WebKit 게임 캔버스 전체화면 요청 완료')
        setTimeout(() => this.optimizeCanvasForFullscreen(), 100)
      } else if (canvasElement.mozRequestFullScreen) {
        // Firefox 지원
        canvasElement.mozRequestFullScreen()
        console.log('✅ Firefox 게임 캔버스 전체화면 요청 완료')
        setTimeout(() => this.optimizeCanvasForFullscreen(), 100)
      } else if (canvasElement.msRequestFullscreen) {
        // Edge/IE 지원
        canvasElement.msRequestFullscreen()
        console.log('✅ Edge 게임 캔버스 전체화면 요청 완료')
        setTimeout(() => this.optimizeCanvasForFullscreen(), 100)
      } else {
        throw new Error('전체화면 API가 지원되지 않습니다')
      }

      // 📱 모바일 가로모드 요청 (성공 후에만 실행)
      setTimeout(() => {
        this.requestLandscapeOrientationSafely()
      }, 200)
      
    } catch (error) {
      console.error('❌ 게임 캔버스 전체화면 진입 예외:', error)
      this.handleFullscreenError(error as Error)
    }
  }

  // 🎮 게임 캔버스 전체화면 최적화 (화면 전체 꽉 채우기)
  private optimizeCanvasForFullscreen() {
    try {
      const canvasElement = this.config.app.canvas as HTMLCanvasElement
      if (!canvasElement) return

      // 🎮 캔버스가 화면 전체를 완전히 꽉 채우도록 설정
      canvasElement.style.width = '100vw'
      canvasElement.style.height = '100vh'
      canvasElement.style.objectFit = 'cover' // 화면 전체를 꽉 채우기 (비율 무시)
      canvasElement.style.backgroundColor = '#87ceeb'
      canvasElement.style.position = 'absolute'
      canvasElement.style.top = '0'
      canvasElement.style.left = '0'
      canvasElement.style.margin = '0'
      canvasElement.style.padding = '0'
      
      // 📱 강제 가로모드 전환 (즉시 실행)
      this.forceScreenOrientation()
      
      // 전체화면에서 캔버스 크기 재조정 (가로모드 기준)
      const screenWidth = Math.max(screen.width || window.innerWidth, screen.height || window.innerHeight)
      const screenHeight = Math.min(screen.width || window.innerWidth, screen.height || window.innerHeight)
      
      // 🎮 PIXI 렌더러를 가로모드 전체화면 크기로 조정
      if (this.config.app && this.config.app.renderer) {
        this.config.app.renderer.resize(screenWidth, screenHeight)
        console.log('🎮 가로모드 전체화면 캔버스 크기 조정:', { width: screenWidth, height: screenHeight })
      }

      // 🎮 전체화면 모드에서 버튼 위치 조정
      if (this.fullscreenDOMButton) {
        this.fullscreenDOMButton.style.position = 'fixed'
        this.fullscreenDOMButton.style.right = '5px'
        this.fullscreenDOMButton.style.bottom = '5px'
        this.fullscreenDOMButton.style.left = 'auto'
        this.fullscreenDOMButton.style.top = 'auto'
        this.fullscreenDOMButton.style.zIndex = '20000'
        console.log('🎮 전체화면 모드 버튼 위치 조정')
      }

      // 📱 가로모드 고정 (다시 한번 확인)
      setTimeout(() => {
        this.forceScreenOrientation()
      }, 300)

    } catch (error) {
      console.error('❌ 게임 캔버스 전체화면 최적화 오류:', error)
    }
  }

  // 📱 강제 화면 방향 전환 (가로모드)
  private forceScreenOrientation() {
    try {
      console.log('📱 강제 가로모드 전환 시도')
      
      // 📱 CSS로 화면 방향 강제 설정
      document.body.style.transform = ''
      document.body.style.transformOrigin = ''
      
      // 세로모드인 경우 강제로 가로모드 스타일 적용
      const isPortrait = window.innerHeight > window.innerWidth
      
      if (isPortrait) {
        console.log('📱 세로모드 감지 → 가로모드로 강제 전환')
        
        // CSS transform으로 90도 회전 + 크기 조정
        const rotateAngle = 90
        document.body.style.transform = `rotate(${rotateAngle}deg)`
        document.body.style.transformOrigin = 'center center'
        document.body.style.width = `${window.innerHeight}px`
        document.body.style.height = `${window.innerWidth}px`
        document.body.style.position = 'absolute'
        document.body.style.top = '0'
        document.body.style.left = '0'
        
        // 캔버스도 회전에 맞게 조정
        const canvasElement = this.config.app.canvas as HTMLCanvasElement
        if (canvasElement) {
          canvasElement.style.width = '100vh'
          canvasElement.style.height = '100vw'
        }
      }
      
      // 최신 Screen Orientation API 시도
      this.requestLandscapeOrientationSafely()
      
    } catch (error) {
      console.warn('📱 강제 가로모드 전환 실패:', error)
    }
  }

  // 🎮 게임 캔버스 전체화면 종료
  private exitFullscreenSafely() {
    try {
      if (document.exitFullscreen) {
        const promise = document.exitFullscreen()
        if (promise) {
          promise
            .then(() => {
              console.log('✅ 게임 캔버스 전체화면 종료 성공')
              this.restoreCanvasFromFullscreen()
            })
            .catch((error: any) => {
              console.error('❌ 게임 캔버스 전체화면 종료 실패:', error.name, error.message)
            })
        }
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen()
        console.log('✅ WebKit 게임 캔버스 전체화면 종료 완료')
        setTimeout(() => this.restoreCanvasFromFullscreen(), 100)
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen()
        console.log('✅ Firefox 게임 캔버스 전체화면 종료 완료')
        setTimeout(() => this.restoreCanvasFromFullscreen(), 100)
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen()
        console.log('✅ Edge 게임 캔버스 전체화면 종료 완료')
        setTimeout(() => this.restoreCanvasFromFullscreen(), 100)
      }

      // 📱 모바일 방향 제한 해제
      setTimeout(() => {
        this.unlockOrientationSafely()
      }, 200)
      
    } catch (error) {
      console.error('❌ 게임 캔버스 전체화면 종료 예외:', error)
    }
  }

  // 🎮 게임 캔버스를 일반 모드로 복원
  private restoreCanvasFromFullscreen() {
    try {
      const canvasElement = this.config.app.canvas as HTMLCanvasElement
      if (!canvasElement) return

      // 🎮 강제 회전 CSS 복원
      document.body.style.transform = ''
      document.body.style.transformOrigin = ''
      document.body.style.width = ''
      document.body.style.height = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      
      // 캔버스 스타일을 원래대로 복원
      canvasElement.style.width = '100%'
      canvasElement.style.height = '100%'
      canvasElement.style.objectFit = 'initial'
      canvasElement.style.position = ''
      canvasElement.style.top = ''
      canvasElement.style.left = ''
      canvasElement.style.margin = ''
      canvasElement.style.padding = ''
      
      // 원래 컨테이너 크기로 복원
      const parentElement = canvasElement.parentElement
      if (parentElement) {
        const parentRect = parentElement.getBoundingClientRect()
        
        // PIXI 렌더러 크기를 원래대로 복원
        if (this.config.app && this.config.app.renderer) {
          this.config.app.renderer.resize(parentRect.width, parentRect.height)
          console.log('🎮 게임 캔버스 크기 복원:', { width: parentRect.width, height: parentRect.height })
        }
      }

      // 🎮 일반 모드에서 버튼 위치 복원
      if (this.fullscreenDOMButton) {
        // 캔버스 컨테이너 내부로 다시 이동
        const canvasParent = canvasElement.parentElement
        if (canvasParent && this.fullscreenDOMButton.parentElement !== canvasParent) {
          canvasParent.appendChild(this.fullscreenDOMButton)
        }
        
        // 원래 위치와 스타일로 복원
        this.fullscreenDOMButton.style.position = 'absolute'
        this.fullscreenDOMButton.style.right = '5px'
        this.fullscreenDOMButton.style.bottom = '5px'
        this.fullscreenDOMButton.style.left = 'auto'
        this.fullscreenDOMButton.style.top = 'auto'
        this.fullscreenDOMButton.style.zIndex = '10000'
        console.log('🎮 일반 모드 버튼 위치 복원')
      }

      // 📱 화면 방향 제한 해제
      this.unlockOrientationSafely()

      console.log('🎮 게임 캔버스 및 화면 방향 완전 복원 완료')

    } catch (error) {
      console.error('❌ 게임 캔버스 복원 오류:', error)
    }
  }

  // 🖥️ 전체화면 오류 처리
  private handleFullscreenError(error: Error) {
    const errorName = error.name || 'UnknownError'
    const errorMessage = error.message || '알 수 없는 오류'
    
    switch (errorName) {
      case 'NotAllowedError':
        this.showUserFeedback('전체화면이 차단되었습니다. 브라우저 설정을 확인해주세요')
        break
      case 'NotSupportedError':
        this.showUserFeedback('전체화면이 지원되지 않는 환경입니다')
        break
      case 'InvalidStateError':
        this.showUserFeedback('이미 전체화면 상태입니다')
        break
      case 'TypeError':
        if (errorMessage.includes('Permissions check failed')) {
          this.showUserFeedback('권한이 필요합니다. 다시 시도해주세요')
        } else {
          this.showUserFeedback('전체화면 전환에 실패했습니다')
        }
        break
      default:
        this.showUserFeedback(`전체화면 오류: ${errorMessage}`)
        break
    }
  }

  // 📱 안전한 가로모드 요청 (호환성 강화)
  private requestLandscapeOrientationSafely() {
    try {
      // 데스크톱에서는 orientation lock 건너뛰기
      if (this.isDesktopDevice()) {
        console.log('📱 데스크톱 환경에서는 가로모드 전환을 생략합니다')
        return
      }

      // 최신 Screen Orientation API 시도
      if (this.hasModernOrientationAPI()) {
        this.tryModernOrientationLock()
        return
      }

      // 구형 Orientation API 시도
      if (this.hasLegacyOrientationAPI()) {
        this.tryLegacyOrientationLock()
        return
      }

      console.log('📱 이 디바이스는 화면 방향 잠금을 지원하지 않습니다')
      
    } catch (error) {
      console.warn('📱 가로모드 전환 실패 (무시됨):', (error as Error).name)
      // orientation lock 실패는 치명적이지 않으므로 조용히 처리
    }
  }

  // 📱 안전한 방향 제한 해제
  private unlockOrientationSafely() {
    try {
      if (this.isDesktopDevice()) return

      // 최신 API 시도
      if (this.hasModernOrientationAPI()) {
        (screen.orientation as any).unlock()
        console.log('📱 방향 제한 해제 (최신 API)')
        return
      }

      // 구형 API 시도
      if (this.hasLegacyOrientationAPI()) {
        const screenAny = (window.screen as any)
        if (screenAny.unlockOrientation) {
          screenAny.unlockOrientation()
        } else if (screenAny.mozUnlockOrientation) {
          screenAny.mozUnlockOrientation()
        } else if (screenAny.msUnlockOrientation) {
          screenAny.msUnlockOrientation()
        }
        console.log('📱 방향 제한 해제 (레거시 API)')
      }
      
    } catch (error) {
      console.warn('📱 방향 제한 해제 실패 (무시됨):', (error as Error).name)
    }
  }

  // 📱 최신 Orientation API 지원 확인
  private hasModernOrientationAPI(): boolean {
    return typeof screen !== 'undefined' && 
           'orientation' in screen && 
           screen.orientation &&
           'lock' in screen.orientation &&
           'unlock' in screen.orientation
  }

  // 📱 구형 Orientation API 지원 확인
  private hasLegacyOrientationAPI(): boolean {
    if (typeof window === 'undefined' || !window.screen) return false
    
    const screenAny = window.screen as any
    return !!(
      screenAny.lockOrientation || 
      screenAny.mozLockOrientation || 
      screenAny.msLockOrientation
    )
  }

  // 📱 최신 Orientation API 잠금 시도
  private async tryModernOrientationLock() {
    try {
      await (screen.orientation as any).lock('landscape')
      console.log('📱 가로모드 전환 완료 (최신 API)')
    } catch (error) {
      const err = error as Error
      if (err.name === 'NotSupportedError') {
        console.log('📱 이 디바이스는 화면 방향 잠금을 지원하지 않습니다')
      } else {
        console.warn('📱 가로모드 전환 실패:', err.name)
      }
    }
  }

  // 📱 구형 Orientation API 잠금 시도
  private tryLegacyOrientationLock() {
    try {
      const screenAny = (window.screen as any)
      let success = false

      if (screenAny.lockOrientation) {
        success = screenAny.lockOrientation('landscape')
      } else if (screenAny.mozLockOrientation) {
        success = screenAny.mozLockOrientation('landscape')  
      } else if (screenAny.msLockOrientation) {
        success = screenAny.msLockOrientation('landscape')
      }

      if (success) {
        console.log('📱 가로모드 전환 완료 (레거시 API)')
      } else {
        console.log('📱 가로모드 전환 실패 (레거시 API)')
      }
    } catch (error) {
      console.warn('📱 레거시 가로모드 API 실패:', error)
    }
  }

  // 📱 데스크톱 환경 감지
  private isDesktopDevice(): boolean {
    return !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // 🖥️ DOM 전체화면 아이콘 업데이트
  private updateDOMFullscreenIcon() {
    if (!this.fullscreenDOMButton) return
    
    try {
      const currentFullscreen = this.isCurrentlyFullscreen()
      const newIcon = currentFullscreen ? '🗗' : '⛶'  // 전체화면: 축소, 일반: 확대
      
      if (this.fullscreenDOMButton.innerHTML !== newIcon) {
        this.fullscreenDOMButton.innerHTML = newIcon
        this.isFullscreen = currentFullscreen
        console.log('🖥️ 전체화면 아이콘 업데이트:', newIcon, currentFullscreen ? '(전체화면)' : '(일반화면)')
      }
    } catch (error) {
      console.warn('⚠️ DOM 전체화면 아이콘 업데이트 실패:', error)
    }
  }

  // 📱 방향 변경 처리
  private handleOrientationChange() {
    // 전체화면 상태에서만 가로모드 유지
    if (this.isFullscreen) {
      this.requestLandscapeOrientationSafely()
    }
  }

  public destroy() {
    try {
      // DOM 전체화면 버튼 정리
      if (this.fullscreenDOMButton && this.fullscreenDOMButton.parentNode) {
        this.fullscreenDOMButton.parentNode.removeChild(this.fullscreenDOMButton)
        this.fullscreenDOMButton = null
        console.log('🖥️ DOM 전체화면 버튼 정리 완료')
      }

      // Toast 스타일 정리
      const toastStyle = document.getElementById('fullscreen-toast-style')
      if (toastStyle && toastStyle.parentNode) {
        toastStyle.parentNode.removeChild(toastStyle)
      }

      // 이벤트 리스너 정리 (실제 함수 참조가 없어도 안전함)
      const fullscreenChangeEvents = [
        'fullscreenchange',
        'webkitfullscreenchange', 
        'mozfullscreenchange',
        'MSFullscreenChange'
      ]
      
      fullscreenChangeEvents.forEach(eventName => {
        try {
          document.removeEventListener(eventName, () => {})
        } catch (error) {
          // 이벤트 리스너 제거 실패는 무시
        }
      })

      if (typeof window !== 'undefined') {
        try {
          window.removeEventListener('orientationchange', () => {})
        } catch (error) {
          // 이벤트 리스너 제거 실패는 무시
        }
      }

      // PIXI 컨테이너 정리
      this.container.removeChildren()
      
      console.log('🗑️ HUDManager 정리 완료')
      
    } catch (error) {
      console.warn('⚠️ HUDManager 정리 중 오류:', error)
    }
  }
}
