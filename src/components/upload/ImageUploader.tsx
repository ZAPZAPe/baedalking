'use client';

import { useState, useRef } from 'react';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
}

export default function ImageUploader({ onImageSelect }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center cursor-pointer hover:border-yellow-400 transition-all bg-white/5 hover:bg-white/10"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {preview ? (
        <img
          src={preview}
          alt="미리보기"
          className="max-h-64 mx-auto rounded-lg"
        />
      ) : (
        <div className="space-y-4">
          <svg
            className="w-16 h-16 mx-auto text-white/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div className="text-white">
            <span className="font-bold text-yellow-300">클릭</span>하여 배달 실적 이미지 업로드
          </div>
          <div className="text-sm text-blue-200">
            PNG, JPG, JPEG 파일만 가능 (최대 10MB)
          </div>
        </div>
      )}
    </div>
  );
} 