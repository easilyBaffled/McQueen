import React, { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { NewsItem } from '../types/stock';
import { NewsIndicator } from './NewsIndicator';
import { NewsTooltip } from './NewsTooltip';
import { calculateNewsPosition } from '../lib/chart';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineChartProps {
  data: number[];
  news?: NewsItem[];
  showAxis?: boolean;
}

export function LineChart({ data, news = [], showAxis = false }: LineChartProps) {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const { width, height } = chartRef.current.getBoundingClientRect();
        setChartDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const minPrice = Math.min(...data);
  const maxPrice = Math.max(...data);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  const chartData = {
    labels: data.map((_, i) => i.toString()),
    datasets: [
      {
        data,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        display: showAxis,
      },
      y: {
        display: showAxis,
        min: minPrice - padding,
        max: maxPrice + padding,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const handleNewsClick = (news: NewsItem, position: { x: number; y: number }) => {
    setSelectedNews(news);
    setTooltipPosition(position);
  };

  return (
    <div ref={chartRef} className="relative h-full">
      <Line data={chartData} options={options} />
      
      {chartDimensions.width > 0 && news.map((newsItem) => {
        const position = calculateNewsPosition(
          newsItem,
          data,
          chartDimensions.width,
          chartDimensions.height
        );
        
        return (
          <NewsIndicator
            key={newsItem.id}
            news={newsItem}
            x={position.x}
            y={position.y}
            onClick={(news) => handleNewsClick(news, position)}
          />
        );
      })}

      {selectedNews && (
        <NewsTooltip
          news={selectedNews}
          onClose={() => setSelectedNews(null)}
          position={tooltipPosition}
        />
      )}
    </div>
  );
}