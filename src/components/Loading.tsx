'use client';

import React from 'react';

interface LoadingProps {
  type?: 'default' | 'skeleton' | 'spinner';
  rows?: number;
}

const Loading: React.FC<LoadingProps> = ({ type = 'default', rows = 3 }) => {
  if (type === 'skeleton') {
    return (
      <div className="animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="mb-4">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'spinner') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full animate-ping"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-700 rounded-full w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h2 className="text-white text-xl font-bold mb-2 animate-pulse">로딩 중...</h2>
          <p className="text-blue-200 text-sm animate-pulse">잠시만 기다려주세요</p>
        </div>
      </div>
    </div>
  );
};

export default Loading; 