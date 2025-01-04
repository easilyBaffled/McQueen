import { NewsItem } from '../types/stock';

export function calculateNewsPosition(
  news: NewsItem,
  data: number[],
  chartWidth: number,
  chartHeight: number
): { x: number; y: number } {
  // Calculate the time range of the price history (assuming 5-second intervals)
  const timeRange = 5000 * data.length; // 5 seconds per data point
  const startTime = Date.now() - timeRange;
  
  // Find the index in the data array corresponding to the news timestamp
  const timeProgress = (news.timestamp - startTime) / timeRange;
  const dataIndex = Math.floor(timeProgress * (data.length - 1));
  const normalizedIndex = Math.max(0, Math.min(dataIndex, data.length - 1));
  
  // X position is based on the time
  const x = (normalizedIndex / (data.length - 1)) * chartWidth;
  
  // Y position is based on the price at that point
  const price = data[normalizedIndex];
  const minPrice = Math.min(...data);
  const maxPrice = Math.max(...data);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1; // Add 10% padding to top and bottom
  
  // Calculate y position with padding
  const y = chartHeight - (
    ((price - (minPrice - padding)) / (priceRange + 2 * padding)) * chartHeight
  );
  
  return { x, y };
}