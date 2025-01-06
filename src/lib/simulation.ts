import { StockData } from '../types/simulation';

export async function loadSimulationData(file: File): Promise<StockData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        validateSimulationData(data);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid simulation data format'));
      }
    };

    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
}

function validateSimulationData(data: any): asserts data is StockData {
  if (!data.stockSymbol || typeof data.stockSymbol !== 'string') {
    throw new Error('Invalid stock symbol');
  }
  
  if (!data.startingPrice || typeof data.startingPrice !== 'number') {
    throw new Error('Invalid starting price');
  }
  
  if (!data.totalVolume || typeof data.totalVolume !== 'number') {
    throw new Error('Invalid total volume');
  }
  
  if (!Array.isArray(data.trades)) {
    throw new Error('Invalid trades data');
  }
  
  data.trades.forEach((trade: any, index: number) => {
    if (!trade.timestamp || !/^\d{2}:\d{2}:\d{2}$/.test(trade.timestamp)) {
      throw new Error(`Invalid timestamp at index ${index}`);
    }
    if (typeof trade.price !== 'number') {
      throw new Error(`Invalid price at index ${index}`);
    }
    if (typeof trade.volumeTraded !== 'number') {
      throw new Error(`Invalid volume at index ${index}`);
    }
    if (!['UP', 'DOWN', 'FLAT'].includes(trade.trend)) {
      throw new Error(`Invalid trend at index ${index}`);
    }
  });
}