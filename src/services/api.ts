
// API service for fetching energy data from the backend
const API_BASE_URL = 'http://localhost:3000/api';

export interface EnergyData {
  id: number;
  timestamp: string;
  location: string;
  slave_id: number;
  slave_name: string;
  current_r: number;
  current_y: number;
  current_b: number;
  voltage_ry: number;
  voltage_yb: number;
  voltage_br: number;
  power_factor_r: number;
  power_factor_y: number;
  power_factor_b: number;
  active_energy: number;
}

export const fetchLatestData = async (): Promise<EnergyData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/energy-data/latest`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching latest data:', error);
    throw error;
  }
};

export const fetchRangeData = async (fromTime: string, toTime: string): Promise<EnergyData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/energy-data/range?fromTime=${encodeURIComponent(fromTime)}&toTime=${encodeURIComponent(toTime)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching range data:', error);
    throw error;
  }
};
