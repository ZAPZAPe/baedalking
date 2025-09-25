/**
 * 🎮 Placement Controller - 상하좌우 버튼 기반 배치 컨트롤러
 * 
 * 모바일 친화적인 D-Pad 방식의 컨트롤을 제공합니다.
 * 드래그 대신 버튼을 통해 정확한 그리드 단위 이동을 구현합니다.
 */

import * as PIXI from 'pixi.js'

export interface PlacementControllerConfig {
  app: PIXI.Application
  container: PIXI.Container
  uiLayer: PIXI.Container
  onMove: (x: number, y: number) => void
  onPlace: () => Promise<void>
  onCancel: () => void
}

interface ControlButton {
  button: PIXI.Container
  action: () => Promise<void>
  touchStart?: () => void
  touchEnd?: () => void
}

export class PlacementController {
  private app: PIXI.Application
  private container: PIXI.Container
  private uiLayer: PIXI.Container
  
  // 콜백 함수들
  private onMove: (x: number, y: number) => void
  private onPlace: () => Promise<void>
  private onCancel: () => void
  
  // 현재 위치
  private currentX: number = 0
  private currentY: number = 0
  
  // 컨트롤 UI
  private controlPanel: PIXI.Container | null = null
  private buttons: Map<string, ControlButton> = new Map()
  private dpadLayout: { buttonSize: number, gap: number, dpadX: number, dpadY: number, upY: number, downY: number } | null = null
  
  // 자동 이동 (버튼 누르고 있을 때)
  private autoMoveInterval: NodeJS.Timeout | null = null
  private autoMoveDirection: string | null = null
  private autoMoveDelay: number = 500 // 초기 딜레이
  private autoMoveSpeed: number = 100 // 반복 속도
  
  // 활성화 상태
  private isActive: boolean = false
  private targetObject: PIXI.Container | null = null
  
  constructor(config: PlacementControllerConfig) {
    this.app = config.app
    this.container = config.container
    this.uiLayer = config.uiLayer
    this.onMove = config.onMove
    this.onPlace = config.onPlace
    this.onCancel = config.onCancel
    
    this.createControlPanel()
  }
  
  /**
   * 🎮 컨트롤 패널 생성
   */
  private createControlPanel(): void {
    this.controlPanel = new PIXI.Container()
    this.controlPanel.visible = false
    
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    // 패널 배경 (반투명)
    const background = new PIXI.Graphics()
    background.beginFill(0x000000, 0.3)
    background.drawRoundedRect(0, 0, screenWidth, 280, 20)
    background.endFill()
    background.y = screenHeight - 280
    this.controlPanel.addChild(background)
    
    // D-Pad 생성
    this.createDPad()
    
    // 액션 버튼들 생성
    this.createActionButtons()
    
    this.uiLayer.addChild(this.controlPanel)
  }
  
  /**
   * 🕹️ D-Pad (방향키) 생성
   */
  private createDPad(): void {
    const dpadContainer = new PIXI.Container()
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    // D-Pad 중심 위치 (반응형)
    const dpadX = Math.max(80, screenWidth * 0.15) // 화면 너비의 15%
    const dpadY = screenHeight - 140
    
    // 버튼 크기와 간격 (화면 크기에 비례)
    const baseSize = Math.min(screenWidth, screenHeight) * 0.08 // 화면 크기의 8%
    const buttonSize = Math.max(40, Math.min(80, baseSize)) // 최소 40, 최대 80
    const gap = Math.max(3, buttonSize * 0.08) // 버튼 크기의 8%
    
    // 상하좌우 버튼 생성
    const directions = [
      { key: 'up', x: 0, y: -buttonSize - gap, arrow: '↑', dx: 0, dy: -1 },
      { key: 'down', x: 0, y: buttonSize + gap, arrow: '↓', dx: 0, dy: 1 },
      { key: 'left', x: -buttonSize - gap, y: 0, arrow: '←', dx: -1, dy: 0 },
      { key: 'right', x: buttonSize + gap, y: 0, arrow: '→', dx: 1, dy: 0 }
    ]
    
    directions.forEach(dir => {
      const button = this.createDirectionButton(
        dir.arrow,
        dpadX + dir.x,
        dpadY + dir.y,
        buttonSize,
        async () => await this.moveObject(dir.dx, dir.dy),
        dir.key
      )
      
      this.buttons.set(dir.key, button)
      dpadContainer.addChild(button.button)
    })
    
    // 중앙 장식 (반응형 크기)
    const centerRadius = Math.max(15, Math.min(35, buttonSize * 0.4)) // 버튼 크기의 40%
    const center = new PIXI.Graphics()
    center.beginFill(0x2a2a2a, 0.8)
    center.drawCircle(dpadX, dpadY, centerRadius)
    center.endFill()
    center.lineStyle(2, 0x4a4a4a)
    center.drawCircle(dpadX, dpadY, centerRadius)
    dpadContainer.addChild(center)
    
    // D-Pad 레이아웃 저장 (액션 버튼 정렬에 사용)
    this.dpadLayout = {
      buttonSize,
      gap,
      dpadX,
      dpadY,
      upY: dpadY - (buttonSize + gap),
      downY: dpadY + (buttonSize + gap)
    }

    this.controlPanel!.addChild(dpadContainer)
  }
  
  /**
   * 🎯 방향 버튼 생성
   */
  private createDirectionButton(
    label: string,
    x: number,
    y: number,
    size: number,
    action: () => Promise<void>,
    key: string
  ): ControlButton {
    const button = new PIXI.Container()
    button.x = x
    button.y = y
    
    // 버튼 배경
    const bg = new PIXI.Graphics()
    bg.beginFill(0x3a3a3a, 0.9)
    bg.drawRoundedRect(-size/2, -size/2, size, size, 10)
    bg.endFill()
    bg.lineStyle(2, 0x5a5a5a)
    bg.drawRoundedRect(-size/2, -size/2, size, size, 10)
    button.addChild(bg)
    
    // 화살표 텍스트 (반응형 폰트 크기)
    const fontSize = Math.max(20, Math.min(36, size * 0.5)) // 버튼 크기의 50%
    const text = new PIXI.Text(label, {
      fontFamily: 'Arial',
      fontSize: fontSize,
      fill: 0xffffff,
      fontWeight: 'bold'
    })
    text.anchor.set(0.5)
    button.addChild(text)
    
    // 인터랙션 설정
    button.eventMode = 'static'
    button.cursor = 'pointer'
    
    const controlButton: ControlButton = {
      button,
      action,
      touchStart: () => this.startAutoMove(key, action),
      touchEnd: () => this.stopAutoMove()
    }
    
    // 터치/마우스 이벤트
    button.on('pointerdown', async () => {
      bg.tint = 0x00ff00
      await action()
      if (controlButton.touchStart) {
        controlButton.touchStart()
      }
    })
    
    button.on('pointerup', () => {
      bg.tint = 0xffffff
      if (controlButton.touchEnd) {
        controlButton.touchEnd()
      }
    })
    
    button.on('pointerupoutside', () => {
      bg.tint = 0xffffff
      if (controlButton.touchEnd) {
        controlButton.touchEnd()
      }
    })
    
    button.on('pointerover', () => {
      bg.alpha = 1
      button.scale.set(1.1)
    })
    
    button.on('pointerout', () => {
      bg.alpha = 0.9
      button.scale.set(1)
    })
    
    return controlButton
  }
  
  /**
   * 🎬 액션 버튼들 생성
   */
  private createActionButtons(): void {
    const screenWidth = this.app.screen.width
    // D-Pad 기준이 준비되어 있으면 그 크기/높이에 맞춘다
    const baseRightMargin = Math.max(80, screenWidth * 0.12)
    const buttonSize = this.dpadLayout ? this.dpadLayout.buttonSize : Math.max(50, Math.min(90, Math.min(this.app.screen.width, this.app.screen.height) * 0.09))
    const upY = this.dpadLayout ? this.dpadLayout.upY : (this.app.screen.height - 160)
    const downY = this.dpadLayout ? this.dpadLayout.downY : (this.app.screen.height - 80)
    // 더 오른쪽으로: 버튼 크기의 80%만큼 우측으로
    const rightNudge = Math.floor(buttonSize * 0.8)
    const rightMargin = Math.max(10, baseRightMargin - rightNudge)
    
    const actions = [
      {
        key: 'place',
        icon: '✓',
        color: 0x00ff00,
        x: screenWidth - rightMargin,
        y: upY,
        action: async () => await this.onPlace()
      },
      {
        key: 'cancel',
        icon: '✕',
        color: 0xff0000,
        x: screenWidth - rightMargin,
        y: downY,
        action: async () => this.onCancel()
      }
    ]
    
    actions.forEach(act => {
      const button = this.createActionButton(
        act.icon,
        act.x,
        act.y,
        buttonSize,
        act.color,
        act.action
      )
      
      this.buttons.set(act.key, button)
      this.controlPanel!.addChild(button.button)
    })
  }
  
  /**
   * 🔘 액션 버튼 생성
   */
  private createActionButton(
    icon: string,
    x: number,
    y: number,
    size: number,
    color: number,
    action: () => Promise<void>
  ): ControlButton {
    const button = new PIXI.Container()
    button.x = x
    button.y = y
    
    // 네모(라운드) 버튼 배경
    const bg = new PIXI.Graphics()
    const radius = Math.max(6, Math.floor(size * 0.18))
    bg.beginFill(0x2a2a2a, 0.9) // 어두운 배경 유지
    bg.drawRoundedRect(-size/2, -size/2, size, size, radius)
    bg.endFill()
    bg.lineStyle(3, color, 0.9) // 컬러 보더
    bg.drawRoundedRect(-size/2, -size/2, size, size, radius)
    button.addChild(bg)
    
    // 아이콘 텍스트 (요청 색상 적용)
    const text = new PIXI.Text({
      text: icon,
      style: {
        fontSize: Math.max(16, Math.floor(size * 0.4)),
        fill: color, // 초록/빨강 아이콘
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 3 }
      }
    })
    text.anchor.set(0.5)
    text.x = 0
    text.y = 0
    button.addChild(text)
    
    const controlButton: ControlButton = {
      button,
      action
    }
    
    button.on('pointerdown', async () => {
      bg.tint = color
      bg.alpha = 0.5
      button.scale.set(0.95)
      await action()
    })
    
    button.on('pointerup', () => {
      bg.tint = 0xffffff
      bg.alpha = 0.9
      button.scale.set(1)
    })
    
    button.eventMode = 'static'
    button.cursor = 'pointer'
    
    return controlButton
  }
  
  /**
   * 🚀 자동 이동 시작 (버튼 길게 누를 때)
   */
  private startAutoMove(direction: string, action: () => Promise<void>): void {
    this.stopAutoMove()
    
    this.autoMoveDirection = direction
    
    // 초기 딜레이 후 반복 시작
    setTimeout(() => {
      if (this.autoMoveDirection === direction) {
        this.autoMoveInterval = setInterval(async () => {
          if (this.autoMoveDirection === direction) {
            await action()
          } else {
            this.stopAutoMove()
          }
        }, this.autoMoveSpeed)
      }
    }, this.autoMoveDelay)
  }
  
  /**
   * 🛑 자동 이동 중지
   */
  private stopAutoMove(): void {
    if (this.autoMoveInterval) {
      clearInterval(this.autoMoveInterval)
      this.autoMoveInterval = null
    }
    this.autoMoveDirection = null
  }
  
  /**
   * 📍 오브젝트 이동
   */
  private async moveObject(dx: number, dy: number): Promise<void> {
    if (!this.isActive || !this.targetObject) return
    
    this.currentX += dx
    this.currentY += dy
    
    // 이동 콜백 호출
    this.onMove(this.currentX, this.currentY)
  }
  
  /**
   * ✅ 컨트롤러 활성화
   */
  public activate(targetObject: PIXI.Container): void {
    this.isActive = true
    this.targetObject = targetObject
    this.currentX = 0
    this.currentY = 0
    
    if (this.controlPanel) {
      this.controlPanel.visible = true
    }
    
    // 키보드 이벤트 등록
    this.registerKeyboardEvents()
  }
  
  /**
   * ❌ 컨트롤러 비활성화
   */
  public deactivate(): void {
    this.isActive = false
    this.targetObject = null
    
    if (this.controlPanel) {
      this.controlPanel.visible = false
    }
    
    this.stopAutoMove()
    
    // 키보드 이벤트 해제
    this.unregisterKeyboardEvents()
  }
  
  /**
   * ⌨️ 키보드 이벤트 등록
   */
  private registerKeyboardEvents(): void {
    // 브라우저 환경에서만 키보드 이벤트 등록
    if (typeof window === 'undefined') return
    
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!this.isActive) return
      
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          await this.moveObject(0, -1)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          await this.moveObject(0, 1)
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          await this.moveObject(-1, 0)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          await this.moveObject(1, 0)
          break
        case 'Enter':
        case ' ':
          await this.onPlace()
          break
        case 'Escape':
        case 'x':
        case 'X':
          await this.onCancel()
          break
      }
    }
    
    // 브라우저 환경에서만 이벤트 리스너 등록
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown)
    }
    
    // 클린업 함수 저장
    (this as any).keyboardCleanup = () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }
  
  /**
   * ⌨️ 키보드 이벤트 해제
   */
  private unregisterKeyboardEvents(): void {
    if ((this as any).keyboardCleanup) {
      (this as any).keyboardCleanup()
      delete (this as any).keyboardCleanup
    }
  }
  
  /**
   * 📍 현재 위치 가져오기
   */
  public getCurrentPosition(): { x: number, y: number } {
    return { x: this.currentX, y: this.currentY }
  }
  
  /**
   * 📍 위치 설정
   */
  public setPosition(x: number, y: number): void {
    this.currentX = x
    this.currentY = y
    if (this.isActive) {
      this.onMove(x, y)
    }
  }
  
  /**
   * 🧹 정리
   */
  public destroy(): void {
    this.deactivate()
    
    if (this.controlPanel) {
      this.controlPanel.destroy()
      this.controlPanel = null
    }
    
    this.buttons.clear()
  }
}
