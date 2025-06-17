import { memo } from 'react';

interface AdvertisementProps {
  position: 'top' | 'bottom';
}

export const Advertisement = memo(({ position }: AdvertisementProps) => (
  <div className={`w-full max-w-md mx-auto px-4 ${position === 'top' ? 'mb-6' : 'mt-6'}`}>
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-lg">
      <div className="text-center text-white">
        <p className="text-xs text-blue-200 mb-2 font-medium">Advertisement</p>
        <div className="bg-white/5 rounded-lg h-[100px] flex items-center justify-center border border-white/10">
          <p className="text-sm text-blue-200">광고 영역</p>
        </div>
      </div>
    </div>
  </div>
));

Advertisement.displayName = 'Advertisement'; 