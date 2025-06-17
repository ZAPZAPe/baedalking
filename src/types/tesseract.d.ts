declare module 'tesseract.js' {
  export interface Worker {
    recognize(image: string | File | Blob | ImageData): Promise<RecognizeResult>;
    terminate(): Promise<void>;
  }

  export interface RecognizeResult {
    data: {
      text: string;
      confidence: number;
      lines: any[];
      words: any[];
      symbols: any[];
    };
  }

  export function createWorker(
    langs?: string,
    oem?: number,
    config?: any
  ): Promise<Worker>;
} 