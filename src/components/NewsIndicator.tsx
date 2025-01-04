import React from 'react';
import { NewsItem } from '../types/stock';
import { AlertCircle } from 'lucide-react';

interface NewsIndicatorProps {
  news: NewsItem;
  x: number;
  y: number;
  onClick: (news: NewsItem) => void;
}

export function NewsIndicator({ news, x, y, onClick }: NewsIndicatorProps) {
  const impactColor = news.impact >= 0 ? 'text-green-500' : 'text-red-500';
  
  return (
    <div 
      className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 
        hover:scale-110 transition-transform ${impactColor}`}
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(news);
      }}
      title={news.title}
    >
      <AlertCircle size={16} className="fill-current opacity-50" />
    </div>
  );
}