
import { EnergyData } from '../services/api';

export const generateChartData = (apiData: EnergyData[], selectedFeeders: string[], selectedParameters: string[]) => {
  const data = [];
  const now = new Date();
  
  // Create 24 data points representing the last 24 * 40 seconds (16 minutes)
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 40 * 1000);
    const dataPoint: any = {
      timestamp: timestamp.toLocaleTimeString(),
      fullTimestamp: timestamp
    };
    
    selectedFeeders.forEach(feeder => {
      selectedParameters.forEach(param => {
        const key = `${feeder}_${param}`;
        const feederData = apiData.find(item => item.slave_name === feeder);
        
        if (feederData && feederData[param as keyof EnergyData] !== undefined) {
          // Add some variation to simulate time series data
          const baseValue = feederData[param as keyof EnergyData] as number;
          const variation = (Math.random() - 0.5) * 0.1 * baseValue;
          dataPoint[key] = Math.max(0, Number((baseValue + variation).toFixed(2)));
        } else {
          dataPoint[key] = 0;
        }
      });
    });
    
    data.push(dataPoint);
  }
  
  return data;
};
