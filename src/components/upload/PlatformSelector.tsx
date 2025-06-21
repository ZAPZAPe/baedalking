'use client';

import { useState } from 'react';
import Image from 'next/image';

type Platform = 'baemin' | 'coupang';

interface PlatformSelectorProps {
  onSelect: (platform: Platform) => void;
}

export default function PlatformSelector({ onSelect }: PlatformSelectorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  const handleSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    onSelect(platform);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">플랫폼 선택</h2>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleSelect('baemin')}
          className={`p-4 rounded-lg border-2 transition-colors ${
            selectedPlatform === 'baemin'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-200'
          }`}
        >
          <div className="flex flex-col items-center">
            <Image
              src="/baemin-logo.svg"
              alt="배민"
              width={64}
              height={64}
              className="w-16 h-16 object-contain mb-2"
            />
            <span className="font-medium">배민</span>
          </div>
        </button>
        <button
          onClick={() => handleSelect('coupang')}
          className={`p-4 rounded-lg border-2 transition-colors ${
            selectedPlatform === 'coupang'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-200'
          }`}
        >
          <div className="flex flex-col items-center">
            <Image
              src="/coupang-logo.svg"
              alt="쿠팡이츠"
              width={64}
              height={64}
              className="w-16 h-16 object-contain mb-2"
            />
            <span className="font-medium">쿠팡이츠</span>
          </div>
        </button>
      </div>
    </div>
  );
} 