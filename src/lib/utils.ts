import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function generateMockPriceData(basePrice: number, count: number): number[] {
  const prices: number[] = [basePrice];
  for (let i = 1; i < count; i++) {
    const previousPrice = prices[i - 1];
    const maxChange = previousPrice * 0.05; // 5% max change
    const change = (Math.random() * 2 - 1) * maxChange;
    prices.push(Number((previousPrice + change).toFixed(2)));
  }
  return prices;
}