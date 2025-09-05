/**
 * 캐릭터 파츠들을 하나의 이미지로 합성하는 유틸리티
 */

export interface CharacterParts {
  hair: string
  top: string
  bottom: string
  emotion: string
}

export interface CharacterComposition {
  width: number
  height: number
  layers: {
    src: string
    x: number
    y: number
    width: number
    height: number
  }[]
}

/**
 * 캐릭터 파츠들을 하나의 이미지로 합성
 */
export async function composeCharacterImage(parts: CharacterParts): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Canvas context를 생성할 수 없습니다'))
      return
    }

    // 캐릭터 이미지 크기 설정 (픽셀 아트 스타일)
    const CHARACTER_WIDTH = 64
    const CHARACTER_HEIGHT = 96
    
    canvas.width = CHARACTER_WIDTH
    canvas.height = CHARACTER_HEIGHT

    // 이미지 로딩을 위한 Promise 배열
    const imagePromises: Promise<HTMLImageElement>[] = []
    
    // 레이어 순서: 기본 캐릭터 베이스 -> 하의 -> 상의 -> 헤어 -> 감정
    const layers = [
      { src: '/assets/character/default-character.png', name: 'base' },
      { src: `/assets/character/${parts.bottom}`, name: 'bottom', skip: parts.bottom === 'none.png' },
      { src: `/assets/character/${parts.top}`, name: 'top', skip: parts.top === 'none.png' },
      { src: `/assets/character/${parts.hair}`, name: 'hair', skip: parts.hair === 'none.png' },
      { src: `/assets/character/emotions/${parts.emotion}`, name: 'emotion' }
    ]

    // 모든 이미지 로딩
    layers.forEach(layer => {
      // "없음" 옵션은 건너뛰기
      if ((layer as any).skip) {
        imagePromises.push(Promise.resolve(null as any))
        return
      }
      
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      const promise = new Promise<HTMLImageElement>((resolveImg, rejectImg) => {
        img.onload = () => resolveImg(img)
        img.onerror = () => {
          console.warn(`이미지 로딩 실패: ${layer.src}`)
          // 감정 이미지가 없으면 기본 이모티콘으로 대체
          if (layer.name === 'emotion') {
            // 감정은 텍스트로 그리기
            resolveImg(null as any)
          } else {
            rejectImg(new Error(`이미지 로딩 실패: ${layer.src}`))
          }
        }
      })
      
      img.src = layer.src
      imagePromises.push(promise)
    })

    // 모든 이미지가 로딩되면 합성
    Promise.all(imagePromises).then(images => {
      // 배경을 투명하게 설정
      ctx.clearRect(0, 0, CHARACTER_WIDTH, CHARACTER_HEIGHT)
      
      // 각 레이어를 순서대로 그리기
      images.forEach((img, index) => {
        const layer = layers[index]
        
        // "없음" 옵션은 건너뛰기
        if ((layer as any).skip) {
          return
        }
        
        if (img && layer.name !== 'emotion') {
          // 일반 이미지 파츠들 (기본 캐릭터 베이스 포함)
          ctx.drawImage(img, 0, 0, CHARACTER_WIDTH, CHARACTER_HEIGHT)
        } else if (layer.name === 'emotion') {
          // 감정 이모티콘을 텍스트로 그리기
          const emotionEmoji = getEmotionEmoji(parts.emotion)
          ctx.font = '24px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(emotionEmoji, CHARACTER_WIDTH / 2, 20)
        }
      })

      // Canvas를 Data URL로 변환
      const dataURL = canvas.toDataURL('image/png')
      resolve(dataURL)
    }).catch(reject)
  })
}

/**
 * 감정 ID에 해당하는 이모티콘 반환
 */
function getEmotionEmoji(emotionId: string): string {
  const emotionMap: Record<string, string> = {
    'happy': '😊',
    'angry': '😠',
    'tired': '😴',
    'heart': '😍',
    'default': '😊'
  }
  
  return emotionMap[emotionId] || '😊'
}

/**
 * 합성된 캐릭터 이미지를 서버에 업로드
 */
export async function uploadCharacterImage(imageDataUrl: string, userId: string): Promise<string> {
  try {
    // Data URL을 Blob으로 변환
    const response = await fetch(imageDataUrl)
    const blob = await response.blob()
    
    // FormData 생성
    const formData = new FormData()
    formData.append('image', blob, `character_${userId}_${Date.now()}.png`)
    formData.append('userId', userId)
    
    // 서버에 업로드
    const uploadResponse = await fetch('/api/character/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!uploadResponse.ok) {
      throw new Error('캐릭터 이미지 업로드 실패')
    }
    
    const result = await uploadResponse.json()
    return result.imageUrl
  } catch (error) {
    console.error('캐릭터 이미지 업로드 오류:', error)
    throw error
  }
}
