// src/components/ui/PopularContentCardPlaceholder.tsx (Yeni dosya)
"use client";

import React from 'react';

const PopularContentCardPlaceholder = () => {
  return (
    <div className="flex flex-col bg-popular-card-bg rounded-xl overflow-hidden shadow-popular-card h-full animate-pulse">
      {/* Banner Placeholder */}
      <div className="w-full aspect-16/8 bg-gray-700/50"></div>

      {/* İçerik Placeholder */}
      <div className="p-3.5 flex gap-3 items-start">
        <div className="w-[60px] h-[60px] bg-gray-600/50 rounded-md flex-shrink-0"></div>
        <div className="flex-grow min-w-0 space-y-2">
          <div className="h-4 bg-gray-600/50 rounded w-3/4"></div> {/* Başlık */}
          <div className="h-3 bg-gray-600/50 rounded w-full"></div>   {/* Açıklama satır 1 */}
          <div className="h-3 bg-gray-600/50 rounded w-5/6"></div>   {/* Açıklama satır 2 */}
          <div className="h-2.5 bg-gray-600/50 rounded w-1/2 mt-1"></div> {/* Tarih */}
        </div>
      </div>

      {/* İstatistikler Placeholder */}
      <div className="mt-auto px-3.5 py-2.5 border-t border-popular-card-border-top flex justify-around items-center">
        <div className="h-5 bg-gray-600/50 rounded w-10"></div>
        <div className="h-5 bg-gray-600/50 rounded w-6"></div>
        <div className="h-5 bg-gray-600/50 rounded w-10"></div>
      </div>
    </div>
  );
};

export default PopularContentCardPlaceholder;