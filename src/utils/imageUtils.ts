import CryptoJS from 'crypto-js';

// 파일을 ArrayBuffer로 변환
export const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// 이미지 해시 생성 (SHA-256)
export const generateImageHash = async (file: File): Promise<string> => {
  const arrayBuffer = await fileToArrayBuffer(file);
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
  return CryptoJS.SHA256(wordArray).toString();
};

// 이미지 크기 조정 (모바일 최적화)
export const resizeImage = (file: File, maxWidth: number = 800): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        }
      }, file.type, 0.8);
    };
    
    img.src = URL.createObjectURL(file);
  });
}; 