import React from 'react';
import { NewsItem } from '../types/stock';
import { X } from 'lucide-react';

interface NewsTooltipProps {
  news: NewsItem;
  onClose: () => void;
  position: { x: number; y: number };
}

export function NewsTooltip({ news, onClose, position }: NewsTooltipProps) {
  return (
    <div 
      className="absolute z-50 bg-white rounded-lg shadow-lg p-4 w-64"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 20}px`,
        transform: 'translateX(-50%)'
      }}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X size={16} />
      </button>
      
      <h3 className="font-bold text-sm mb-2">{news.title}</h3>
      <p className="text-xs text-gray-600 mb-2">{news.content}</p>
      <p className={`text-xs font-semibold ${news.impact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        Impact: {news.impact > 0 ? '+' : ''}{news.impact}%
      </p>
    </div>
  );
}